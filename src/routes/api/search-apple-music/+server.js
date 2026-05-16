import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { generateMusicKitToken } from '$lib/utils/musickit.server.js';

// Query-response cache: avoids redundant Apple API calls for the same search term.
// Keyed by normalized query string. TTL: 5 min.
const queryCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

// Per-IP rate limiting: 20 req/min. Best-effort (per worker instance).
const ipCounts = new Map();

function isRateLimited(ip) {
  if (dev) return false;
  const now = Date.now();
  const entry = ipCounts.get(ip);
  if (!entry || now - entry.start > 60_000) {
    ipCounts.set(ip, { start: now, count: 1 });
    return false;
  }
  entry.count++;
  return entry.count > 20;
}

function getClientIp(request) {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown'
  );
}

export async function GET({ url, request }) {
  const q = url.searchParams.get('q');
  if (!q || !q.trim()) {
    return json({ error: 'Missing query' }, { status: 400 });
  }

  if (isRateLimited(getClientIp(request))) {
    return json({ error: 'Too many requests' }, { status: 429 });
  }

  const normalizedQ = q.trim().toLowerCase();

  // Serve from cache if fresh
  const cached = queryCache.get(normalizedQ);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return json(cached.data, {
      headers: { 'Cache-Control': 'public, max-age=300' },
    });
  }

  let token;
  try {
    token = await generateMusicKitToken();
  } catch (e) {
    console.error('MusicKit token generation failed:', e);
    return json({ error: 'Failed to generate MusicKit token' }, { status: 500 });
  }

  let data;
  try {
    const resp = await fetch(
      `https://api.music.apple.com/v1/catalog/us/search?term=${encodeURIComponent(normalizedQ)}&types=songs&limit=5`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!resp.ok) {
      return json({ error: `Apple Music API returned ${resp.status}` }, { status: 502 });
    }
    data = await resp.json();
  } catch (e) {
    return json({ error: String(e?.name ?? e) }, { status: 502 });
  }

  const songs = data?.results?.songs?.data || [];
  const results = songs.map((song) => ({
    id: song.id,
    title: song.attributes.name,
    artist: song.attributes.artistName,
    album: song.attributes.albumName,
    previewUrl: song.attributes.previews?.[0]?.url || null,
    artworkUrl: song.attributes.artwork
      ? song.attributes.artwork.url.replace('{w}', '60').replace('{h}', '60')
      : null,
  }));

  const payload = { results };
  queryCache.set(normalizedQ, { data: payload, cachedAt: Date.now() });

  return json(payload, {
    headers: { 'Cache-Control': 'public, max-age=300' },
  });
}
