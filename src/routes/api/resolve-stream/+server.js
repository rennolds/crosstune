import { json } from '@sveltejs/kit';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const HEADERS = {
  'User-Agent': UA,
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'identity',
};
const TIMEOUT_MS = 10000;
const CLIENT_ID_TTL_MS = 6 * 60 * 60 * 1000;

let cachedClientId = null;
let clientIdFetchedAt = 0;

async function fetchText(url) {
  const r = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!r.ok) throw new Error(`http_${r.status} for ${url}`);
  return r.text();
}

// SoundCloud doesn't publish a stable client_id; the canonical workaround is to
// scrape the homepage's bundled JS chunks. We try the most-recently-added scripts
// first since that's where new client_ids tend to land.
async function discoverClientId() {
  if (cachedClientId && Date.now() - clientIdFetchedAt < CLIENT_ID_TTL_MS) {
    return cachedClientId;
  }
  const html = await fetchText('https://soundcloud.com/');
  const scriptUrls = [
    ...html.matchAll(/<script[^>]+src="(https:\/\/a-v2\.sndcdn\.com\/assets\/[^"]+\.js)"/g),
  ].map((m) => m[1]);
  for (const scriptUrl of scriptUrls.reverse()) {
    let body;
    try {
      body = await fetchText(scriptUrl);
    } catch {
      continue;
    }
    const m = body.match(/client_id\s*[:=]\s*["']([a-zA-Z0-9]{32})["']/);
    if (m) {
      cachedClientId = m[1];
      clientIdFetchedAt = Date.now();
      return cachedClientId;
    }
  }
  throw new Error('client_id_not_found');
}

async function fetchHydration(url) {
  const html = await fetchText(url);
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
      if (item?.hydratable === 'sound' && item.data) return item.data;
    }
  }
  throw new Error('no_hydration');
}

export async function GET({ url }) {
  const trackUrl = url.searchParams.get('url');
  if (!trackUrl) {
    return json({ error: 'pass ?url=<scTrackUrl>' }, { status: 400 });
  }

  let track;
  try {
    track = await fetchHydration(trackUrl);
  } catch (e) {
    return json({ error: `hydration_failed:${e.message || e}` }, { status: 502 });
  }

  const tcs = track.media?.transcodings || [];
  const progressive = tcs.find((t) => t.format?.protocol === 'progressive');
  if (!progressive || !progressive.url) {
    return json(
      { error: 'no_progressive_transcoding', trackId: track.id },
      { status: 404 }
    );
  }

  let clientId;
  try {
    clientId = await discoverClientId();
  } catch (e) {
    return json({ error: `client_id_failed:${e.message || e}` }, { status: 502 });
  }

  let resolveResp;
  try {
    const sep = progressive.url.includes('?') ? '&' : '?';
    resolveResp = await fetch(`${progressive.url}${sep}client_id=${clientId}`, {
      headers: HEADERS,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    return json({ error: `resolve_fetch_failed:${e?.name || e}` }, { status: 502 });
  }

  if (!resolveResp.ok) {
    if (resolveResp.status === 401 || resolveResp.status === 403) {
      cachedClientId = null;
    }
    return json(
      { error: `resolve_status_${resolveResp.status}`, trackId: track.id },
      { status: 502 }
    );
  }

  let data;
  try {
    data = await resolveResp.json();
  } catch {
    return json({ error: 'resolve_not_json' }, { status: 502 });
  }
  if (!data?.url) {
    return json({ error: 'no_stream_url_in_response' }, { status: 502 });
  }

  return json(
    {
      streamUrl: data.url,
      mime: progressive.format?.mime_type,
      snipped: progressive.snipped === true,
      trackId: track.id,
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=300',
      },
    }
  );
}
