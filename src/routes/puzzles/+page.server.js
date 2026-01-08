import { error } from '@sveltejs/kit';

export async function load({ locals }) {
  const { data: results, error: dbError } = await locals.supabase
    .from('crosstune_puzzles')
    .select('id, puzzle_json, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (dbError) {
    console.error('Database error:', dbError);
    throw error(500, 'Database error');
  }

  const puzzles = results.map(row => {
    let title = '(Untitled)';
    try {
      const json = JSON.parse(row.puzzle_json);
      title = json.title || '(Untitled)';
    } catch (e) {}
    return {
      id: row.id,
      title,
      created_at: row.created_at // Supabase returns ISO string which works fine
    };
  });

  return { puzzles: puzzles ?? [] };
}


