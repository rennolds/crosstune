<script>
	import '../app.css';
	import { supabase } from '$lib/supabase';
	import { setUser, setLoading } from '$lib/stores/auth.svelte.js';
	import AdBanner from '$lib/components/AdBanner.svelte';
	
	let { children } = $props();
  
	$effect(() => {
	  // Set up auth state listener
	  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
		setUser(session?.user ?? null);
		setLoading(false);
	  });
  
	  // Get initial session
	  supabase.auth.getSession().then(({ data: { session } }) => {
		setUser(session?.user ?? null);
		setLoading(false);
	  });
  
	  // Cleanup subscription
	  return () => {
		subscription.unsubscribe();
	  };
	});
</script>

<AdBanner />
{@render children()}