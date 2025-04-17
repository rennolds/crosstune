<script>
	import '../app.css';
	import { setUser, setLoading } from '$lib/stores/auth.svelte.js';
	// import AdBanner from '$lib/components/AdBanner.svelte';
	
	let { children } = $props();
</script>

<!-- <AdBanner /> -->
{@render children()}