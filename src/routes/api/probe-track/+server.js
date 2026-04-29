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

const TRACK_FIELDS = [
  'id',
  'kind',
  'streamable',
  'policy',
  'embeddable_by',
  'monetization_model',
  'sharing',
  'public',
  'state',
  'genre',
  'license',
  'commentable',
  'has_downloads_left',
  'station_urn',
];

const ERROR_INDICATORS = [
  'Sorry! Something went wrong',
  'this track is not available',
  'this track is private',
  'this track has been removed',
  'not available in your country',
  'Track is not available',
];

async function fetchWithTimeout(url) {
  return fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

// SoundCloud SSRs the track page with one or more
//   <script>window.__sc_hydration = [...]</script>
// blocks. We pull the largest JSON-array block and search it for the track object.
function extractHydration(html) {
  const out = { found: false };
  const matches = [...html.matchAll(/window\.__sc_hydration\s*=\s*(\[[\s\S]*?\]);/g)];
  if (!matches.length) return out;

  for (const m of matches) {
    let arr;
    try {
      arr = JSON.parse(m[1]);
    } catch {
      continue;
    }
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      if (item && item.hydratable === 'sound' && item.data) {
        const t = item.data;
        const summary = {};
        for (const k of TRACK_FIELDS) if (k in t) summary[k] = t[k];
        if (t.user) summary.user = { id: t.user.id, username: t.user.username, permalink: t.user.permalink };
        if (t.media && t.media.transcodings) {
          summary.transcodings = t.media.transcodings.map((tr) => ({
            protocol: tr.format?.protocol,
            mime_type: tr.format?.mime_type,
            quality: tr.quality,
            preset: tr.preset,
            snipped: tr.snipped,
          }));
        }
        out.found = true;
        out.track = summary;
        return out;
      }
    }
  }
  return out;
}

async function probeOne({ url, id }) {
  const result = { input: { url, id } };

  // 1. oembed (works whether you give us URL or just need a sanity check)
  if (url) {
    const oembedUrl = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`;
    try {
      const r = await fetchWithTimeout(oembedUrl);
      result.oembed = { status: r.status, ok: r.ok };
      if (!r.ok) result.oembed.body = (await r.text().catch(() => '')).slice(0, 200);
    } catch (e) {
      result.oembed = { error: String(e) };
    }
  }

  // 2. Canonical SSR'd page → __sc_hydration. Required for policy/streamable/transcodings.
  if (url) {
    try {
      const r = await fetchWithTimeout(url);
      result.page = { status: r.status, ok: r.ok };
      if (r.ok) {
        const body = await r.text();
        result.page.bodyLength = body.length;
        result.page.hydration = extractHydration(body);
        result.page.errorIndicators = ERROR_INDICATORS.filter((s) =>
          body.toLowerCase().includes(s.toLowerCase())
        );
      } else {
        result.page.body = (await r.text().catch(() => '')).slice(0, 200);
      }
    } catch (e) {
      result.page = { error: String(e) };
    }
  } else {
    result.page = { skipped: 'pass ?url= or ?date= to scrape canonical page (need slug)' };
  }

  // 3. Widget shell — only useful as a sanity check that the widget loads at all
  const widgetTrackUrl = id
    ? `https://api.soundcloud.com/tracks/${encodeURIComponent(id)}`
    : url;
  const widgetUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(widgetTrackUrl)}`;
  try {
    const r = await fetchWithTimeout(widgetUrl);
    result.widget = { status: r.status, ok: r.ok };
  } catch (e) {
    result.widget = { error: String(e) };
  }

  return result;
}

export async function GET({ url }) {
  const date = url.searchParams.get('date');

  // Bulk mode: probe every track in a given puzzle date
  if (date) {
    const puzzle = crosswords[date];
    if (!puzzle || !puzzle.words) {
      return json({ error: `No puzzle for date ${date}` }, { status: 404 });
    }
    const inputs = puzzle.words.map((w) => ({
      word: w.word,
      url: w.soundcloudUrl,
      id: w.audioUrl,
    }));
    const probed = await Promise.all(
      inputs.map(async (i) => ({ word: i.word, ...(await probeOne({ url: i.url, id: i.id })) }))
    );
    return json({ date, count: probed.length, results: probed });
  }

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
      {
        error:
          'Provide ?url=<scUrl>, ?id=<trackId>, ?ids=1,2,3, ?urls=a,b, or ?date=YYYY-MM-DD',
      },
      { status: 400 }
    );
  }

  return json(await probeOne(single));
}
