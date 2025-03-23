<script>
    import CrosswordGrid from '$lib/components/CrosswordGrid.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import SplashScreen from '$lib/components/SplashScreen.svelte';
    
    // Check if we should show splash on load (always show on main route)
    
    // References to hold the reveal functions
    let revealSquare = $state(null);
    let revealWord = $state(null);
    let revealPuzzle = $state(null);
    let showSplash = $state(true);

    function handlePlay() {
        showSplash = false;
    }
    
    // Function to receive the reveal functions from CrosswordGrid
    function handleRevealFunctions(functions) {
        revealSquare = functions.revealSquare;
        revealWord = functions.revealWord;
        revealPuzzle = functions.revealPuzzle;
    }
    
    function navigateToHome() {
        window.location.reload();
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
            onNavigateToHome={navigateToHome}
        />
        <CrosswordGrid 
            onSetRevealFunctions={handleRevealFunctions}
        />
    </main>
{/if}