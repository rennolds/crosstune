<!-- src/routes/+page.svelte -->
<script>
    import CrosswordGrid from '$lib/components/CrosswordGrid.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import SplashScreen from '$lib/components/SplashScreen.svelte';
    import { shouldShowSplash, saveSplashShown } from '$lib/utils/storage';
    
    let showSplash = $state(true);

    // Initialize showSplash based on stored state
    $effect(() => {
        if (typeof window !== 'undefined') {
            showSplash = shouldShowSplash();
        }
    });

    function handlePlay() {
        showSplash = false;
        saveSplashShown();
    }
</script>

{#if showSplash}
    <SplashScreen onPlay={handlePlay} />
{:else}
    <main>
        <Navbar />
        <CrosswordGrid />
    </main>
{/if}