<script>
    let { clue, onPlay, isPlaying } = $props();
</script>
  
{#if clue}
  <div class="fixed bottom-[170px] left-0 right-0 h-14 bg-white border-t border-gray-200 shadow-lg mb-4">
    <div 
      class="flex items-center gap-3 h-full px-4"
      style="background-color: {clue.color};"
    >
      <span class="font-medium text-base">{clue.number}{clue.direction.charAt(0).toUpperCase()}</span>
      <span class="text-black font-bold ml-4">•</span>
      <span class="text-base flex-1">{clue.textClue}</span>
      <button
        onclick={() => onPlay(clue)}
        class="w-11 h-11 flex items-center justify-center rounded-full bg-black text-white hover:bg-gray-800 disabled:opacity-50"
        disabled={isPlaying}
      >
        {#if isPlaying}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
          </svg>
        {/if}
      </button>
    </div>
  </div>
{/if}