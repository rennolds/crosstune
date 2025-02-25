<script>
    let { crosswords, onSelectDate } = $props();
    
    // Format date strings from YYYY-MM-DD to more readable format
    function formatDate(dateStr) {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    
    // Get all available dates and sort them in reverse chronological order
    let dates = $derived(
      Object.keys(crosswords)
        .filter(date => {
          // Get today's date in YYYY-MM-DD format to exclude future dates
          const today = new Date().toISOString().split('T')[0];
          return date <= today;
        })
        .sort((a, b) => new Date(b) - new Date(a))
    );
    
    // Group dates by month for better organization
    let groupedDates = $derived(() => {
      const groups = {};
      
      dates.forEach(date => {
        const monthYear = new Date(date).toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        });
        
        if (!groups[monthYear]) {
          groups[monthYear] = [];
        }
        
        groups[monthYear].push(date);
      });
      
      return groups;
    });
</script>
  
<div class="grid md:grid-cols-2 gap-6">
    {#each Object.entries(groupedDates) as [monthYear, monthDates]}
        <div class="bg-white shadow rounded-lg overflow-hidden">
        <div class="bg-gray-100 px-4 py-3 border-b border-gray-200">
            <h2 class="text-lg font-semibold">{monthYear}</h2>
        </div>
        <ul class="divide-y divide-gray-200">
            {#each monthDates as date}
            <li>
                <button 
                onclick={() => onSelectDate(date)}
                class="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                <span>{formatDate(date)}</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
                </button>
            </li>
            {/each}
        </ul>
        </div>
    {/each}
</div>

{#if dates.length === 0}
<div class="text-center py-8">
    <p class="text-lg text-gray-600">No archived puzzles are available.</p>
</div>
{/if}