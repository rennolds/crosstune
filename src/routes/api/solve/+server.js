/** @type {import('./$types').RequestHandler} */
export async function POST({ request, platform }) {
	try {
		const { puzzle_id } = await request.json();
		
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

		// Simple approach - just increment the solve count
		const { results } = await db.prepare(`
			INSERT INTO solves (puzzle_id, solve_count, updated_at)
			VALUES (?, 1, unixepoch())
			ON CONFLICT(puzzle_id) DO UPDATE SET
				solve_count = solve_count + 1,
				updated_at = unixepoch()
		`).bind(puzzle_id).run();

		return new Response(JSON.stringify({ success: true, puzzle_id }), {
			headers: { 'Content-Type': 'application/json' }
		});

	} catch (error) {
		console.error('Error recording solve:', error);
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}
