import { error } from '@sveltejs/kit';

export async function load({ params, platform }) {
  const db = platform?.env?.['solve-db'];
  if (!db) {
    throw error(500, 'Database not available');
  }

  const id = params.id;
  const row = await db
    .prepare(
      `SELECT id, puzzle_json, created_at, created_by
       FROM custom_puzzles
       WHERE id = ?`
    )
    .bind(id)
    .first();

  if (!row) {
    throw error(404, 'Puzzle not found');
  }

  let puzzle;
  try {
    puzzle = JSON.parse(row.puzzle_json);
  } catch {
    throw error(500, 'Invalid puzzle JSON');
  }

  return {
    id: row.id,
    created_at: row.created_at,
    created_by: row.created_by,
    puzzle
  };
}


