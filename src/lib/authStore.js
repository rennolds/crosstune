import { writable } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';

export const user = writable(null);
export const profile = writable(null);

async function fetchProfile(id) {
  const { data } = await supabase.from('profiles')
    .select('username, display_name')
    .eq('id', id)
    .maybeSingle();
  profile.set(data || null);
}

(async () => {
  const { data: { user: u } } = await supabase.auth.getUser();
  user.set(u);
  if (u) fetchProfile(u.id);
})();

supabase.auth.onAuthStateChange((_evt, session) => {
  const u = session?.user ?? null;
  user.set(u);
  if (u) fetchProfile(u.id);
  else profile.set(null);
});
