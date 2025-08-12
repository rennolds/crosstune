/** @type {import('./$types').RequestHandler} */
export async function GET({ params, platform }) {
	try {
		const { puzzle_id } = params;
		
		if (!puzzle_id) {
			return new Response(JSON.stringify({ error: 'puzzle_id is required' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Get the D1 database binding
		const db = platform?.env?.['solve-db'];
		
		if (!db) {
			return new Response(JSON.stringify({ error: 'Database not available' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Get solve count for the puzzle
		const result = await db.prepare(`
			SELECT puzzle_id, solve_count, updated_at
			FROM solves 
			WHERE puzzle_id = ?
		`).bind(puzzle_id).first();

		if (!result) {
			return new Response(JSON.stringify({ 
				puzzle_id, 
				solve_count: 0, 
				updated_at: null 
			}), {
				headers: { 'Content-Type': 'application/json' }
			});
		}

		return new Response(JSON.stringify(result), {
			headers: { 'Content-Type': 'application/json' }
		});

	} catch (error) {
		console.error('Error retrieving solve count:', error);
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}
