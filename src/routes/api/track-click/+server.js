const VISITOR_COOKIE = 'crosstune_visitor_id';

/** @type {import('./$types').RequestHandler} */
export async function POST(event) {
  const { locals: { supabase }, cookies, url } = event;

  let body;
  try {
    body = await event.request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 400 });
  }

  const source = typeof body?.source === 'string' ? body.source.slice(0, 64) : null;
  if (!source) return new Response(JSON.stringify({ ok: false }), { status: 400 });

  // Resolve or mint a visitor session ID
  let sessionId = cookies.get(VISITOR_COOKIE);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
  }

  const { error } = await supabase
    .from('movie_click_events')
    .insert({ source, session_id: sessionId });

  if (error) {
    console.error('[track-click] insert error:', error.message);
    // Still return 200 — tracking failures shouldn't affect the user
  }

  // Persist the visitor cookie for 1 year
  cookies.set(VISITOR_COOKIE, sessionId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    secure: url.protocol === 'https:',
    sameSite: 'lax'
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
