export async function load({ url, locals }) {
  const puzzleId = url.searchParams.get('id');
  if (!puzzleId) return { puzzleData: null };

  const { data: row } = await locals.supabase
    .from('crosstune_puzzles')
    .select('id, puzzle_json')
    .eq('id', puzzleId)
    .single();

  if (!row) return { puzzleData: null };

  try {
    const puzzle = JSON.parse(row.puzzle_json);
    return { puzzleData: puzzle };
  } catch {
    return { puzzleData: null };
  }
}
