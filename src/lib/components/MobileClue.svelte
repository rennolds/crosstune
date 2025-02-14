<script>
    let { clue, onPlay, isPlaying } = $props();
</script>
  
{#if clue}
  <div class="fixed bottom-[180px] left-0 right-0 h-11 bg-white border-t border-gray-200 shadow-lg mb-4">
    <div class="flex items-center gap-1 h-full px-2">
      <span class="font-medium text-sm w-4">{clue.number}.</span>
      <span class="text-xs flex-1">{clue.direction.charAt(0).toUpperCase() + clue.direction.slice(1)} • {clue.length} letters</span>
      <button
        onclick={() => onPlay(clue)}
        class="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 disabled:opacity-50"
        disabled={isPlaying}
      >
        {isPlaying ? "Playing..." : "Play"}
      </button>
    </div>
  </div>
{/if}