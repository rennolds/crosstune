<script>
    import CrosswordGrid2 from '$lib/components/CrosswordGrid2.svelte';
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

<Navbar 
    onRevealSquare={revealSquare} 
    onRevealWord={revealWord} 
    onRevealPuzzle={revealPuzzle}
    hideTimer={showSplash}
/>
{#if showSplash}
    
    <SplashScreen onPlay={handlePlay} />

{:else}
    <main class="dark min-h-screen">
        <CrosswordGrid2 
            onSetRevealFunctions={handleRevealFunctions}
        />
    </main>
{/if}