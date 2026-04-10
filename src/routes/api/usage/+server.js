import { json } from '@sveltejs/kit';
import crosswords from '$lib/data/crosswords.json';

export async function GET({ url, platform }) {
  const token = url.searchParams.get('token');
  const expected = platform?.env?.USAGE_TOKEN;

  if (!expected || token !== expected) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  const usage = [];

  for (const [date, puzzle] of Object.entries(crosswords)) {
    if (!puzzle.words) continue;
    for (const word of puzzle.words) {
      usage.push({
        date,
        word: word.word,
        clue: word.textClue,
        artist_name: word.artist_name || null,
        song_title: word.song_title || null
      });
    }
  }

  return json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    total: usage.length,
    usage
  });
}
