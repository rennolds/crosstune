import { json } from '@sveltejs/kit';
import { generateMusicKitToken } from '$lib/utils/musickit.server.js';

export async function GET({ url }) {
  const q = url.searchParams.get('q');
  if (!q || !q.trim()) {
    return json({ error: 'Missing query' }, { status: 400 });
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
      `https://api.music.apple.com/v1/catalog/us/search?term=${encodeURIComponent(q.trim())}&types=songs&limit=5`,
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

  return json({ results }, {
    headers: { 'Cache-Control': 'public, max-age=300' },
  });
}
