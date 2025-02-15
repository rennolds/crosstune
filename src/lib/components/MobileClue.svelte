<script>
    let { clue, onPlay, isPlaying } = $props();
</script>
  
{#if clue}
  <div class="fixed bottom-[165px] left-0 right-0 h-13 bg-white border-t border-gray-200 shadow-lg mb-4">
    <div 
      class="flex items-center gap-3 h-full px-4"
      style="background-color: {clue.color};"
    >
      <span class="font-medium text-base">{clue.number}{clue.direction.charAt(0).toUpperCase()}</span>
      <span class="text-black font-bold ml-4">•</span>
      <span class="text-base flex-1">{clue.textClue}</span>
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
    </div>
  </div>
{/if}