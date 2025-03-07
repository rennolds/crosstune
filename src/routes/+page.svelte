<!-- src/routes/+page.svelte -->
<script>
    import CrosswordGrid from '$lib/components/CrosswordGrid.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import SplashScreen from '$lib/components/SplashScreen.svelte';
    import { shouldShowSplash, saveSplashShown } from '$lib/utils/storage';
    
    let showSplash = $state(true);
    // References to hold the reveal functions
    let revealSquare = $state(null);
    let revealWord = $state(null);
    let revealPuzzle = $state(null);

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
    <main class="min-h-screen bg-[#F3F4F6]">
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