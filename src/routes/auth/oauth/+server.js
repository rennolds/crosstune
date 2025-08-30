import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { redirect } from '@sveltejs/kit';

function safeNext(raw) {
  if (!raw) return '/';
  if (/^https?:\/\//i.test(raw)) return '/';
  return raw.startsWith('/') ? raw : '/';
}

export async function GET({ url, cookies }) {
  const provider = url.searchParams.get('provider') ?? 'google';
  const next = safeNext(url.searchParams.get('next'));

  const supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, { ...options, path: '/' });
        });
      }
    }
  });

  // MUST be same-origin for PKCE
  const redirectTo = `${url.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo }
  });

  if (error || !data?.url) {
    throw redirect(303, '/auth/auth-code-error');
  }

  throw redirect(303, data.url);
}
