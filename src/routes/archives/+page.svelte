<script>
    import Navbar from '$lib/components/Navbar.svelte';
    import ArchiveList from '$lib/components/ArchiveList.svelte';
    import CrosswordGrid from '$lib/components/CrosswordGrid.svelte';
    import { goto } from '$app/navigation';
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
    
    function loadArchivePuzzle(date) {
        if (crosswords[date]) {
            selectedDate = date;
            puzzle = crosswords[date];
        }
    }
    
    function backToArchives() {
        selectedDate = null;
        puzzle = null;
    }
</script>
  
<main>
    {#if selectedDate}
        <!-- Show Navbar only when playing an archived puzzle -->
        <Navbar />
        
        <!-- Date display - Integrated into top section, smaller with back button -->
        <div class="fixed z-40 top-[48px] md:top-12 left-0 right-0 bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2">
            <button 
                onclick={backToArchives}
                class="p-1 rounded-md hover:bg-gray-100"
                aria-label="Back to archives"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </button>
            <h1 class="text-sm font-medium truncate">
                {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                })}
            </h1>
        </div>
        
        <!-- Add extra top padding to account for the date bar -->
        <div class="pt-10 md:pt-8">
            <CrosswordGrid puzzle={puzzle} isArchiveMode={true} selectedDate={selectedDate} />
        </div>
    {:else}
        <!-- Archives list view (no Navbar) -->
        <div class="container mx-auto px-4 py-4 max-w-5xl">
            <div class="flex items-center justify-between mb-6">
                <h1 class="text-2xl font-bold">Crossword Archives</h1>
                <button 
                    onclick={() => goto('/')}
                    class="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                >
                    Play Today's Puzzle
                </button>
            </div>
            <ArchiveList 
                crosswords={crosswords} 
                onSelectDate={loadArchivePuzzle} 
            />
        </div>
    {/if}
</main>

<style>
    /* Adjust for mobile devices with the ad space at top */
    @media (max-width: 768px) {
        .fixed {
            top: 98px !important; /* 48px navbar + 50px ad space */
        }
        
        .pt-10 {
            padding-top: 3.5rem !important;
        }
    }
</style>