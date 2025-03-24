<script>
    import { getSolvedPuzzles } from '$lib/utils/storage.js';

    let { crosswords, onSelectDate } = $props();

    let currentDate = $state(new Date());
    let selectedDate = $state(null);
    let solvedPuzzles = $state(getSolvedPuzzles());
    
    // Parse crossword dates to find earliest and latest available dates
    const crosswordDates = Object.keys(crosswords).filter(date => {
        // Filter out any dummy/placeholder entries (like the X entries)
        return crosswords[date]?.words?.some(word => 
            word.word !== 'X' && word.audioUrl !== '000');
    }).sort();
    
    const earliestCrosswordDate = crosswordDates.length > 0 ? 
        new Date(crosswordDates[0]) : new Date();
    
    // Use today as the latest date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Initialize to current month, but ensure it's not before earliestCrosswordDate or after today
    $effect(() => {
        // If current date is set before earliest crossword date, reset to earliest
        if (currentDate < earliestCrosswordDate) {
            currentDate = new Date(earliestCrosswordDate);
        }
        
        // If current date is set after today, reset to today's month
        const currentMonthYear = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const todayMonthYear = new Date(today.getFullYear(), today.getMonth(), 1);
        if (currentMonthYear > todayMonthYear) {
            currentDate = new Date(todayMonthYear);
        }
    });

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
            const dateObj = new Date(dateString);
            
            // Check if this date is in the future
            const isFutureDate = dateObj > today;
            
            days.push({
                day,
                date: dateString,
                isPuzzleAvailable: !!crosswords[dateString] && !isFutureDate,
                isFutureDate
            });
        }
        
        return days;
    }

    // Navigate to previous month, but not before earliest crossword date
    function goToPreviousMonth() {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const earliestMonth = new Date(earliestCrosswordDate.getFullYear(), earliestCrosswordDate.getMonth(), 1);
        
        if (newDate >= earliestMonth) {
            currentDate = newDate;
        } else {
            currentDate = earliestMonth;
        }
    }

    // Navigate to next month, but not after current month
    function goToNextMonth() {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        const todayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        if (newDate <= todayMonth) {
            currentDate = newDate;
        }
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
    
    // Check if previous month button should be disabled
    function isPreviousMonthDisabled() {
        const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const earliestMonth = new Date(earliestCrosswordDate.getFullYear(), earliestCrosswordDate.getMonth(), 1);
        return previousMonth < earliestMonth;
    }
    
    // Check if next month button should be disabled
    function isNextMonthDisabled() {
        const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        const todayMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return nextMonth > todayMonth;
    }
</script>

<div class="container max-w-md mx-auto md:mt-6">
    <div class="bg-white shadow rounded-lg overflow-hidden">
        <div class="bg-gray-100 dark:bg-black px-1 py-1.5 border-b border-gray-200 flex items-center justify-between">
            <button 
                onclick={goToPreviousMonth} 
                class="p-2 rounded-full transition-colors duration-200"
                class:hover:bg-gray-200={!isPreviousMonthDisabled()}
                class:hover:bg-gray-800={!isPreviousMonthDisabled()}
                class:opacity-50={isPreviousMonthDisabled()}
                class:cursor-not-allowed={isPreviousMonthDisabled()}
                disabled={isPreviousMonthDisabled()}
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-9 w-9" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.24 7.24V16.76L13.41 12L20.24 7.24Z"/>
                    <rect x="12" y="7.24" width="2" height="9.52"/>
                </svg>
            </button>
            <h2 class="text-xl font-semibold">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button 
                onclick={goToNextMonth} 
                class="p-2 rounded-full transition-colors duration-200"
                class:hover:bg-gray-200={!isNextMonthDisabled()}
                class:dark:hover:bg-gray-800={!isNextMonthDisabled()}
                class:opacity-50={isNextMonthDisabled()}
                class:cursor-not-allowed={isNextMonthDisabled()}
                disabled={isNextMonthDisabled()}
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-9 w-9" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.76 7.24V16.76L10.59 12L3.76 7.24Z"/>
                    <rect x="10" y="7.24" width="2" height="9.52"/>
                </svg>
            </button>
        </div>
        
        <div class="dark:text-black grid grid-cols-7 text-center font-medium text-black-300 p-2">
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
                    class="p-1.5 aspect-square flex items-center justify-center rounded-xs transition-colors duration-200"
                    class:bg-black={selectedDate === dayObj.date}
                    class:text-white={selectedDate === dayObj.date || (selectedDate !== dayObj.date && solvedPuzzles.includes(dayObj.date))}
                    class:bg-green-500={selectedDate !== dayObj.date && solvedPuzzles.includes(dayObj.date)}
                    class:hover:bg-green-600={selectedDate !== dayObj.date && solvedPuzzles.includes(dayObj.date)}
                    class:bg-gray-200={selectedDate !== dayObj.date && dayObj.isPuzzleAvailable && !solvedPuzzles.includes(dayObj.date)}
                    class:hover:bg-gray-300={selectedDate !== dayObj.date && dayObj.isPuzzleAvailable && !solvedPuzzles.includes(dayObj.date)}
                    class:hover:bg-black={selectedDate !== dayObj.date && dayObj.isPuzzleAvailable && !solvedPuzzles.includes(dayObj.date)}
                    class:hover:text-white={selectedDate !== dayObj.date && dayObj.isPuzzleAvailable && !solvedPuzzles.includes(dayObj.date)}
                    class:text-black={selectedDate !== dayObj.date && dayObj.isPuzzleAvailable && !solvedPuzzles.includes(dayObj.date)}
                    class:text-gray-300={!dayObj.isPuzzleAvailable}
                    class:cursor-pointer={dayObj.isPuzzleAvailable}
                    class:cursor-not-allowed={!dayObj.isPuzzleAvailable}
                    class:opacity-50={dayObj.isFutureDate}
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
            class="bg-black dark:bg-white dark:text-black text-white text-3xl px-9 py-2 rounded"
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