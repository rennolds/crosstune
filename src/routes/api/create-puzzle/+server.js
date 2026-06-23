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

    const MIN_DIM = 4;
    const MAX_DIM = 16;
    const rawW = Number(submissionData?.size?.width);
    const rawH = Number(submissionData?.size?.height);
    const gridWidth = Number.isInteger(rawW) && rawW >= MIN_DIM && rawW <= MAX_DIM ? rawW : 12;
    const gridHeight = Number.isInteger(rawH) && rawH >= MIN_DIM && rawH <= MAX_DIM ? rawH : 10;

    const startingCharacters = Array.isArray(submissionData.starting_characters)
      ? submissionData.starting_characters
          .map((entry) => {
            if (!entry || typeof entry !== 'object') return null;
            const characters = typeof entry.characters === 'string' ? entry.characters : '';
            const startX = Number(entry.startX);
            const startY = Number(entry.startY);
            const dir = entry.direction === 'down' ? 'down' : 'across';
            if (!characters) return null;
            if (!Number.isInteger(startX) || startX < 0 || startX >= gridWidth) return null;
            if (!Number.isInteger(startY) || startY < 0 || startY >= gridHeight) return null;
            return { characters, startX, startY, direction: dir };
          })
          .filter(Boolean)
      : [];

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const linkedPuzzles = Array.isArray(submissionData.linked_puzzles)
      ? [...new Set(submissionData.linked_puzzles.filter((d) => typeof d === 'string' && dateRegex.test(d)))]
      : [];

    // Bold separator bars between adjacent cells. Normalized to the right/bottom
    // edge of a cell; validated in-bounds (the neighbour must exist) and deduped.
    const seenBars = new Set();
    const bars = Array.isArray(submissionData.bars)
      ? submissionData.bars
          .map((entry) => {
            if (!entry || typeof entry !== 'object') return null;
            const x = Number(entry.x);
            const y = Number(entry.y);
            const side = entry.side === 'right' || entry.side === 'bottom' ? entry.side : null;
            if (!side) return null;
            if (!Number.isInteger(x) || x < 0 || x >= gridWidth) return null;
            if (!Number.isInteger(y) || y < 0 || y >= gridHeight) return null;
            if (side === 'right' && x + 1 >= gridWidth) return null;
            if (side === 'bottom' && y + 1 >= gridHeight) return null;
            const key = `${x},${y},${side}`;
            if (seenBars.has(key)) return null;
            seenBars.add(key);
            return { x, y, side };
          })
          .filter(Boolean)
      : [];

    const crosswordData = {
      title: sanitizeTitle(submissionData.details?.boardTitle || ""),
      version: "1.0.0",
      size: {
        width: gridWidth,
        height: gridHeight,
      },
      theme: "black",
      words: validatedWords,
      ...(startingCharacters.length ? { starting_characters: startingCharacters } : {}),
      ...(bars.length ? { bars } : {}),
      ...(linkedPuzzles.length ? { linked_puzzles: linkedPuzzles } : {}),
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


