<script>
    import Navbar from '$lib/components/Navbar.svelte';
    import ArchiveList from '$lib/components/ArchiveList.svelte';
    import CrosswordGrid2 from '$lib/components/CrosswordGrid2.svelte';
    import crosswords from "$lib/data/crosswords.json";
    
    $effect(() => {
        if (typeof document !== 'undefined') {
            document.title = selectedDate ? 
                `Archive: ${formatCompactDate(selectedDate)} - Crosstune` : 
                'Archives - Crosstune';
        }
    });

    let selectedDate = $state(null);
    let puzzle = $state(null);
    
    // References to hold the reveal functions
    let revealSquare = $state(null);
    let revealWord = $state(null);
    let revealPuzzle = $state(null);
    
    // Check if there's a date in the URL on load
    $effect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const dateParam = params.get('date');
            if (dateParam && crosswords[dateParam]) {
                loadArchivePuzzle(dateParam);
            }
        }
    });
    
    function loadArchivePuzzle(date) {
        if (crosswords[date]) {
            selectedDate = date;
            puzzle = crosswords[date];
            
            // Update URL with the selected date
            if (typeof window !== 'undefined') {
                const url = new URL(window.location);
                url.searchParams.set('date', date);
                window.history.pushState({}, '', url);
            }
        }
    }
    
    // Function to format date in a compact way (MM/DD/YY) using Eastern Time
    function formatCompactDate(dateString) {
        // Create a date object with the date components in Eastern Time
        // We use noon ET to avoid any potential DST issues
        const date = new Date(`${dateString}T12:00:00-04:00`);
        
        // Format the date for display in Eastern Time
        return date.toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: '2-digit',
            timeZone: 'America/New_York' // Ensure Eastern Time
        });
    }
    
    // Function to receive the reveal functions from CrosswordGrid
    function handleRevealFunctions(functions) {
        revealSquare = functions.revealSquare;
        revealWord = functions.revealWord;
        revealPuzzle = functions.revealPuzzle;
    }
    
    // Navigation functions
    function navigateToArchives() {
        selectedDate = null;
        // Update URL to remove date parameter
        if (typeof window !== 'undefined') {
            const url = new URL(window.location);
            url.searchParams.delete('date');
            window.history.pushState({}, '', url);
        }
    }
    
    function navigateToToday() {
        window.location.href = '/';
    }
    
    function navigateToHome() {
        window.location.href = '/';
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
            onNavigateToArchives={navigateToArchives}
            onNavigateToToday={navigateToToday}
            onNavigateToHome={navigateToHome}
        />
        <CrosswordGrid2 
            puzzle={puzzle} 
            isArchiveMode={true} 
            selectedDate={selectedDate} 
            onSetRevealFunctions={handleRevealFunctions}
        />
    {:else}
        <!-- In archive list mode, hide the timer but still show we're in archive mode -->
        <Navbar 
            hideTimer={true} 
            isArchiveMode={true}
            onNavigateToToday={navigateToToday}
            onNavigateToHome={navigateToHome}
        />
        <div class="archives-container mx-auto px-4 py-4 w-full max-w-5xl">
            <div class="flex items-center justify-center mb-6">
                <h1 class="text-2xl font-bold dark:text-gray-200">Crosstune Archives</h1>
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