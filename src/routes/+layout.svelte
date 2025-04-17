<script>

  import "../app.css";
  import { setUser, setLoading } from "$lib/stores/auth.svelte.js";
  import AdBanner from "$lib/components/AdBanner.svelte";

  const PUBLISHER_ID = 1025391; // Define the ID
  const WEBSITE_ID = 75604; // Define the ID

  let { children } = $props();
</script>

<AdBanner PUB_ID={PUBLISHER_ID} WEBSITE_ID={WEBSITE_ID} />
{@render children()}