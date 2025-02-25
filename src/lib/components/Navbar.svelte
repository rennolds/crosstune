<script>
  import { 
    getIsCorrect,
    getSeconds,
    getTimerRunning,
    incrementSeconds,
    setTimerRunning 
  } from '$lib/stores/game.svelte.js';

  import { getUser } from '$lib/stores/auth.svelte.js';
  import { supabase } from '$lib/supabase';
  
  import SlideMenu from './SlideMenu.svelte';
  
  // Add new props for archive mode
  let { 
    archiveDate = null, 
    isArchiveMode = false,
    onBackToArchives = null
  } = $props();
  
  let isMenuOpen = $state(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }
  
  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  // Toggle body class for mobile scroll lock
  $effect(() => {
    if (typeof window !== 'undefined') {
      if (isMenuOpen) {
        document.body.classList.add('menu-open');
      } else {
        document.body.classList.remove('menu-open');
      }
    }
  });

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

<nav class="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 md:top-0">
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-12">
          <!-- Left side -->
          <div class="flex items-center">
              <button 
                class="p-2 rounded-md hover:bg-gray-100 w-10 h-10 flex items-center justify-center" 
                aria-label="Menu"
                onclick={() => isMenuOpen = !isMenuOpen}
              >
                {#if isMenuOpen}
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                {:else}
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                {/if}
              </button>      
              <div class="ml-4 font-mono text-lg">
                  {formatTime(getSeconds())}
              </div>
              
              <!-- Archive date display (when in archive mode) -->
              {#if isArchiveMode && archiveDate}
                <div class="ml-4 font-medium text-sm md:text-base flex items-center">
                  <span class="ml-1">{archiveDate}</span>
                  <!-- {#if onBackToArchives}
                    <button 
                      onclick={onBackToArchives}
                      class="ml-2 text-blue-600 hover:text-blue-800 text-xs md:text-sm"
                    >
                      (All Archives)
                    </button>
                  {/if} -->
                </div>
              {/if}
          </div>
  
          <!-- Right side -->
          <div class="flex items-center space-x-4">
            <button 
                class="p-2 rounded-md hover:bg-gray-100 font-medium"
                aria-label="Help"
            >
                Help!
            </button>

            <button 
                class="p-2 rounded-md hover:bg-gray-100"
                aria-label="Statistics"
            >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            </button>

            {#if getUser()}
              <button 
                onclick={handleSignOut}
                class="p-2 rounded-md hover:bg-gray-100"
              >
                Sign Out
              </button>
            {:else}
              <a 
                href="/auth" 
                class="p-2 rounded-md hover:bg-gray-100"
              >
                Login
              </a>
            {/if}
          </div>
      </div>
  </div>
</nav>

<SlideMenu 
isOpen={isMenuOpen}
onClose={() => isMenuOpen = false}
/>

<style>
:global(body) {
  padding-top: 3rem;
}

@media (max-width: 768px) {
  :global(body) {
    padding-top: 3rem;
  }
  
  nav {
    top: 50px;
  }
}
</style>