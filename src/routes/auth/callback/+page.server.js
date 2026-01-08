import { redirect } from '@sveltejs/kit';

export const load = async ({ url, locals: { supabase } }) => {
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';

  console.log("Auth callback server load. Code present:", !!code, "Next:", next);

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      console.log("Session exchanged successfully. Redirecting to:", next);
      throw redirect(303, next);
    } else {
      console.error("Auth exchange error:", error);
    }
  }

  return {
    next
  };
};

