#!/usr/bin/env node
/**
 * Enriches puzzle words with song_title and artist_name from SoundCloud oEmbed.
 *
 * Scope:
 *   - Archive: first 21 dates + last 21 dates
 *   - Themed: all puzzles
 *
 * Usage:
 *   node scripts/enrich-soundcloud.js           -- fetch + write scripts/enrichment-patches.json
 *   node scripts/enrich-soundcloud.js --apply   -- also write enriched data back to source JSONs
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes('--apply');
const CONCURRENCY = 5;
const DELAY_MS = 120;

const crosswordsPath = join(__dirname, '../src/lib/data/crosswords.json');
const themedPath     = join(__dirname, '../src/lib/data/themed_crosswords.json');
const patchesPath    = join(__dirname, 'enrichment-patches.json');

const crosswords = JSON.parse(readFileSync(crosswordsPath, 'utf-8'));
const themed     = JSON.parse(readFileSync(themedPath,     'utf-8'));

// --- Build target word list ---

const archiveDates = Object.keys(crosswords).sort();
const targetArchiveDates = new Set([
  ...archiveDates.slice(0, 21),
  ...archiveDates.slice(-21),
]);

const targets = [];

for (const date of targetArchiveDates) {
  const puzzle = crosswords[date];
  for (const word of puzzle.words ?? []) {
    if (!word.itunesId && (!word.song_title || !word.artist_name) && word.audioUrl) {
      targets.push({ source: 'archive', key: date, word });
    }
  }
}

for (const key of Object.keys(themed)) {
  const puzzle = themed[key];
  for (const word of puzzle.words ?? []) {
    if (!word.itunesId && (!word.song_title || !word.artist_name) && word.audioUrl) {
      targets.push({ source: 'themed', key, word });
    }
  }
}

console.log(`\nWords to enrich: ${targets.length}`);
console.log(`Concurrency: ${CONCURRENCY}  Delay: ${DELAY_MS}ms`);
console.log(`Est. time: ~${Math.ceil((targets.length / CONCURRENCY) * DELAY_MS / 1000)}s\n`);

// --- oEmbed fetch ---

async function fetchOEmbed(trackId) {
  const url = `https://soundcloud.com/oembed?format=json&url=https%3A//api.soundcloud.com/tracks/${trackId}`;
  const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

function parseSongTitle(rawTitle, authorName) {
  // SoundCloud often formats titles as "Song Title by Artist Name"
  // Strip the " by Author" suffix if present (case-insensitive)
  const suffix = ` by ${authorName}`;
  if (rawTitle.toLowerCase().endsWith(suffix.toLowerCase())) {
    return rawTitle.slice(0, rawTitle.length - suffix.length).trim();
  }
  return rawTitle.trim();
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// --- Concurrency-limited pool ---

async function runPool(items, worker, concurrency) {
  const results = new Array(items.length);
  let idx = 0;

  async function runWorker() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await worker(items[i], i);
      await sleep(DELAY_MS);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, runWorker));
  return results;
}

// --- Main ---

const patches = {}; // trackId -> { song_title, artist_name }
let enriched = 0, failed = 0;

await runPool(targets, async ({ source, key, word }, i) => {
  const trackId = String(word.audioUrl);
  try {
    const data = await fetchOEmbed(trackId);
    const artist_name = data.author_name?.trim() ?? '';
    const song_title  = parseSongTitle(data.title ?? '', artist_name);

    patches[trackId] = { song_title, artist_name };
    enriched++;

    const pct = Math.round(((i + 1) / targets.length) * 100);
    process.stdout.write(`\r[${pct}%] ${enriched} ok / ${failed} failed — ${word.word}: "${song_title}" by ${artist_name}`.padEnd(100));
  } catch (e) {
    patches[trackId] = { song_title: null, artist_name: null, error: e.message };
    failed++;

    const pct = Math.round(((i + 1) / targets.length) * 100);
    process.stdout.write(`\r[${pct}%] ${enriched} ok / ${failed} failed — FAILED ${word.word} (${trackId}): ${e.message}`.padEnd(100));
  }
}, CONCURRENCY);

console.log(`\n\nDone: ${enriched} enriched, ${failed} failed\n`);

// Write patches file
writeFileSync(patchesPath, JSON.stringify(patches, null, 2));
console.log(`Patches written to scripts/enrichment-patches.json`);

if (!APPLY) {
  console.log(`\nReview the patches file, then run with --apply to write to source JSONs.`);
  process.exit(0);
}

// --- Apply patches to source JSONs ---

let appliedArchive = 0, appliedThemed = 0;

for (const date of targetArchiveDates) {
  const puzzle = crosswords[date];
  for (const word of puzzle.words ?? []) {
    const trackId = String(word.audioUrl);
    const patch = patches[trackId];
    if (!patch || patch.error || word.itunesId) continue;
    if (!word.song_title && patch.song_title)  { word.song_title  = patch.song_title;  appliedArchive++; }
    if (!word.artist_name && patch.artist_name) { word.artist_name = patch.artist_name; }
  }
}

for (const key of Object.keys(themed)) {
  const puzzle = themed[key];
  for (const word of puzzle.words ?? []) {
    const trackId = String(word.audioUrl);
    const patch = patches[trackId];
    if (!patch || patch.error || word.itunesId) continue;
    if (!word.song_title && patch.song_title)  { word.song_title  = patch.song_title;  appliedThemed++; }
    if (!word.artist_name && patch.artist_name) { word.artist_name = patch.artist_name; }
  }
}

writeFileSync(crosswordsPath, JSON.stringify(crosswords, null, 2));
writeFileSync(themedPath,     JSON.stringify(themed,     null, 2));

console.log(`\nApplied: ${appliedArchive} archive words, ${appliedThemed} themed words`);
console.log(`Written: crosswords.json, themed_crosswords.json`);
