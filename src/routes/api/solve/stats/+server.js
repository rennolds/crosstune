/** @type {import('./$types').RequestHandler} */
export async function GET({ platform, url }) {
	try {
		// Get the D1 database binding
		const db = platform?.env?.['solve-db'];
		
		if (!db) {
			return new Response(JSON.stringify({ error: 'Database not available' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Check for query parameters
		const limit = parseInt(url.searchParams.get('limit') || '50');
		const offset = parseInt(url.searchParams.get('offset') || '0');

		// Get solve counts for all puzzles, ordered by solve count descending
		const { results } = await db.prepare(`
			SELECT puzzle_id, solve_count, updated_at
			FROM solves 
			ORDER BY solve_count DESC, updated_at DESC
			LIMIT ? OFFSET ?
		`).bind(limit, offset).all();

		// Get total count
		const totalResult = await db.prepare(`
			SELECT COUNT(*) as total
			FROM solves
		`).first();

		return new Response(JSON.stringify({
			puzzles: results || [],
			total: totalResult?.total || 0,
			limit,
			offset
		}), {
			headers: { 'Content-Type': 'application/json' }
		});

	} catch (error) {
		console.error('Error retrieving solve stats:', error);
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}
