<script>
    let { crosswords, onSelectDate } = $props();
    
    // State for current month and selected date
    let currentDate = $state(new Date());
    let selectedDate = $state(null);

    // Get days in a month
    function getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    // Get first day of the month (0-6, where 0 is Sunday)
    function getFirstDayOfMonth(year, month) {
        return new Date(year, month, 1).getDay();
    }

    // Generate calendar days
    function generateCalendarDays() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        
        const days = [];
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }
        
        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            days.push({
                day,
                date: dateString,
                isPuzzleAvailable: !!crosswords[dateString]
            });
        }
        
        return days;
    }

    // Navigate to previous month
    function goToPreviousMonth() {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    }

    // Navigate to next month
    function goToNextMonth() {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }

    // Format date for display
    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    }

    function handleDateSelect(dayObj) {
        if (dayObj && dayObj.isPuzzleAvailable) {
            selectedDate = dayObj.date;
        }
    }

    // Handle playing the selected puzzle
    function handlePlayPuzzle() {
        if (selectedDate) {
            onSelectDate(selectedDate);
        }
    }
</script>

<div class="container max-w-xl mx-auto md:mt-6">
    <div class="bg-white shadow rounded-lg overflow-hidden">
        <div class="bg-gray-100 px-1 py-1.5 border-b border-gray-200 flex items-center justify-between">
            <button onclick={goToPreviousMonth} class="p-2 hover:bg-gray-200 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-9 w-9" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.24 7.24V16.76L13.41 12L20.24 7.24Z"/>
                    <rect x="12" y="7.24" width="2" height="9.52"/>
                </svg>
            </button>
            <h2 class="text-xl font-semibold">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button onclick={goToNextMonth} class="p-2 hover:bg-gray-200 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-9 w-9" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.76 7.24V16.76L10.59 12L3.76 7.24Z"/>
                    <rect x="10" y="7.24" width="2" height="9.52"/>
                </svg>
            </button>
        </div>
        
        <div class="grid grid-cols-7 text-center font-medium text-black-300 p-2">
            {#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day}
                <div>{day}</div>
            {/each}
        </div>
        
        <div class="grid grid-cols-7 gap-4 text-center p-2">
            {#each generateCalendarDays() as dayObj}
                {#if dayObj === null}
                    <div></div>
                {:else}
                    <button 
                        onclick={() => handleDateSelect(dayObj)}
                        class="p-1.5 aspect-square flex items-center justify-center rounded-xs"
                        class:bg-black={selectedDate === dayObj.date}
                        class:text-white={selectedDate === dayObj.date}
                        class:bg-gray-200={selectedDate !== dayObj.date && dayObj.isPuzzleAvailable}
                        class:text-black={selectedDate !== dayObj.date && dayObj.isPuzzleAvailable}
                        class:text-gray-300={!dayObj.isPuzzleAvailable}
                        disabled={!dayObj.isPuzzleAvailable}
                    >
                        {dayObj.day}
                    </button>
                {/if}
            {/each}
        </div>
        
    </div>
    <div class="p-4 flex justify-between items-center">
        <span class="text-lg font-medium">
            {selectedDate ? formatDate(selectedDate) : ''}
        </span>
        <button 
            onclick={() => handlePlayPuzzle(generateCalendarDays().find(d => d?.date === selectedDate))}
            class="bg-black text-white text-3xl px-9 py-2 rounded"
            disabled={!selectedDate}
        >
            Start
        </button>
    </div>
</div>

<style>
    /* Mobile-specific styles */
    @media (max-width: 768px) {
        .container {
            height: 100%;
            margin-top: 0;
            padding-top: 0;
        }
    }
</style>