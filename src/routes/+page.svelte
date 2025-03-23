<script>
    import CrosswordGrid from '$lib/components/CrosswordGrid.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import SplashScreen from '$lib/components/SplashScreen.svelte';
    import { saveSplashShown } from '$lib/utils/storage';
    
    let showSplash = $state(true);
    // References to hold the reveal functions
    let revealSquare = $state(null);
    let revealWord = $state(null);
    let revealPuzzle = $state(null);

    // Always show splash screen when landing on the main route
    // No need for the effect to check localStorage anymore

    function handlePlay() {
        showSplash = false;
        saveSplashShown(); // Still save that they've seen it, even though we'll show it again on reload
    }
    
    // Function to receive the reveal functions from CrosswordGrid
    function handleRevealFunctions(functions) {
        revealSquare = functions.revealSquare;
        revealWord = functions.revealWord;
        revealPuzzle = functions.revealPuzzle;
    }
</script>

{#if showSplash}
    <SplashScreen onPlay={handlePlay} />
{:else}
    <main class="min-h-screen">
        <Navbar 
            onRevealSquare={revealSquare} 
            onRevealWord={revealWord} 
            onRevealPuzzle={revealPuzzle} 
        />
        <CrosswordGrid 
            onSetRevealFunctions={handleRevealFunctions}
        />
    </main>
{/if}