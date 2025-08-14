import { json } from '@sveltejs/kit';
import axios from 'axios';
import { env } from '$env/dynamic/private';

export async function POST({ request }) {
  try {
    console.log('POST request received for puzzle submission');
    
    // Check if Discord webhook URL is configured
    if (!env.DISCORD_WEBHOOK_URL) {
      console.error('DISCORD_WEBHOOK_URL environment variable is not set');
      return new Response('Service configuration error', { status: 500 });
    }
    
    console.log('Discord webhook URL is configured:', env.DISCORD_WEBHOOK_URL);

    const submissionData = await request.json();
    console.log('Received submission data:', JSON.stringify(submissionData, null, 2));

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
        audioUrl: "", // To be filled later
        startAt: "", // To be filled later
        audioDuration: 0, // To be filled later
        metadata_song: word.songName,
        metadata_artist: word.artistName
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
      `${index + 1}. **${word.word}** (${word.direction}) - ${word.clue}\n   Artist: ${word.artistName} | Song: ${word.songName}`
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
              name: '🎵 Words & Clues',
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

    console.log('Sending Discord message...');
    console.log('Discord message size:', JSON.stringify(discordMessage).length, 'characters');
    
    await axios.post(env.DISCORD_WEBHOOK_URL, discordMessage);
    console.log('Discord message sent successfully');

    return json({ status: 'success', message: 'Puzzle submitted successfully!' });
  } catch (error) {
    console.error('Failed to submit puzzle - Error details:', {
      message: error.message,
      stack: error.stack,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : 'No response data'
    });
    
    // Return more specific error information
    if (error.response) {
      return new Response(`Discord webhook error: ${error.response.status} ${error.response.statusText}`, { status: 500 });
    } else if (error.request) {
      return new Response('Network error: Could not reach Discord webhook', { status: 500 });
    } else {
      return new Response(`Internal error: ${error.message}`, { status: 500 });
    }
  }
}
