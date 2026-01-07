import { json } from '@sveltejs/kit';
import { validateClue, sanitizeClue, sanitizeTitle, sanitizeAuthor, containsProfanity, validateNotes } from '$lib/utils/filters.js';
import axios from 'axios';
import { DISCORD_WEBHOOK_URL } from '$env/static/private';

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
      validatedWords.push({
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
      });
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

    const rawCreditName = details.creditName || "";
    // If user unchecked "Credit my username", force 'anon'. Otherwise use name (or 'anon' if empty).
    const creditName = creditUser ? (sanitizeAuthor(rawCreditName) || 'anon') : 'anon';
    const approvalStatus = submitForReview ? 'pending' : 'N/A';

    const { error: insertError } = await locals.supabase
      .from('crosstune_puzzles')
      .insert({
        id: puzzleId,
        puzzle_json: JSON.stringify(crosswordData),
        user_id: user?.id || null,
        credit_name: creditName,
        featured_submission: false,
        approval_status: approvalStatus
      });

    if (insertError) {
      console.error('Supabase error:', insertError);
      throw insertError;
    }

    // Send Discord Webhook if submitted for review
    if (submitForReview) {
      try {
        const email = details.email || "";
        const notes = details.notes || "";
        
        const { valid: notesValid, value: safeNotes } = validateNotes(notes);
        const outboundNotes = notesValid ? safeNotes : '(notes removed: malicious content)';
        
        const wordList = (validatedWords || [])
          .map((w, i) => `${i + 1}. **${w.word}** (${w.direction}) - ${w.textClue}\n   SoundCloud URL: ${w.soundcloudUrl}\n   Timing: ${w.startAt || '0:00'} for ${w.audioDuration || 6}s`)
          .join('\n\n');

        const discordMessage = {
          embeds: [
            {
              title: '🧩 User Submitted Puzzle (New)',
              color: 5814783,
              fields: [
                {
                  name: '🔗 Link',
                  value: `https://crosstune.io/puzzles/${puzzleId}`,
                  inline: false
                },
                {
                  name: '📋 Title',
                  value: crosswordData.title || '(untitled)',
                  inline: true
                },
                {
                  name: '👤 Submitted by',
                  value: creditName,
                  inline: true
                },
                {
                  name: '📧 Contact email',
                  value: email || '(none provided)',
                  inline: true
                },
                {
                  name: '📝 Notes',
                  value: (outboundNotes && outboundNotes.trim())
                    ? (outboundNotes.length > 1024 ? outboundNotes.substring(0, 1021) + '...' : outboundNotes)
                    : '(none)',
                  inline: false
                },
                {
                  name: '🎵 Words',
                  value: wordList.length > 1024 ? wordList.substring(0, 1021) + '...' : wordList || '(none)',
                  inline: false
                }
              ],
              timestamp: new Date().toISOString(),
              footer: { text: 'Crosstune Puzzle Submission' }
            },
            {
              title: '🔧 Crossword JSON Data',
              color: 3447003,
              description: `\`\`\`json\n${JSON.stringify({ id: puzzleId, ...crosswordData }, null, 2).substring(0, 1990)}\`\`\``,
              timestamp: new Date().toISOString()
            }
          ]
        };

        // Fire and forget (don't block response)
        axios.post(DISCORD_WEBHOOK_URL, discordMessage).catch(err => {
             console.error('Failed to send Discord webhook:', err);
        });

      } catch (webhookError) {
        console.error('Error preparing Discord webhook:', webhookError);
        // Don't fail the request if webhook fails
      }
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


