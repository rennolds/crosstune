import { json, error } from '@sveltejs/kit';
import { readFileSync, writeFileSync } from 'fs';
import { dev } from '$app/environment';

const CROSSWORDS_PATH = new URL('../../../lib/data/crosswords.json', import.meta.url);

export async function POST({ request }) {
  if (!dev) throw error(404, 'Not found');

  const body = await request.json();
  const { date, word, action, itunesId, matchedTitle, matchedArtist } = body ?? {};

  if (!date || !word || !action) {
    return json({ error: 'date, word, and action are required' }, { status: 400 });
  }
  if (action !== 'apply' && action !== 'skip') {
    return json({ error: 'action must be "apply" or "skip"' }, { status: 400 });
  }
  if (action === 'apply' && (!itunesId || !/^\d+$/.test(String(itunesId)))) {
    return json({ error: 'itunesId must be a numeric string when applying' }, { status: 400 });
  }

  const cw = JSON.parse(readFileSync(CROSSWORDS_PATH, 'utf-8'));
  const puzzle = cw[date];
  if (!puzzle) return json({ error: `No puzzle for date ${date}` }, { status: 404 });

  const w = (puzzle.words ?? []).find((x) => x.word === word);
  if (!w) return json({ error: `Word ${word} not found in ${date}` }, { status: 404 });

  if (action === 'apply') {
    w.itunesId = Number(itunesId);
    if (matchedTitle) w.song_title = matchedTitle;
    if (matchedArtist) w.artist_name = matchedArtist;
  } else {
    w.noAutoMatch = true;
  }

  writeFileSync(CROSSWORDS_PATH, JSON.stringify(cw, null, 2));
  return json({ ok: true });
}
