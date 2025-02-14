<script>
    let { clue, onPlay, isPlaying } = $props();
  </script>
  
  {#if clue}
    <div class="fixed bottom-[220px] left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
      <div class="flex items-center gap-2 max-w-xl mx-auto">
        <span class="font-medium w-6">{clue.number}.</span>
        <span class="text-sm flex-1">{clue.direction.charAt(0).toUpperCase() + clue.direction.slice(1)} • {clue.length} letters</span>
        <button
          onclick={() => onPlay(clue)}
          class="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
          disabled={isPlaying}
        >
          {isPlaying ? "Playing..." : "Play"}
        </button>
      </div>
    </div>
  {/if}