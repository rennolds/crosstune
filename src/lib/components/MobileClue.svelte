<script>
    let { clue, onPlay, isPlaying } = $props();

    import crosswords from "$lib/data/crosswords.json";
    const puzzle = crosswords["2024-02-09"];
    const { words } = puzzle;

    function findAdjacentClue(currentClue, direction) {
        if (!currentClue) return null;

        // Sort all words by number (based on position)
        const sortedWords = [...words].sort((a, b) => {
            if (a.startY === b.startY) {
                return a.startX - b.startX;
            }
            return a.startY - b.startY;
        });

        // Find current index
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
      class="flex items-center gap-3 h-full px-4"
      style="background-color: {clue.color};"
    >
      <!-- Left Arrow -->
      <button
        class="p-2"
        onclick={() => handleNavigation('prev')}
        aria-label="Previous clue"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <!-- Clue Content -->
      <span class="font-medium text-base">{clue.number}{clue.direction.charAt(0).toUpperCase()}</span>
      <span class="text-black font-bold ml-4">•</span>
      <span class="text-base flex-1">{clue.textClue}</span>
      
      <!-- Play Button -->
      <button
        onclick={() => onPlay(clue)}
        style="width: 40px; height: 40px; padding: 0; border: none; background: none;"
        disabled={isPlaying}
      >
        {#if isPlaying}
            <svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 20 20" height="40px" viewBox="0 0 20 20" width="40px" fill="#000000"><g><rect fill="none" height="20" width="20"/></g><g><path d="M10,2c-4.42,0-8,3.58-8,8s3.58,8,8,8s8-3.58,8-8S14.42,2,10,2z M8.25,13L8.25,13c-0.41,0-0.75-0.34-0.75-0.75v-4.5 C7.5,7.34,7.84,7,8.25,7h0C8.66,7,9,7.34,9,7.75v4.5C9,12.66,8.66,13,8.25,13z M11.75,13L11.75,13C11.34,13,11,12.66,11,12.25v-4.5 C11,7.34,11.34,7,11.75,7h0c0.41,0,0.75,0.34,0.75,0.75v4.5C12.5,12.66,12.16,13,11.75,13z"/></g></svg>       
        {:else}
            <svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 20 20" height="40px" viewBox="0 0 20 20" width="40px" fill="#000000"><g><rect fill="none" height="20" width="20"/></g><g><path d="M10,2c-4.42,0-8,3.58-8,8s3.58,8,8,8s8-3.58,8-8S14.42,2,10,2z M8,12.59V7.41c0-0.39,0.44-0.63,0.77-0.42l4.07,2.59 c0.31,0.2,0.31,0.65,0,0.84l-4.07,2.59C8.44,13.22,8,12.98,8,12.59z"/></g></svg>
        {/if}
      </button>

      <!-- Right Arrow -->
      <button
        class="p-2"
        onclick={() => handleNavigation('next')}
        aria-label="Next clue"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  </div>
{/if}