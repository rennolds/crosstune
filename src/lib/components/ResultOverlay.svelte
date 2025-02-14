<script>
    let { time, isCorrect, onClose } = $props();
  
    // Convert time (in seconds) to MM:SS format
    function formatTime(totalSeconds) {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  </script>
  
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4 relative">
      <!-- Close button -->
      <button 
        onclick={onClose}
        class="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        aria-label="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
  
      <div class="text-center mt-4">
        {#if isCorrect}
          <h2 class="text-2xl font-bold text-green-600 mb-4">Congratulations!</h2>
          <p class="text-lg mb-4">You solved today's puzzle in {formatTime(time)}!</p>
          <button 
            class="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            SHARE
          </button>
        {:else}
          <h2 class="text-xl font-bold text-red-600 mb-4">At least one square is wrong.</h2>
          <button 
            onclick={onClose}
            class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            KEEP TRYING
          </button>
        {/if}
      </div>
    </div>
  </div>