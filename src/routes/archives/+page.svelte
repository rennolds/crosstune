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
    <Navbar />
    
    {#if !selectedDate}
      <div class="container mx-auto px-4 py-8 max-w-5xl">
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
    {:else}
      <div class="flex-col md:flex-row flex items-start md:items-center justify-between px-4 mb-3 mt-3">
        <div class="flex items-center gap-2">
          <button 
            onclick={backToArchives}
            class="p-2 rounded-md hover:bg-gray-100"
            aria-label="Back to archives"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 class="text-xl font-bold">{new Date(selectedDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</h1>
        </div>
      </div>
      
      <CrosswordGrid {puzzle} isArchiveMode={true} {selectedDate} />
    {/if}
</main>