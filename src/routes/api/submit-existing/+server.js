import { json } from '@sveltejs/kit';
import axios from 'axios';
import { DISCORD_WEBHOOK_URL } from '$env/static/private';
import { sanitizeAuthor, sanitizeTitle, validateNotes } from '$lib/utils/filters.js';

export async function POST({ request, locals }) {
  try {
    const { id, creditName, email, notes } = await request.json();
    if (!id) {
      return new Response('Missing id', { status: 400 });
    }

    const { data: row, error } = await locals.supabase
      .from('crosstune_puzzles')
      .select('id, puzzle_json')
      .eq('id', id)
      .single();

    if (error || !row) {
      return new Response('Not found', { status: 404 });
    }

    const puzzle = JSON.parse(row.puzzle_json);
    // Sanitize title (max 100 already stored, but ensure on outbound)
    puzzle.title = sanitizeTitle(puzzle.title || '');

    // Sanitize submitter and notes for outbound to Discord
    const safeCredit = sanitizeAuthor(creditName || '');
    const { valid: notesValid, value: safeNotes } = validateNotes(notes || '');
    const outboundNotes = notesValid ? safeNotes : '(notes removed: malicious content)';

    const wordList = (puzzle.words || [])
      .map((w, i) => `${i + 1}. **${w.word}** (${w.direction}) - ${w.textClue}\n   SoundCloud URL: ${w.soundcloudUrl}\n   Audio URL: ${w.audioUrl}\n   Timing: ${w.startAt || '0:00'} for ${w.audioDuration || 6}s`)
      .join('\n\n');

    const discordMessage = {
      embeds: [
        {
          title: '🧩 User Submitted Existing Puzzle',
          color: 5814783,
          fields: [
            {
              name: '🔗 Link',
              value: `https://crosstune.io/puzzles/${id}`,
              inline: false
            },
            {
              name: '📋 Title',
              value: puzzle.title || '(untitled)',
              inline: true
            },
            {
              name: '👤 Submitted by',
              value: safeCredit || '(anonymous)',
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
          description: `\`\`\`json\n${JSON.stringify({ id, ...puzzle }, null, 2).substring(0, 1990)}\`\`\``,
          timestamp: new Date().toISOString()
        }
      ]
    };

    await axios.post(DISCORD_WEBHOOK_URL, discordMessage);

    return json({ status: 'success' });
  } catch (error) {
    console.error('Failed to submit existing puzzle:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}


