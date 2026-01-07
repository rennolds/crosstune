import { error } from '@sveltejs/kit';

export async function load({ params, locals, platform }) {
  const id = params.id;
  
  // 1. Try Supabase first (New System)
  const { data: row, error: dbError } = await locals.supabase
    .from('crosstune_puzzles')
    .select('id, puzzle_json, created_at, credit_name')
    .eq('id', id)
    .single();

  // If found in Supabase, return it
  if (row) {
    let puzzle;
    try {
      puzzle = JSON.parse(row.puzzle_json);
    } catch {
      throw error(500, 'Invalid puzzle JSON');
    }
    return {
      id: row.id,
      created_at: row.created_at,
      credit_name: row.credit_name,
      puzzle
    };
  }

  // 2. Fallback: Try Cloudflare D1 (Legacy System)
  const db = platform?.env?.['solve-db'];
  if (db) {
    try {
      const d1Row = await db
        .prepare('SELECT id, puzzle_json, created_at, created_by FROM custom_puzzles WHERE id = ?')
        .bind(id)
        .first();

      if (d1Row) {
        let puzzle;
        try {
          puzzle = JSON.parse(d1Row.puzzle_json);
        } catch {
          throw error(500, 'Invalid puzzle JSON in legacy DB');
        }

        return {
          id: d1Row.id,
          // Convert D1 Unix timestamp to ISO string for consistency if needed, or keep as is.
          // Supabase uses ISO strings, D1 uses unix epoch integers usually.
          // Let's standardize to ISO string for the frontend.
          created_at: new Date(d1Row.created_at * 1000).toISOString(),
          credit_name: d1Row.created_by || 'anon',
          puzzle
        };
      }
    } catch (e) {
      console.error('Legacy DB lookup failed:', e);
    }
  }

  throw error(404, 'Puzzle not found');
}


