<script>
    import CrosswordGrid from '$lib/components/CrosswordGrid.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import SplashScreen from '$lib/components/SplashScreen.svelte';
    
    let showSplash = $state(true);

    function handlePlay() {
        showSplash = false;
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