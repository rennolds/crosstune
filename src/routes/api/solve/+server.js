/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	try {
		const { puzzle_id } = await request.json();
		
		if (!puzzle_id) {
			return new Response(JSON.stringify({ error: 'puzzle_id is required' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Use Supabase RPC for atomic increment
		const { error } = await locals.supabase
			.rpc('increment_solve_count', { p_id: puzzle_id });

		if (error) {
			console.error('Supabase error:', error);
			throw error;
		}

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
