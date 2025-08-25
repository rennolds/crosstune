import { error, json } from '@sveltejs/kit';

export async function load({ platform }) {
  const db = platform?.env?.['solve-db'];
  if (!db) {
    throw error(500, 'Database not available');
  }

  // Fetch recent custom puzzles with id, title, and created_at
  const { results } = await db
    .prepare(
      `SELECT 
        id,
        json_extract(puzzle_json, '$.title') AS title,
        created_at
       FROM custom_puzzles
       ORDER BY created_at DESC
       LIMIT 50`
    )
    .all();

  return { puzzles: results ?? [] };
}


