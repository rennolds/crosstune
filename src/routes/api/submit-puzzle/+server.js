import { json } from '@sveltejs/kit';
import { validateClue, sanitizeClue } from '$lib/utils/filters.js';

export async function POST({ request, locals }) {
  try {
    const submissionData = await request.json();

    if (!submissionData.grid || !submissionData.words || submissionData.words.length === 0) {
      return new Response('Invalid puzzle submission', { status: 400 });
    }

    // Convert grid data to crossword JSON format (matching crosswords.json structure)
    const colorPalette = [
      "#FE9C9C",
      "#28D66A",
      "#FFCEFD",
      "#FF5B5E",
      "#568EFF",
      "#FFB34B",
      "#00FFFF",
    ];

    // Validate clues first (async)
    const validatedWords = [];
    for (let index = 0; index < submissionData.words.length; index++) {
      const word = submissionData.words[index];
      const { valid, reasons, value } = await validateClue(word.clue || '');
      if (!valid) {
        throw { status: 400, index, reasons };
      }
      validatedWords.push({
        word: word.word,
        startX: word.col,
        startY: word.row,
        direction: word.direction.toLowerCase(),
        color: colorPalette[index % colorPalette.length],
        textClue: sanitizeClue(value),
        audioUrl: word.trackId.toString(), // SoundCloud track ID
        startAt: word.startAt || "0:00", // User-selected start time
        audioDuration: word.audioDuration || 6, // User-selected duration
        soundcloudUrl: word.soundcloudUrl // Store original URL for reference
      });
    }

    const MIN_DIM = 4;
    const MAX_DIM = 16;
    const rawW = Number(submissionData?.size?.width);
    const rawH = Number(submissionData?.size?.height);
    const gridWidth = Number.isInteger(rawW) && rawW >= MIN_DIM && rawW <= MAX_DIM ? rawW : 12;
    const gridHeight = Number.isInteger(rawH) && rawH >= MIN_DIM && rawH <= MAX_DIM ? rawH : 10;

    const crosswordData = {
      title: submissionData.details.boardTitle || "",
      version: "1.0.0",
      size: {
        width: gridWidth,
        height: gridHeight
      },
      theme: "black",
      words: validatedWords
    };

    // Persist to database (crosstune_puzzles)
    const generateId = () =>
      (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID()
        : 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

    const puzzleId = generateId();

    const creditName = submissionData?.details?.creditName || null;
    const { user } = await locals.safeGetSession();

    const { error: insertError } = await locals.supabase
      .from('crosstune_puzzles')
      .insert({
        id: puzzleId,
        puzzle_json: JSON.stringify(crosswordData),
        user_id: user?.id || null,
        credit_name: creditName || 'anon',
        featured_submission: false,
        approval_status: 'N/A'
      });

    if (insertError) {
      console.error('Supabase error:', insertError);
      throw insertError;
    }

    return json({ status: 'success', id: puzzleId, message: 'Puzzle submitted successfully!' });
  } catch (error) {
    if (error && error.status === 400) {
      return json({ error: 'Invalid clue', index: error.index, reasons: error.reasons }, { status: 400 });
    }
    console.error('Failed to submit puzzle:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
