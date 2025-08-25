import { json } from '@sveltejs/kit';
import { validateClue, sanitizeClue, sanitizeTitle, sanitizeAuthor, containsProfanity } from '$lib/utils/filters.js';

export async function POST({ request, platform }) {
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
    const badWordIndex = submissionData.words.findIndex((w) => containsProfanity(w.word || ''));
    if (badWordIndex !== -1) {
      return json({ error: 'Invalid word', index: badWordIndex }, { status: 400 });
    }

    const crosswordData = {
      title: sanitizeTitle(submissionData.details?.boardTitle || ""),
      version: "1.0.0",
      size: {
        width: 12,
        height: 10,
      },
      theme: "black",
      words: submissionData.words.map((word, index) => {
        const { valid, reasons, value } = validateClue(word.clue || '');
        if (!valid) {
          throw { status: 400, index, reasons };
        }
        return {
          word: word.word,
          startX: word.col,
          startY: word.row,
          direction: word.direction.toLowerCase(),
          color: colorPalette[index % colorPalette.length],
          textClue: sanitizeClue(value),
          audioUrl: word.trackId?.toString() || '',
          startAt: word.startAt || '0:00',
          audioDuration: word.audioDuration || 6,
          soundcloudUrl: word.soundcloudUrl || ''
        };
      })
    };

    const db = platform?.env?.['solve-db'];
    if (!db) {
      return new Response('Database not available', { status: 500 });
    }

    const generateId = () =>
      (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID()
        : 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

    const puzzleId = generateId();

    const createdBy = sanitizeAuthor(submissionData?.details?.creditName || "");

    await db
      .prepare(
        `INSERT INTO custom_puzzles (id, puzzle_json, created_by)
         VALUES (?, ?, ?)`
      )
      .bind(
        puzzleId,
        JSON.stringify(crosswordData),
        createdBy || null
      )
      .run();

    return json({ status: 'success', id: puzzleId, message: 'Puzzle created successfully!' });
  } catch (error) {
    if (error && error.status === 400) {
      return json({ error: 'Invalid clue', index: error.index, reasons: error.reasons }, { status: 400 });
    }
    console.error('Failed to create puzzle:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}


