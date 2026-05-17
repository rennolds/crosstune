import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { generateMusicKitToken } from '$lib/utils/musickit.server.js';

// Server-side cache: prevents redundant Apple API calls for the same track.
// Keyed by itunesId. TTL: 30min — long enough to absorb traffic spikes,
// short enough that CDN-signed preview URLs won't expire before eviction.
const trackCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000;

// Per-IP rate limiting: 60 req/min. Best-effort (per worker instance).
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
  return entry.count > 60;
}

function getClientIp(request) {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown'
  );
}

export async function GET({ url, request }) {
  const id = url.searchParams.get('id');
  if (!id || !/^\d+$/.test(id)) {
    return json({ error: 'Invalid or missing Apple Music track id' }, { status: 400 });
  }

  if (isRateLimited(getClientIp(request))) {
    return json({ error: 'Too many requests' }, { status: 429 });
  }

  // Serve from cache if fresh
  const cached = trackCache.get(id);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return json(cached.data, {
      headers: { 'Cache-Control': 'public, max-age=1800, stale-while-revalidate=300' },
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
    const resp = await fetch(`https://api.music.apple.com/v1/catalog/us/songs/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!resp.ok) {
      return json({ error: `Apple Music API returned ${resp.status}` }, { status: resp.status === 404 ? 404 : 502 });
    }
    data = await resp.json();
  } catch (e) {
    return json({ error: String(e?.name ?? e) }, { status: 502 });
  }

  const track = data?.data?.[0];
  const previewUrl = track?.attributes?.previews?.[0]?.url;

  if (!previewUrl) {
    return json({ error: 'No preview available for this track' }, { status: 404 });
  }

  const artworkTemplate = track.attributes.artwork?.url ?? '';
  const artworkUrl = artworkTemplate.replace('{w}', '96').replace('{h}', '96');

  const payload = {
    previewUrl,
    title:      track.attributes.name       ?? '',
    artist:     track.attributes.artistName ?? '',
    artworkUrl,
  };

  // Store in server-side cache
  trackCache.set(id, { data: payload, cachedAt: Date.now() });

  return json(payload, {
    headers: { 'Cache-Control': 'public, max-age=1800, stale-while-revalidate=300' },
  });
}
