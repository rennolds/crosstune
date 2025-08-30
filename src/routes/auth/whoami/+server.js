export async function GET({ locals }) {
    const { data: { user } } = await locals.supabase.auth.getUser();
    return new Response(JSON.stringify({ user }), {
      headers: { 'content-type': 'application/json' }
    });
  }