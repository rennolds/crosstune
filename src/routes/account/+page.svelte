<script>
    import { onMount } from 'svelte';
    import { supabase } from '$lib/supabaseClient';
  
    let status = 'Checking…';
    let user = null;
    let profile = null;
    let errorMsg = '';
  
    async function loadState() {
      errorMsg = '';
      const { data: { user: u }, error: uErr } = await supabase.auth.getUser();
      if (uErr) errorMsg = uErr.message;
      user = u;
  
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .maybeSingle();
        profile = data || null;
        status = 'Authenticated';
      } else {
        profile = null;
        status = 'Unauthenticated';
      }
    }
  
    onMount(() => {
      loadState();
      supabase.auth.onAuthStateChange((_evt, session) => {
        user = session?.user ?? null;
        if (user) {
          supabase.from('profiles').select('username').eq('id', user.id)
            .maybeSingle().then(({ data }) => profile = data || null);
          status = 'Authenticated';
        } else {
          profile = null;
          status = 'Unauthenticated';
        }
      });
    });
  
    async function logout() {
      await supabase.auth.signOut();
      await loadState();
    }
  </script>
  
  <main class="max-w-lg mx-auto p-6 space-y-4">
    <h1 class="text-xl font-semibold">Account debug</h1>
    <p><strong>Status:</strong> {status}</p>
    {#if errorMsg}<p class="text-red-600">{errorMsg}</p>{/if}
    {#if user}
      <pre class="bg-gray-100 p-3 rounded"><code>{JSON.stringify({ id: user.id, email: user.email }, null, 2)}</code></pre>
      <pre class="bg-gray-100 p-3 rounded"><code>{JSON.stringify(profile, null, 2)}</code></pre>
      <button class="border rounded px-3 py-2" on:click={logout}>Log out</button>
    {:else}
      <p>You are not logged in.</p>
    {/if}
  </main>
  