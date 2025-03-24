<script>
  let { clue, onPlay, isPlaying, playingClue, onStopAudio, words } = $props();

  import { isWidgetReady } from "$lib/stores/game.svelte.js";

  // Add a derived state to accurately track if the current clue is playing
  let isCurrentClueActive = $derived(
    isPlaying && playingClue && clue && 
    playingClue.startX === clue.startX && 
    playingClue.startY === clue.startY && 
    playingClue.direction === clue.direction
  );

  let currentWidgetReady = $state(false);
  let screenWidth = $state(window.innerWidth);

  // Track screen size changes
  $effect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        screenWidth = window.innerWidth;
      };
      
      screenWidth = window.innerWidth;
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  });

  $effect(() => {
    if (!clue) {
      currentWidgetReady = false;
      return;
    }
    
    // Initialize with current state
    const widgetId = `${clue.startX}:${clue.startY}:${clue.direction}`;
    currentWidgetReady = isWidgetReady(widgetId);
    
    // Set up an interval to keep checking until ready
    const checkInterval = setInterval(() => {
      const isReady = isWidgetReady(widgetId);
      if (isReady) {
        currentWidgetReady = true;
        clearInterval(checkInterval);
      }
    }, 200);
    
    // Clean up interval when component is destroyed or clue changes
    return () => clearInterval(checkInterval);
  });

  function findAdjacentClue(currentClue, direction) {
    if (!currentClue) return null;

    const sortedWords = [...words].sort((a, b) => {
      if (a.startY === b.startY) {
        return a.startX - b.startX;
      }
      return a.startY - b.startY;
    });

    const currentIndex = sortedWords.findIndex(word => 
      word.startX === currentClue.startX && 
      word.startY === currentClue.startY &&
      word.direction === currentClue.direction
    );

    if (direction === 'next') {
      const nextIndex = (currentIndex + 1) % sortedWords.length;
      return sortedWords[nextIndex];
    } else {
      const prevIndex = (currentIndex - 1 + sortedWords.length) % sortedWords.length;
      return sortedWords[prevIndex];
    }
  }

  function handleNavigation(direction) {
    if (isPlaying) {
      onStopAudio();
    }
    
    const nextClue = findAdjacentClue(clue, direction);
    if (nextClue) {
      const event = new CustomEvent('navigationrequest', {
        detail: {
          startX: nextClue.startX,
          startY: nextClue.startY,
          direction: nextClue.direction
        }
      });
      document.dispatchEvent(event);
    }
  }
  
  // Function to truncate clue text based on screen width
  function truncateClueText(text) {
    if (!text) return '';
    
    let maxLength = 80;
    
    if (screenWidth < 360) {
      maxLength = 25;
    } else if (screenWidth < 480) {
      maxLength = 35; 
    } else if (screenWidth < 640) {
      maxLength = 50;
    }
    
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
</script>

{#if clue}
  <div class="fixed bottom-[165px] left-0 right-0 bg-white shadow-lg dark:text-black z-20">
    <div 
      class="flex items-center justify-between h-full"
      style="background-color: {clue.color};"
    >
      <!-- Left Section -->
      <div class="flex items-center">
        <!-- Skip Previous Button - larger and touching left edge -->
        <button
          class="p-2 -ml-1"
          onclick={() => handleNavigation('prev')}
          aria-label="Previous clue"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.24 7.24V16.76L13.41 12L20.24 7.24Z"/>
            <rect x="12" y="7.24" width="2" height="9.52"/>
          </svg>
        </button>

        <!-- Clue Info - with responsive truncation -->
        <div class="flex items-center gap-1 ml-1 mr-1 overflow-hidden">
          <span class="text-lg font-semibold whitespace-nowrap">{clue.number}{clue.direction.charAt(0).toUpperCase()}</span>
          <div class="h-4 w-[1px] bg-black mx-1"></div>
          <span class="text-base overflow-hidden whitespace-nowrap">{truncateClueText(clue.textClue)}</span>
        </div>
      </div>

      <!-- Right Section -->
      <div class="flex items-center">
        <!-- Play/Pause Button - Now with reactive loading state -->
        <button
          onclick={() => onPlay(clue)}
          class="min-w-[60px] h-[30px] mr-1 bg-black text-white rounded-md text-base font-medium"
          disabled={!currentWidgetReady && !isCurrentClueActive}
        >
          <span class="block text-center px-2">
            {#if isCurrentClueActive}
              Pause
            {:else if !currentWidgetReady}
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="2" 
                stroke-linecap="round" 
                stroke-linejoin="round" 
                class="animate-spin inline-block"
              >
                <circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
                <path d="M12 2C6.47715 2 2 6.47715 2 12C2 12.6343 2.06115 13.2554 2.17856 13.8577" />
              </svg>
            {:else}
              Play
            {/if}
          </span>
        </button>

        <!-- Skip Next Button - larger and touching right edge -->
        <button
          class="p-2 -mr-1"
          onclick={() => handleNavigation('next')}
          aria-label="Next clue"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.76 7.24V16.76L10.59 12L3.76 7.24Z"/>
            <rect x="10" y="7.24" width="2" height="9.52"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Responsive adjustments for the mobile clue */
  @media (max-width: 480px) {
    .fixed.bottom-\[165px\] {
      height: auto;
      min-height: 48px;
    }
    
    .h-7 {
      height: 1.5rem;
    }
    
    .w-7 {
      width: 1.5rem;
    }
    
    .min-w-\[60px\] {
      min-width: 50px;
    }
  }
  
  /* Extra small screen adjustments */
  @media (max-width: 360px) {
    .text-lg {
      font-size: 0.95rem;
    }
    
    .text-base {
      font-size: 0.85rem;
    }
    
    .h-\[30px\] {
      height: 26px;
    }
    
    .min-w-\[60px\] {
      min-width: 45px;
    }
    
    .p-2 {
      padding: 0.4rem;
    }
    
    .h-7, .w-7 {
      height: 1.4rem;
      width: 1.4rem;
    }
  }
</style>