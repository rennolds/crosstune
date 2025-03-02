
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

    // Function to format date in a compact way (MM/DD/YY)
    function formatCompactDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: '2-digit'
        });
    }
</script>
  
<main>
    {#if selectedDate}
        <!-- Pass the formatted date to Navbar component -->
        <Navbar archiveDate={formatCompactDate(selectedDate)} isArchiveMode={true} onBackToArchives={backToArchives} />
        
        <!-- No need for separate date bar now -->
        <CrosswordGrid puzzle={puzzle} isArchiveMode={true} selectedDate={selectedDate} />
    {:else}
        <!-- Archives list view (no Navbar) -->
        <div class="mx-auto px-4 py-4 w-full max-w-5xl">
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