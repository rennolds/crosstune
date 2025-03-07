<script>
  let { clue, onPlay, isPlaying, playingClue, onStopAudio, words } = $props();

  // Add a derived state to accurately track if the current clue is playing
  let isCurrentClueActive = $derived(
    isPlaying && playingClue && clue && 
    playingClue.startX === clue.startX && 
    playingClue.startY === clue.startY && 
    playingClue.direction === clue.direction
  );

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
</script>

{#if clue}
  <div class="fixed bottom-[165px] left-0 right-0 h-13 bg-white border-t border-gray-200 shadow-lg mb-4">
    <div 
      class="flex items-center justify-between h-full"
      style="background-color: {clue.color};"
    >
      <!-- Left Section -->
      <div class="flex items-center">
        <!-- Skip Previous Button - larger and touching left edge -->
        <button
          class="p-2 -ml-2"
          onclick={() => handleNavigation('prev')}
          aria-label="Previous clue"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-9 w-9" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.24 7.24V16.76L13.41 12L20.24 7.24Z"/>
            <rect x="12" y="7.24" width="2" height="9.52"/>
          </svg>
        </button>

        <!-- Clue Info -->
        <div class="flex items-center gap-2 ml-2">
          <span class="text-lg font-semibold">{clue.number}{clue.direction.charAt(0).toUpperCase()}</span>
          <div class="h-5 w-[1.5px] bg-black"></div>
          <span class="text-lg">{clue.textClue}</span>
        </div>
      </div>

      <!-- Right Section -->
      <div class="flex items-center">
        <!-- Play/Pause Button - Now using isCurrentClueActive -->
        <button
          onclick={() => onPlay(clue)}
          class="w-[70px] h-[30px] mr-2.5 bg-black text-white rounded-md text-lg font-medium"
        >
          <span class="block text-center">
            {isCurrentClueActive ? 'Pause' : 'Play'}
          </span>
        </button>

        <!-- Skip Next Button - larger and touching right edge -->
        <button
          class="p-2 -mr-2"
          onclick={() => handleNavigation('next')}
          aria-label="Next clue"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-9 w-9" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.76 7.24V16.76L10.59 12L3.76 7.24Z"/>
            <rect x="10" y="7.24" width="2" height="9.52"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
{/if}