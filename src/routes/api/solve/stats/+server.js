/** @type {import('./$types').RequestHandler} */
export async function GET({ locals, url }) {
	try {
		// Check for query parameters
		const limit = parseInt(url.searchParams.get('limit') || '50');
		const offset = parseInt(url.searchParams.get('offset') || '0');

		// Get solve counts for all puzzles
		const { data: results, error, count } = await locals.supabase
			.from('solves')
			.select('puzzle_id, solve_count, updated_at', { count: 'exact' })
			.order('solve_count', { ascending: false })
			.order('updated_at', { ascending: false })
			.range(offset, offset + limit - 1);

		if (error) {
			console.error('Supabase error:', error);
			throw error;
		}

		return new Response(JSON.stringify({
			puzzles: results || [],
			total: count || 0,
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
