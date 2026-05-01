import { json } from '@sveltejs/kit';
import { validateClue, sanitizeClue, sanitizeTitle, containsProfanity } from '$lib/utils/filters.js';

export async function POST({ request, locals }) {
  try {
    const submissionData = await request.json();

    if (!submissionData.grid || !submissionData.words || submissionData.words.length === 0) {
      return new Response('Invalid puzzle submission', { status: 400 });
    }

    const colorPalette = [
      "#FE9C9C",
      "#28D66A",
      "#FFCEFD",
      "#FF5B5E",
      "#568EFF",
      "#FFB34B",
      "#00FFFF",
    ];

    // Reject if any words contain profanity/blocked content
    for (let i = 0; i < submissionData.words.length; i++) {
      if (await containsProfanity(submissionData.words[i].word || '')) {
        return json({ error: 'Invalid word', index: i }, { status: 400 });
      }
    }

    // Validate clues first (async)
    const validatedWords = [];
    for (let index = 0; index < submissionData.words.length; index++) {
      const word = submissionData.words[index];
      const { valid, reasons, value } = await validateClue(word.clue || '');
      if (!valid) {
        throw { status: 400, index, reasons };
      }
      const validatedWord = {
        word: word.word,
        startX: word.col,
        startY: word.row,
        direction: word.direction.toLowerCase(),
        color: colorPalette[index % colorPalette.length],
        textClue: sanitizeClue(value),
        audioUrl: word.itunesId?.toString() || word.trackId?.toString() || '',
        startAt: word.startAt || '0:00',
        audioDuration: word.audioDuration || 6,
        soundcloudUrl: word.soundcloudUrl || ''
      };
      if (word.itunesId) validatedWord.itunesId = word.itunesId;
      if (word.song_title) validatedWord.song_title = word.song_title;
      if (word.artist_name) validatedWord.artist_name = word.artist_name;
      validatedWords.push(validatedWord);
    }

    const crosswordData = {
      title: sanitizeTitle(submissionData.details?.boardTitle || ""),
      version: "1.0.0",
      size: {
        width: 12,
        height: 10,
      },
      theme: "black",
      words: validatedWords
    };

    const generateId = () =>
      (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID()
        : 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

    const puzzleId = generateId();

    const { user } = await locals.safeGetSession();

    const details = submissionData.details || {};
    const creditUser = details.creditUser !== false; // Default true
    const submitForReview = details.submitForReview === true;

    // If user wants credit, use their username; otherwise 'anon'
    const creditName = creditUser ? (user?.user_metadata?.username || 'anon') : 'anon';
    const approvalStatus = submitForReview ? 'pending' : 'N/A';

    const { error: insertError } = await locals.supabase
      .from('crosstune_puzzles')
      .insert({
        id: puzzleId,
        puzzle_json: JSON.stringify(crosswordData),
        user_id: user?.id || null,
        credit_name: creditName,
        featured_submission: submitForReview,
        approval_status: approvalStatus
      });

    if (insertError) {
      console.error('Supabase error:', insertError);
      throw insertError;
    }

    return json({ status: 'success', id: puzzleId, message: 'Puzzle created successfully!' });
  } catch (error) {
    if (error && error.status === 400) {
      return json({ error: 'Invalid clue', index: error.index, reasons: error.reasons }, { status: 400 });
    }
    console.error('Failed to create puzzle:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}


