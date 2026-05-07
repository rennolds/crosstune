import { json } from '@sveltejs/kit';
import { validateClue, sanitizeClue, sanitizeTitle, containsProfanity } from '$lib/utils/filters.js';

async function getOwnedPuzzle(locals, id) {
  const { user } = await locals.safeGetSession();
  if (!user) return { error: json({ error: 'Unauthorized' }, { status: 401 }) };

  const { data: existing } = await locals.supabase
    .from('crosstune_puzzles')
    .select('id, user_id')
    .eq('id', id)
    .single();

  if (!existing) return { error: json({ error: 'Not found' }, { status: 404 }) };
  if (existing.user_id !== user.id) return { error: json({ error: 'Forbidden' }, { status: 403 }) };

  return { user, existing };
}

export async function PATCH({ request, params, locals }) {
  const check = await getOwnedPuzzle(locals, params.id);
  if (check.error) return check.error;

  try {
    const submissionData = await request.json();

    if (!submissionData.grid || !submissionData.words || submissionData.words.length === 0) {
      return new Response('Invalid puzzle submission', { status: 400 });
    }

    const colorPalette = [
      '#FE9C9C', '#28D66A', '#FFCEFD', '#FF5B5E', '#568EFF', '#FFB34B', '#00FFFF',
    ];

    for (let i = 0; i < submissionData.words.length; i++) {
      if (await containsProfanity(submissionData.words[i].word || '')) {
        return json({ error: 'Invalid word', index: i }, { status: 400 });
      }
    }

    const validatedWords = [];
    for (let index = 0; index < submissionData.words.length; index++) {
      const word = submissionData.words[index];
      const { valid, reasons, value } = await validateClue(word.clue || '');
      if (!valid) throw { status: 400, index, reasons };

      const itunesId = parseInt(word.itunesId, 10);
      const hasItunesId = Number.isFinite(itunesId) && itunesId > 0;
      const validatedWord = {
        word: word.word,
        startX: word.col,
        startY: word.row,
        direction: word.direction.toLowerCase(),
        color: colorPalette[index % colorPalette.length],
        textClue: sanitizeClue(value),
        audioUrl: hasItunesId ? String(itunesId) : word.trackId?.toString() || '',
        startAt: word.startAt || '0:00',
        audioDuration: word.audioDuration || 6,
        soundcloudUrl: word.soundcloudUrl || ''
      };
      if (hasItunesId) validatedWord.itunesId = itunesId;
      if (word.song_title) validatedWord.song_title = word.song_title;
      if (word.artist_name) validatedWord.artist_name = word.artist_name;
      validatedWords.push(validatedWord);
    }

    const crosswordData = {
      title: sanitizeTitle(submissionData.details?.boardTitle || ''),
      version: '1.0.0',
      size: { width: 12, height: 10 },
      theme: 'black',
      words: validatedWords
    };

    const { data: updated, error: updateError } = await locals.supabase
      .from('crosstune_puzzles')
      .update({ puzzle_json: JSON.stringify(crosswordData) })
      .eq('id', params.id)
      .select('id');

    if (updateError) throw updateError;
    if (!updated || updated.length === 0) {
      console.error('Update silently blocked for puzzle', params.id, '— check Supabase RLS UPDATE policy on crosstune_puzzles');
      throw { status: 403, message: 'Update was blocked by database policy' };
    }

    return json({ status: 'success', id: params.id });
  } catch (error) {
    if (error && error.status === 400) {
      return json({ error: 'Invalid clue', index: error.index, reasons: error.reasons }, { status: 400 });
    }
    if (error && error.status === 403) {
      return json({ error: error.message }, { status: 403 });
    }
    console.error('Failed to update puzzle:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

export async function DELETE({ params, locals }) {
  const check = await getOwnedPuzzle(locals, params.id);
  if (check.error) return check.error;

  const { data: deleted, error: deleteError } = await locals.supabase
    .from('crosstune_puzzles')
    .delete()
    .eq('id', params.id)
    .select('id');

  if (deleteError) {
    console.error('Failed to delete puzzle:', deleteError);
    return new Response('Internal Server Error', { status: 500 });
  }

  if (!deleted || deleted.length === 0) {
    console.error('Delete silently blocked for puzzle', params.id, '— check Supabase RLS DELETE policy on crosstune_puzzles');
    return json({ error: 'Delete was blocked by database policy' }, { status: 403 });
  }

  return json({ status: 'success' });
}
