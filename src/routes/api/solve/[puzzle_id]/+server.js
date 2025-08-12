import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function GET({ params, platform }) {
	try {
		const { puzzle_id } = params;
		
		if (!puzzle_id) {
			return json({ error: 'puzzle_id is required' }, { status: 400 });
		}

		// Get the D1 database binding
		const db = platform?.env?.['solve-db'];
		
		if (!db) {
			console.error('Database not available');
			return json({ error: 'Database not available' }, { status: 500 });
		}

		// Get solve count for the puzzle
		const result = await db.prepare(`
			SELECT puzzle_id, solve_count, updated_at
			FROM solves 
			WHERE puzzle_id = ?
		`).bind(puzzle_id).first();

		if (!result) {
			return json({ 
				puzzle_id, 
				solve_count: 0, 
				updated_at: null 
			});
		}

		return json(result);

	} catch (error) {
		console.error('Error retrieving solve count:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
