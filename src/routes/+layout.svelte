<script>
  import "../app.css";
  import { setUser, setLoading } from "$lib/stores/auth.svelte.js";
  import AdBanner from "$lib/components/AdBanner.svelte";

  import { onMount } from 'svelte';
  import { invalidate } from '$app/navigation';
  import { supabase } from '$lib/supabaseClient';
  import { browser } from '$app/environment';

  const PUBLISHER_ID = 1025391;
  const WEBSITE_ID = 75604;

  let { children, data } = $props();

  // Guard store writes with browser check to prevent SSR cross-user leaks.
  // Module-level stores are singletons; writing during SSR can bleed between requests.
  $effect(() => {
     if (browser) {
       setUser(data.user ?? null);
       setLoading(false);
     }
  });

  onMount(async () => {
    // Verify the actual user from auth cookies instead of trusting SSR-provided data.
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user ?? null);
    setLoading(false);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, _session) => {
      invalidate('supabase:auth');
      setUser(_session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  });
</script>

<AdBanner PUB_ID={PUBLISHER_ID} WEBSITE_ID={WEBSITE_ID} />

{@render children()}
