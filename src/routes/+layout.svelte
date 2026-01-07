<script>
  import "../app.css";
  import { setUser, setLoading } from "$lib/stores/auth.svelte.js";
  import AdBanner from "$lib/components/AdBanner.svelte";
  import { onMount } from 'svelte';
  import { invalidate } from '$app/navigation';
  import { supabase } from '$lib/supabaseClient';

  const PUBLISHER_ID = 1025391;
  const WEBSITE_ID = 75604;

  let { children, data } = $props();

  // Sync initial session
  $effect(() => {
     setUser(data.user ?? null);
     setLoading(false);
  });

  onMount(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, _session) => {
      if (_session?.expires_at !== data.session?.expires_at) {
        invalidate('supabase:auth');
      }
      setUser(_session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  });
</script>

<AdBanner PUB_ID={PUBLISHER_ID} WEBSITE_ID={WEBSITE_ID} />
{@render children()}
