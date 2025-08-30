export async function POST({ locals }) {
    await locals.supabase.auth.signOut();
    return new Response(null, { status: 204 });
  }