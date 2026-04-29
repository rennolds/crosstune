import { json } from '@sveltejs/kit';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const HEADERS = {
  'User-Agent': UA,
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'identity',
};
const TIMEOUT_MS = 8000;

const ERROR_INDICATORS = [
  'Sorry, this track is unavailable',
  'This track is not available',
  'This sound is not available',
  'Track has been removed',
  'not available in your country',
  'This track is private',
  'embeddable_by',
];

const FLAG_KEYS = [
  'streamable',
  'policy',
  'embeddable_by',
  'monetization_model',
  'sharing',
  'public',
  'state',
  'geo_blocking',
  'commentable',
];

async function fetchWithTimeout(url) {
  return fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

function extractFlags(body) {
  const flags = {};
  for (const key of FLAG_KEYS) {
    const m = body.match(
      new RegExp(`"${key}"\\s*:\\s*("[^"]*"|true|false|null|\\d+)`)
    );
    if (m) flags[key] = m[1];
  }
  flags._errorIndicators = ERROR_INDICATORS.filter((s) => body.includes(s));
  return flags;
}

async function probeOne({ url, id }) {
  const result = { input: { url, id } };

  if (url) {
    const oembedUrl = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`;
    try {
      const r = await fetchWithTimeout(oembedUrl);
      result.oembed = { status: r.status, ok: r.ok };
      if (r.ok) {
        result.oembed.body = await r.json().catch(() => null);
      } else {
        result.oembed.body = (await r.text().catch(() => '')).slice(0, 300);
      }
    } catch (e) {
      result.oembed = { error: String(e) };
    }
  }

  const trackUrl = id
    ? `https://api.soundcloud.com/tracks/${encodeURIComponent(id)}`
    : url;
  const widgetUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(trackUrl)}`;
  try {
    const r = await fetchWithTimeout(widgetUrl);
    result.widget = { status: r.status, ok: r.ok };
    if (r.ok) {
      const body = await r.text();
      result.widget.flags = extractFlags(body);
      result.widget.bodyLength = body.length;
    } else {
      result.widget.body = (await r.text().catch(() => '')).slice(0, 300);
    }
  } catch (e) {
    result.widget = { error: String(e) };
  }

  return result;
}

export async function GET({ url }) {
  const single = { url: url.searchParams.get('url'), id: url.searchParams.get('id') };
  const ids = url.searchParams.get('ids');
  const urls = url.searchParams.get('urls');

  if (ids || urls) {
    const idList = ids ? ids.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const urlList = urls ? urls.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const inputs = [
      ...idList.map((id) => ({ id })),
      ...urlList.map((u) => ({ url: u })),
    ];
    const results = await Promise.all(inputs.map(probeOne));
    return json({ results });
  }

  if (!single.url && !single.id) {
    return json(
      { error: 'Provide ?url=<scUrl> or ?id=<trackId>, or ?ids=1,2,3 / ?urls=a,b' },
      { status: 400 }
    );
  }

  return json(await probeOne(single));
}
