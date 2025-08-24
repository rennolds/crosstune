import { json } from '@sveltejs/kit';
import axios from 'axios';
import { DISCORD_WEBHOOK_URL } from '$env/static/private';

export async function POST({ request }) {
  try {
    const submissionData = await request.json();

    if (!submissionData.grid || !submissionData.words || submissionData.words.length === 0) {
      return new Response('Invalid puzzle submission', { status: 400 });
    }

    // Convert grid data to crossword JSON format (matching crosswords.json structure)
    const crosswordData = {
      title: submissionData.details.boardTitle || "",
      version: "1.0.0",
      size: {
        width: 12,
        height: 10
      },
      theme: "black",
      words: submissionData.words.map((word) => ({
        word: word.word,
        startX: word.col,
        startY: word.row,
        direction: word.direction.toLowerCase(),
        color: "#FF5B5E", // Default color, to be assigned later
        textClue: word.clue,
        audioUrl: word.trackId.toString(), // SoundCloud track ID
        startAt: word.startAt || "0:00", // User-selected start time
        audioDuration: word.audioDuration || 6, // User-selected duration
        soundcloudUrl: word.soundcloudUrl // Store original URL for reference
      }))
    };

    // Format submission details as a simple list
    const submissionDetails = [
      submissionData.details.creditName ? `• Credit Name: ${submissionData.details.creditName}` : null,
      submissionData.details.boardTitle ? `• Board Title: ${submissionData.details.boardTitle}` : null,
      submissionData.details.email ? `• Email: ${submissionData.details.email}` : null,
      submissionData.details.notes ? `• Notes: ${submissionData.details.notes}` : null
    ].filter(Boolean).join('\n') || '• No additional details provided';

    // Create word list for Discord
    const wordList = submissionData.words.map((word, index) => 
      `${index + 1}. **${word.word}** (${word.direction}) - ${word.clue}\n   SoundCloud URL: ${word.soundcloudUrl}\n   Audio URL: ${word.trackId}\n   Timing: ${word.startAt || '0:00'} for ${word.audioDuration || 6}s`
    ).join('\n\n');

    // Calculate stats
    const stats = {
      totalWords: submissionData.words.length,
      averageWordLength: Math.round(submissionData.words.reduce((sum, word) => sum + word.word.length, 0) / submissionData.words.length),
      longestWord: Math.max(...submissionData.words.map(word => word.word.length)),
      shortestWord: Math.min(...submissionData.words.map(word => word.word.length))
    };

    // Construct the Discord message
    const discordMessage = {
      embeds: [
        {
          title: '🧩 New Crosstune Puzzle Submission',
          color: 5814783, // Green color
          fields: [
            {
              name: '📋 Submission Details',
              value: submissionDetails,
              inline: false
            },
            {
              name: '📊 Puzzle Stats',
              value: `**Total Words:** ${stats.totalWords}\n**Average Length:** ${stats.averageWordLength} letters\n**Range:** ${stats.shortestWord}-${stats.longestWord} letters`,
              inline: true
            },
            {
              name: '🎵 Words, Clues & SoundCloud Links',
              value: wordList.length > 1024 ? wordList.substring(0, 1021) + '...' : wordList,
              inline: false
            }
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: 'Crosstune Puzzle Submission'
          }
        },
        {
          title: '🔧 Crossword JSON Data',
          color: 3447003, // Blue color
          description: `\`\`\`json\n${JSON.stringify(crosswordData, null, 2).substring(0, 1990)}\`\`\``,
          timestamp: new Date().toISOString()
        }
      ]
    };

    await axios.post(DISCORD_WEBHOOK_URL, discordMessage);

    return json({ status: 'success', message: 'Puzzle submitted successfully!' });
  } catch (error) {
    console.error('Failed to submit puzzle:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
