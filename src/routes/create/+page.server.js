export async function load({ url, locals }) {
  const puzzleId = url.searchParams.get('id');
  if (!puzzleId) return { puzzleData: null, puzzleId: null };
  const isAdminLoad = url.searchParams.get('admin') === 'true';

  const { user } = await locals.safeGetSession();

  const { data: row } = await locals.supabase
    .from('crosstune_puzzles')
    .select('id, puzzle_json, user_id')
    .eq('id', puzzleId)
    .single();

  if (!row) return { puzzleData: null, puzzleId: null };

  // Owner can edit. With ?admin=true, anyone can load the JSON into the
  // editor for re-use (this is the dashboard "Edit" flow). The JSON is
  // already publicly readable via /puzzles/[id], so this isn't an extra
  // data exposure — and saving will go through the regular auth-protected
  // POST/PATCH endpoints under the admin's own user_id.
  const isOwner = user && row.user_id === user.id;
  if (!isOwner && !isAdminLoad) return { puzzleData: null, puzzleId: null };

  try {
    const puzzle = JSON.parse(row.puzzle_json);
    return {
      puzzleData: puzzle,
      // Only treat as an edit (PATCH same record) when actual owner.
      // Admin-load opens the puzzle in the editor but saves as a new puzzle.
      puzzleId: isOwner ? puzzleId : null,
    };
  } catch {
    return { puzzleData: null, puzzleId: null };
  }
}
