export async function load({ locals }) {
    const { data: { user } } = await locals.supabase.auth.getUser();
  
    if (!user) {
      return { status: 'Unauthenticated', user: null, profile: null };
    }
  
    const { data: profile } = await locals.supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .maybeSingle();
  
    return {
      status: 'Authenticated',
      user: { id: user.id, email: user.email },
      profile: profile ?? null
    };
  }
  