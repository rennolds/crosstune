/** @type {import('./$types').RequestHandler} */
export async function GET({ params, locals }) {
	try {
		const { puzzle_id } = params;
		
		if (!puzzle_id) {
			return new Response(JSON.stringify({ error: 'puzzle_id is required' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const { data: result, error } = await locals.supabase
			.from('solves')
			.select('puzzle_id, solve_count, updated_at')
			.eq('puzzle_id', puzzle_id)
			.single();

		if (error && error.code !== 'PGRST116') { // Ignore "not found" error
			console.error('Supabase error:', error);
			throw error;
		}

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
