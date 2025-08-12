import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, platform }) {
	try {
		const { puzzle_id } = await request.json();
		
		if (!puzzle_id) {
			return json({ error: 'puzzle_id is required' }, { status: 400 });
		}

		// Get the D1 database binding
		const db = platform?.env?.['solve-db'];
		
		if (!db) {
			console.error('Database not available');
			return json({ error: 'Database not available' }, { status: 500 });
		}

		// Get client IP and User-Agent for tracking (optional)
		const clientIP = request.headers.get('cf-connecting-ip') || 
						request.headers.get('x-forwarded-for') || 
						'unknown';
		const userAgent = request.headers.get('user-agent') || 'unknown';
		
		// Hash IP and UA for privacy (simple hash for now)
		const ipHash = await hashString(clientIP);
		const uaHash = await hashString(userAgent);
		
		// Generate a simple session ID based on IP + UA + time window (1 hour)
		const timeWindow = Math.floor(Date.now() / (1000 * 60 * 60)); // 1 hour windows
		const sessionId = await hashString(`${clientIP}-${userAgent}-${timeWindow}`);

		// Start a transaction to update both tables
		const results = await db.batch([
			// Insert the solve event
			db.prepare(`
				INSERT INTO solve_events (puzzle_id, ip_hash, ua_hash, session_id)
				VALUES (?, ?, ?, ?)
			`).bind(puzzle_id, ipHash, uaHash, sessionId),
			
			// Update or insert the solve count
			db.prepare(`
				INSERT INTO solves (puzzle_id, solve_count, updated_at)
				VALUES (?, 1, unixepoch())
				ON CONFLICT(puzzle_id) DO UPDATE SET
					solve_count = solve_count + 1,
					updated_at = unixepoch()
			`).bind(puzzle_id)
		]);

		// Check if both operations succeeded
		if (results.every(result => result.success)) {
			return json({ success: true, puzzle_id });
		} else {
			console.error('Database operation failed:', results);
			return json({ error: 'Failed to record solve' }, { status: 500 });
		}

	} catch (error) {
		console.error('Error recording solve:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}

// Simple hash function for privacy
async function hashString(str) {
	const encoder = new TextEncoder();
	const data = encoder.encode(str);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
	return hashHex;
}
