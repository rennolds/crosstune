import { json } from '@sveltejs/kit';
import crosswords from '$lib/data/crosswords.json';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const HEADERS = {
  'User-Agent': UA,
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'identity',
};
const TIMEOUT_MS = 10000;
const DEFAULT_CONCURRENCY = 10;

async function fetchHydration(url) {
  try {
    const r = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!r.ok) return { error: `http_${r.status}` };
    const html = await r.text();
    const matches = [...html.matchAll(/window\.__sc_hydration\s*=\s*(\[[\s\S]*?\]);/g)];
    for (const m of matches) {
      let arr;
      try {
        arr = JSON.parse(m[1]);
      } catch {
        continue;
      }
      if (!Array.isArray(arr)) continue;
      for (const item of arr) {
        if (item?.hydratable === 'sound' && item.data) return { track: item.data };
      }
    }
    return { error: 'no_hydration' };
  } catch (e) {
    return { error: String(e?.name || e) };
  }
}

function classify(track) {
  if (!track) return 'fetch_failed';
  const tcs = track.media?.transcodings || [];
  const hasEncrypted = tcs.some((t) => /encrypted-hls/.test(t.format?.protocol || ''));
  const hasProgressive = tcs.some((t) => t.format?.protocol === 'progressive');
  if (!hasEncrypted) return 'healthy';
  if (hasProgressive) return 'encrypted_with_progressive';
  return 'encrypted_only';
}

async function pool(items, concurrency, fn) {
  const results = new Array(items.length);
  let i = 0;
  const worker = async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker)
  );
  return results;
}

export async function GET({ url }) {
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const concurrency = Math.max(
    1,
    Math.min(30, parseInt(url.searchParams.get('concurrency') || String(DEFAULT_CONCURRENCY), 10))
  );
  const slim = url.searchParams.get('slim') === 'true';

  const allDates = Object.keys(crosswords)
    .filter((d) => crosswords[d] && Array.isArray(crosswords[d].words))
    .sort();
  const dates = allDates.filter((d) => (!from || d >= from) && (!to || d <= to));

  // Dedupe tracks across dates by audioUrl
  const trackMap = new Map();
  let totalOccurrences = 0;
  for (const date of dates) {
    for (const w of crosswords[date].words) {
      totalOccurrences++;
      const id = w.audioUrl;
      if (!id || !w.soundcloudUrl) continue;
      const existing = trackMap.get(id);
      if (existing) {
        existing.dates.push(date);
        existing.words.add(w.word);
      } else {
        trackMap.set(id, {
          id,
          url: w.soundcloudUrl,
          artist: w.artist_name,
          song: w.song_title,
          dates: [date],
          words: new Set([w.word]),
        });
      }
    }
  }
  const tracks = [...trackMap.values()];

  const probed = await pool(tracks, concurrency, async (t) => {
    const r = await fetchHydration(t.url);
    return { ...t, classification: classify(r.track), error: r.error };
  });

  const buckets = {
    healthy: [],
    encrypted_with_progressive: [],
    encrypted_only: [],
    fetch_failed: [],
  };
  for (const t of probed) buckets[t.classification].push(t);

  const dateImpact = {};
  for (const t of probed) {
    const bucket =
      t.classification === 'encrypted_with_progressive'
        ? 'recoverable'
        : t.classification === 'encrypted_only'
        ? 'unrecoverable'
        : t.classification === 'fetch_failed'
        ? 'fetch_failed'
        : null;
    if (!bucket) continue;
    for (const d of t.dates) {
      dateImpact[d] ||= { recoverable: 0, unrecoverable: 0, fetch_failed: 0 };
      dateImpact[d][bucket]++;
    }
  }

  const summary = {
    range: { from: dates[0] || null, to: dates[dates.length - 1] || null },
    puzzlesScanned: dates.length,
    totalWordOccurrences: totalOccurrences,
    uniqueTracks: tracks.length,
    counts: {
      healthy: buckets.healthy.length,
      encrypted_with_progressive: buckets.encrypted_with_progressive.length,
      encrypted_only: buckets.encrypted_only.length,
      fetch_failed: buckets.fetch_failed.length,
    },
    affectedPuzzles: Object.fromEntries(
      Object.entries(dateImpact).sort(([a], [b]) => a.localeCompare(b))
    ),
  };

  if (slim) return json(summary);

  const projectTrack = (t) => ({
    id: t.id,
    url: t.url,
    artist: t.artist,
    song: t.song,
    dateCount: t.dates.length,
    firstAppeared: t.dates[0],
    lastAppeared: t.dates[t.dates.length - 1],
    words: [...t.words],
    ...(t.error ? { error: t.error } : {}),
  });

  return json({
    summary,
    buckets: {
      encrypted_only: buckets.encrypted_only.map(projectTrack),
      encrypted_with_progressive: buckets.encrypted_with_progressive.map(projectTrack),
      fetch_failed: buckets.fetch_failed.map(projectTrack),
      // healthy list is huge and not actionable; only return count by default
      healthy_sample: buckets.healthy.slice(0, 5).map(projectTrack),
    },
  });
}
