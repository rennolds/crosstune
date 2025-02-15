<script>
    import { 
      getIsCorrect,
      getSeconds,
      getTimerRunning,
      incrementSeconds,
      setTimerRunning 
    } from '$lib/stores/game.svelte.js';
    
    function formatTime(totalSeconds) {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    $effect(() => {
      if (typeof document !== 'undefined') {
        const handleVisibilityChange = () => {
          if (document.hidden) {
            setTimerRunning(false);
          } else {
            setTimerRunning(true);
          }
        };
  
        document.addEventListener('visibilitychange', handleVisibilityChange);
  
        const interval = setInterval(() => {
          if (getTimerRunning() && !document.hidden && !getIsCorrect()) {
            incrementSeconds();
          }
        }, 1000);
    
        return () => {
          clearInterval(interval);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      }
    });
</script>
  <div class="h-[50px] w-full bg-gray-200 md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-center">
    <span class="text-gray-500">Ad Space (320x50)</span>
  </div>
  <nav class="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-14">
        <!-- Left side -->
        <div class="flex items-center">
          <button 
            class="p-2 rounded-md hover:bg-gray-100"
            aria-label="Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div class="ml-4 font-mono text-lg">
            {formatTime(getSeconds())}
          </div>
        </div>
  
        <!-- Right side -->
        <div class="flex items-center space-x-4">
          <div class="relative">
            <button 
              class="p-2 rounded-md hover:bg-gray-100 font-medium"
              aria-label="Help"
            >
              Help!
            </button>
          </div>
  
          <button 
            class="p-2 rounded-md hover:bg-gray-100"
            aria-label="Statistics"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
  
          <button 
            class="p-2 rounded-md hover:bg-gray-100"
            aria-label="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </nav>
  
<style>
  :global(body) {
    padding-top: 3.5rem;
  }

  @media (max-width: 768px) {
    :global(body) {
      padding-top: calc(3.5rem + 50px);
    }
  }
</style>
