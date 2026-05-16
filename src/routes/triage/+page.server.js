import { error } from '@sveltejs/kit';
import { readFileSync } from 'fs';
import { dev } from '$app/environment';

export const prerender = false;

export async function load() {
  if (!dev) throw error(404, 'Not found');

  const crosswords = JSON.parse(
    readFileSync(new URL('../../lib/data/crosswords.json', import.meta.url), 'utf-8')
  );

  const queue = [];
  for (const date of Object.keys(crosswords).sort()) {
    const p = crosswords[date];
    if (p.skipAppleMusicMigration) continue;
    for (const w of p.words ?? []) {
      const hasAudio = w.audioUrl || w.soundcloudUrl;
      if (!hasAudio || w.itunesId || w.noAutoMatch) continue;
      queue.push({
        date,
        puzzleTitle: p.title ?? '',
        word: w.word,
        textClue: w.textClue ?? '',
        song_title: w.song_title ?? '',
        artist_name: w.artist_name ?? '',
        audioUrl: w.audioUrl ?? null,
        soundcloudUrl: w.soundcloudUrl ?? null,
      });
    }
  }

  return { queue };
}
