#!/usr/bin/env node
/**
 * Matches puzzle words to Apple Music track IDs via the Apple Music Catalog API.
 * Uses JWT auth (same as production) — far more generous rate limits than iTunes Search API.
 *
 * Scope:
 *   - Archive: all dates
 *   - Themed: all puzzles
 *
 * Usage:
 *   node scripts/match-itunes.js            -- fetch + write scripts/itunes-matches.json (resumes)
 *   node scripts/match-itunes.js --apply    -- also write itunesId back to source JSONs
 *   node scripts/match-itunes.js --review   -- print low-confidence matches for inspection
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { webcrypto } from 'crypto';
const crypto = webcrypto;

const __dirname = dirname(fileURLToPath(import.meta.url));
const APPLY   = process.argv.includes('--apply');
const REVIEW  = process.argv.includes('--review');

const CONCURRENCY = 5;
const DELAY_MS    = 100;
const CONFIDENCE_THRESHOLD = 0.6;

const crosswordsPath = join(__dirname, '../src/lib/data/crosswords.json');
const themedPath     = join(__dirname, '../src/lib/data/themed_crosswords.json');
const matchesPath    = join(__dirname, 'itunes-matches.json');

// --- Load env ---
const envPath = join(__dirname, '../.env');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf-8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); const v = l.slice(i + 1).trim(); return [l.slice(0, i).trim(), v.replace(/^['"]|['"]$/g, '')]; })
);

const TEAM_ID    = env.MUSICKIT_TEAM_ID;
const KEY_ID     = env.MUSICKIT_KEY_ID;
const PRIVKEY_B64 = env.MUSICKIT_PRIVATE_KEY;

if (!TEAM_ID || !KEY_ID || !PRIVKEY_B64) {
  console.error('Missing MUSICKIT_* env vars in .env');
  process.exit(1);
}

// --- JWT generation (mirrors musickit.server.js exactly, using Web Crypto) ---
let cachedToken = null;
let cachedTokenExpiry = 0;

async function getToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && now < cachedTokenExpiry - 300) return cachedToken;

  const pem = Buffer.from(PRIVKEY_B64, 'base64').toString('utf-8');
  const pemContents = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  const derBytes = Uint8Array.from(Buffer.from(pemContents, 'base64'));

  const key = await crypto.subtle.importKey(
    'pkcs8', derBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign']
  );

  const toBase64Url = (obj) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');

  const exp = now + 3600;
  const header  = toBase64Url({ alg: 'ES256', kid: KEY_ID });
  const payload = toBase64Url({ iss: TEAM_ID, iat: now, exp });
  const signingInput = `${header}.${payload}`;

  const sigBuf = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(signingInput)
  );

  const sig = Buffer.from(sigBuf).toString('base64url');
  cachedToken       = `${signingInput}.${sig}`;
  cachedTokenExpiry = exp;
  return cachedToken;
}

// --- Load data ---
const crosswords = JSON.parse(readFileSync(crosswordsPath, 'utf-8'));
const themed     = JSON.parse(readFileSync(themedPath,     'utf-8'));

const matches = existsSync(matchesPath)
  ? JSON.parse(readFileSync(matchesPath, 'utf-8'))
  : {};

// Clear out previous API failures so they get retried with the fixed auth
for (const [k, v] of Object.entries(matches)) {
  if (v.error) delete matches[k];
}

// --- Build target list ---
const targetArchiveDates = new Set(Object.keys(crosswords));

const targets = [];
for (const date of targetArchiveDates) {
  if (crosswords[date].skipAppleMusicMigration) continue;
  for (const word of crosswords[date].words ?? []) {
    if (word.noAutoMatch) continue;
    if (!word.itunesId && word.song_title && word.artist_name) {
      targets.push({ source: 'archive', key: date, word });
    }
  }
}
for (const key of Object.keys(themed)) {
  if (themed[key].skipAppleMusicMigration) continue;
  for (const word of themed[key].words ?? []) {
    if (word.noAutoMatch) continue;
    if (!word.itunesId && word.song_title && word.artist_name) {
      targets.push({ source: 'themed', key, word });
    }
  }
}

const pending = targets.filter(({ source, key, word }) => !matches[`${source}:${key}:${word.word}`]);

console.log(`\nTotal: ${targets.length} | Already done: ${targets.length - pending.length} | Pending: ${pending.length}`);
console.log(`Using Apple Music Catalog API (JWT auth)`);
console.log(`Concurrency: ${CONCURRENCY}  Delay: ${DELAY_MS}ms  Est: ~${Math.ceil((pending.length / CONCURRENCY) * DELAY_MS / 1000)}s\n`);

// --- Scoring ---
function normalize(str) {
  return str
    .toLowerCase()
    .replace(/\(feat\..*?\)/gi, '')
    .replace(/\(ft\..*?\)/gi, '')
    .replace(/\(.*?remix.*?\)/gi, '')
    .replace(/\(.*?version.*?\)/gi, '')
    .replace(/\(.*?edit.*?\)/gi, '')
    .replace(/\(.*?live.*?\)/gi, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function similarity(a, b) {
  const na = normalize(a), nb = normalize(b);
  if (na === nb) return 1.0;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  const wa = new Set(na.split(' ')), wb = new Set(nb.split(' '));
  const intersection = [...wa].filter(w => wb.has(w)).length;
  return intersection / new Set([...wa, ...wb]).size;
}

function scoreCandidate(result, songTitle, artistName) {
  return similarity(result.attributes.name ?? '', songTitle) * 0.6
       + similarity(result.attributes.artistName ?? '', artistName) * 0.4;
}

// --- Catalog API search ---
async function searchCatalog(songTitle, artistName) {
  const term = encodeURIComponent(`${songTitle} ${artistName}`);
  const url  = `https://api.music.apple.com/v1/catalog/us/search?term=${term}&types=songs&limit=5`;

  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${await getToken()}` },
    signal: AbortSignal.timeout(10000),
  });

  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  let results = data?.results?.songs?.data ?? [];

  // Fallback: title-only search if no results
  if (results.length === 0) {
    const termOnly = encodeURIComponent(songTitle);
    const resp2 = await fetch(
      `https://api.music.apple.com/v1/catalog/us/search?term=${termOnly}&types=songs&limit=5`,
      { headers: { Authorization: `Bearer ${await getToken()}` }, signal: AbortSignal.timeout(10000) }
    );
    if (resp2.ok) {
      const data2 = await resp2.json();
      results = data2?.results?.songs?.data ?? [];
    }
  }

  return results;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runPool(items, worker, concurrency) {
  const results = new Array(items.length);
  let idx = 0;
  async function run() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await worker(items[i], i);
      await sleep(DELAY_MS);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, run));
  return results;
}

// --- Main ---
let matched = 0, lowConf = 0, failed = 0;

// Tally already-done
for (const { source, key, word } of targets) {
  const k = `${source}:${key}:${word.word}`;
  const m = matches[k];
  if (!m) continue;
  if (m.error) failed++;
  else if (m.confidence >= CONFIDENCE_THRESHOLD) matched++;
  else lowConf++;
}

await runPool(pending, async ({ source, key, word }, i) => {
  const matchKey = `${source}:${key}:${word.word}`;
  try {
    const candidates = await searchCatalog(word.song_title, word.artist_name);

    if (candidates.length === 0) {
      matches[matchKey] = { word: word.word, song_title: word.song_title, artist_name: word.artist_name, error: 'no results' };
      failed++;
    } else {
      const scored = candidates.map(c => ({
        trackId:    Number(c.id),
        trackName:  c.attributes.name,
        artistName: c.attributes.artistName,
        collection: c.attributes.albumName,
        score:      scoreCandidate(c, word.song_title, word.artist_name),
      }));
      scored.sort((a, b) => b.score - a.score);
      const best = scored[0];

      matches[matchKey] = {
        word:           word.word,
        song_title:     word.song_title,
        artist_name:    word.artist_name,
        itunesId:       best.trackId,
        matched_title:  best.trackName,
        matched_artist: best.artistName,
        collection:     best.collection,
        confidence:     Math.round(best.score * 100) / 100,
        alternatives:   scored.slice(1, 3).map(c => ({ trackId: c.trackId, trackName: c.trackName, artistName: c.artistName, score: c.score })),
      };

      if (best.score < CONFIDENCE_THRESHOLD) lowConf++;
      else matched++;
    }
  } catch (e) {
    matches[matchKey] = { word: word.word, song_title: word.song_title, artist_name: word.artist_name, error: e.message };
    failed++;
  }

  if (i % 20 === 0) writeFileSync(matchesPath, JSON.stringify(matches, null, 2));

  const total = matched + lowConf + failed;
  const pct   = Math.round((total / targets.length) * 100);
  const m     = matches[matchKey];
  const label = m?.error
    ? `FAILED: ${m.error}`
    : `"${m?.matched_title}" (${Math.round((m?.confidence ?? 0) * 100)}%)${m?.confidence < CONFIDENCE_THRESHOLD ? ' ⚠' : ''}`;
  process.stdout.write(`\r[${pct}%] ${matched} matched / ${lowConf} low-conf / ${failed} failed — ${word.word}: ${label}`.padEnd(110));
}, CONCURRENCY);

writeFileSync(matchesPath, JSON.stringify(matches, null, 2));
console.log(`\n\nDone: ${matched} high-conf / ${lowConf} low-conf / ${failed} failed`);
console.log(`Matches written to scripts/itunes-matches.json`);

// --- Review ---
if (REVIEW) {
  console.log('\n--- Low-confidence matches ---\n');
  Object.entries(matches)
    .filter(([, v]) => !v.error && v.confidence < CONFIDENCE_THRESHOLD)
    .sort((a, b) => a[1].confidence - b[1].confidence)
    .forEach(([k, v]) => {
      console.log(k);
      console.log(`  Searched: "${v.song_title}" by ${v.artist_name}`);
      console.log(`  Matched:  "${v.matched_title}" by ${v.matched_artist} [${(v.confidence*100).toFixed(0)}%] (id: ${v.itunesId})`);
      v.alternatives?.forEach(a => console.log(`  Alt:      "${a.trackName}" by ${a.artistName} [${(a.score*100).toFixed(0)}%]`));
      console.log();
    });
  console.log('--- Errors ---\n');
  Object.entries(matches).filter(([, v]) => v.error).forEach(([k, v]) => console.log(`${k}: ${v.error}`));
}

if (!APPLY) {
  console.log(`\nRun with --apply to write itunesId to source JSONs (high-confidence only).`);
  console.log(`Run with --review to inspect low-confidence and failed matches.`);
  process.exit(0);
}

// --- Apply ---
let appliedArchive = 0, appliedThemed = 0;

for (const date of targetArchiveDates) {
  if (crosswords[date].skipAppleMusicMigration) continue;
  for (const word of crosswords[date].words ?? []) {
    if (word.itunesId || word.noAutoMatch) continue;
    const m = matches[`archive:${date}:${word.word}`];
    if (!m || m.error || m.confidence < CONFIDENCE_THRESHOLD) continue;
    word.itunesId = m.itunesId;
    appliedArchive++;
  }
}
for (const key of Object.keys(themed)) {
  if (themed[key].skipAppleMusicMigration) continue;
  for (const word of themed[key].words ?? []) {
    if (word.itunesId || word.noAutoMatch) continue;
    const m = matches[`themed:${key}:${word.word}`];
    if (!m || m.error || m.confidence < CONFIDENCE_THRESHOLD) continue;
    word.itunesId = m.itunesId;
    appliedThemed++;
  }
}

writeFileSync(crosswordsPath, JSON.stringify(crosswords, null, 2));
writeFileSync(themedPath,     JSON.stringify(themed,     null, 2));
console.log(`\nApplied: ${appliedArchive} archive words, ${appliedThemed} themed words`);
console.log(`Written: crosswords.json, themed_crosswords.json`);
