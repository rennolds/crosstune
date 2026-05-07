export async function load({ url, locals }) {
  const puzzleId = url.searchParams.get('id');
  if (!puzzleId) return { puzzleData: null, puzzleId: null };

  const { user } = await locals.safeGetSession();

  const { data: row } = await locals.supabase
    .from('crosstune_puzzles')
    .select('id, puzzle_json, user_id')
    .eq('id', puzzleId)
    .single();

  if (!row) return { puzzleData: null, puzzleId: null };

  // Only the owner may edit
  if (!user || row.user_id !== user.id) return { puzzleData: null, puzzleId: null };

  try {
    const puzzle = JSON.parse(row.puzzle_json);
    return { puzzleData: puzzle, puzzleId: puzzleId };
  } catch {
    return { puzzleData: null, puzzleId: null };
  }
}
