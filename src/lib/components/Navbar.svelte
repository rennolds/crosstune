<script>
  import { 
    getIsCorrect,
    getSeconds,
    getTimerRunning,
    incrementSeconds,
    setTimerRunning 
  } from '$lib/stores/game.svelte.js';

  import { getIsDarkMode, toggleDarkMode } from '$lib/stores/theme.svelte.js';

  import { getUser } from '$lib/stores/auth.svelte.js';
  import { supabase } from '$lib/supabase';
  
  // Import the fixed SlideMenu component
  import SlideMenu from './SlideMenu.svelte';
  import RevealMenu from './RevealMenu.svelte';
  
  // ADD new props for archive mode and reveal functions
  let { 
    archiveDate = null, 
    isArchiveMode = false,
    onRevealSquare = null,
    onRevealWord = null,
    onRevealPuzzle = null,
    hideTimer = false, // Add new prop to hide the timer
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

<nav class="bg-white dark:bg-black border-b border-gray-200 fixed top-0 left-0 right-0 z-50 md:top-0">
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

            <button 
            class="p-2 rounded-md hover:bg-gray-100"
            aria-label="Toggle dark mode"
            onclick={() => toggleDarkMode()}
            >
            {#if getIsDarkMode()}
              <!-- Moon icon for dark mode -->
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            {:else}
              <!-- Light bulb icon for light mode -->
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            {/if}
          </button>

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