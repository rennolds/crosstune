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
  
  // Import the fixed SlideMenu component
  import SlideMenu from './SlideMenu.svelte';
  import RevealMenu from './RevealMenu.svelte';
  
  // Add new props for archive mode and reveal functions
  let { 
    archiveDate = null, 
    isArchiveMode = false,
    onRevealSquare = null,
    onRevealWord = null,
    onRevealPuzzle = null,
    hideTimer = false, // Add new prop to hide the timer
    onNavigateToArchives = () => window.location.href = '/archives',
    onNavigateToToday = () => window.location.href = '/'
  } = $props();
  
  let isMenuOpen = $state(false);
  let isRevealMenuOpen = $state(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }
  
  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  function toggleRevealMenu() {
    isRevealMenuOpen = !isRevealMenuOpen;
  }
  
  function handleRevealSquare() {
    if (onRevealSquare) {
      onRevealSquare();
      isRevealMenuOpen = false;
    }
  }
  
  function handleRevealWord() {
    if (onRevealWord) {
      onRevealWord();
      isRevealMenuOpen = false;
    }
  }
  
  function handleRevealPuzzle() {
    if (onRevealPuzzle) {
      onRevealPuzzle();
      isRevealMenuOpen = false;
    }
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
              <!-- Menu button with improved clickability -->
              <button 
                class="p-2 rounded-md hover:bg-gray-100 w-10 h-10 flex items-center justify-center" 
                aria-label="Menu"
                onclick={() => isMenuOpen = !isMenuOpen}
                style="position: relative; z-index: 60;"
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
              
              <!-- Only show timer if not in archive list view -->
              {#if !hideTimer}
                <div class="ml-4 font-mono text-lg">
                    {formatTime(getSeconds())}
                </div>
              {/if}
              
              <!-- Archive date display (when in archive mode) -->
              {#if isArchiveMode && archiveDate}
                <div class="ml-4 font-medium text-sm md:text-base flex items-center">
                  <span class="ml-1">{archiveDate}</span>
                </div>
              {/if}
          </div>
  
          <!-- Right side -->
          <div class="flex items-center space-x-4">
            <!-- Archive navigation buttons - positioned in the middle -->
            {#if isArchiveMode && !hideTimer}
              <div class="flex space-x-2 mr-2">
                <!-- Back to Archives button -->
                <button 
                  class="px-2 py-1 text-xs md:text-sm flex items-center rounded hover:bg-gray-100" 
                  onclick={onNavigateToArchives}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                  Archives
                </button>
                
                <!-- Back to Today's Crosstune button -->
                <button 
                  class="px-2 py-1 text-xs md:text-sm flex items-center rounded hover:bg-gray-100" 
                  onclick={onNavigateToToday}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                  Today
                </button>
              </div>
            {/if}

            <!-- Only show reveal dropdown if not in archive list view -->
            {#if !hideTimer}
              <div class="relative">
                <button 
                    class="p-2 rounded-md hover:bg-gray-100 font-medium reveal-button"
                    aria-label="Reveal"
                    onclick={toggleRevealMenu}
                >
                    Reveal
                </button>
                
                <RevealMenu 
                  isOpen={isRevealMenuOpen}
                  onClose={() => isRevealMenuOpen = false}
                  onRevealSquare={handleRevealSquare}
                  onRevealWord={handleRevealWord}
                  onRevealPuzzle={handleRevealPuzzle}
                />
              </div>
            {/if}

            {#if getUser()}
              <button 
                onclick={handleSignOut}
                class="p-2 rounded-md hover:bg-gray-100"
              >
                Sign Out
              </button>
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