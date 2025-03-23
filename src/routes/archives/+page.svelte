<script>
    import Navbar from '$lib/components/Navbar.svelte';
    import ArchiveList from '$lib/components/ArchiveList.svelte';
    import CrosswordGrid from '$lib/components/CrosswordGrid.svelte';
    import crosswords from "$lib/data/crosswords.json";
    
    $effect(() => {
        if (typeof document !== 'undefined') {
            document.title = selectedDate ? 
                `Archive: ${new Date(selectedDate).toLocaleDateString()} - Crosstune` : 
                'Archives - Crosstune';
        }
    });

    let selectedDate = $state(null);
    let puzzle = $state(null);
    
    // References to hold the reveal functions
    let revealSquare = $state(null);
    let revealWord = $state(null);
    let revealPuzzle = $state(null);
    
    function loadArchivePuzzle(date) {
        if (crosswords[date]) {
            selectedDate = date;
            puzzle = crosswords[date];
        }
    }
    
    // Function to format date in a compact way (MM/DD/YY)
    function formatCompactDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: '2-digit'
        });
    }
    
    // Function to receive the reveal functions from CrosswordGrid
    function handleRevealFunctions(functions) {
        revealSquare = functions.revealSquare;
        revealWord = functions.revealWord;
        revealPuzzle = functions.revealPuzzle;
    }
</script>
  
<main>
    {#if selectedDate}
        <!-- In archive puzzle mode, show the timer -->
        <Navbar 
            archiveDate={formatCompactDate(selectedDate)} 
            isArchiveMode={true} 
            onRevealSquare={revealSquare} 
            onRevealWord={revealWord} 
            onRevealPuzzle={revealPuzzle}
        />
        <CrosswordGrid 
            puzzle={puzzle} 
            isArchiveMode={true} 
            selectedDate={selectedDate} 
            onSetRevealFunctions={handleRevealFunctions}
        />
    {:else}
        <!-- In archive list mode, hide the timer -->
        <Navbar hideTimer={true} />
        <div class="archives-container mx-auto px-4 py-4 w-full max-w-5xl">
            <div class="flex items-center justify-between mb-6">
                <h1 class="text-2xl font-bold">Crossword Archives</h1>
            </div>
            <ArchiveList 
                crosswords={crosswords} 
                onSelectDate={loadArchivePuzzle} 
            />
        </div>
    {/if}
</main>

<style>
    /* Mobile-specific styles */
    @media (max-width: 768px) {
        .archives-container {
            padding-top: 0;
            margin-top: 0;
        }
    }
</style>