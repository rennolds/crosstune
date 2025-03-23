<script>
  let { isOpen, onClose } = $props();
  let isMobileDevice = $state(false);

  $effect(() => {
    isMobileDevice = window.matchMedia('(max-width: 768px)').matches;
  });

  // Modify the click handler to prevent event propagation issues
  function handleClickOutside(event) {
    // Only process clicks outside the menu AND outside the menu button
    if (!isMobileDevice && isOpen) {
      // Check for the menu-button class or data attribute to identify the button
      const menu = document.querySelector('.slide-menu');
      const menuButton = document.querySelector('[aria-label="Menu"]');
      if (menu && !menu.contains(event.target) && menuButton && !menuButton.contains(event.target)) {
        onClose();
      }
    }
  }

  $effect(() => {
    if (typeof document !== 'undefined') {
      // Use mousedown instead of click for better mobile experience
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  });
  
  // Function to handle Home navigation
  function navigateToHome() {
    window.location.href = '/';
    if (isMobileDevice) {
      onClose();
    }
  }
  
  // Function to handle Archives navigation
  function navigateToArchives() {
    // Get the current path
    const currentPath = window.location.pathname;
    
    // If we're on the /archives route but viewing a specific puzzle
    if (currentPath.startsWith('/archives') && window.location.search !== '') {
      // Strip the search parameters to go back to archives list
      window.location.href = '/archives';
    } else if (currentPath !== '/archives') {
      // If we're on any other page (not archives at all)
      window.location.href = '/archives';
    }
    
    if (isMobileDevice) {
      onClose();
    }
  }
</script>
  
<div 
  class="fixed inset-0 transition-all z-40 pointer-events-none"
  class:md:pointer-events-auto={isOpen}
  >
  <div 
    class="absolute inset-0 bg-black bg-opacity-50 transition-opacity md:hidden"
    class:opacity-0={!isOpen}
    class:invisible={!isOpen}
    onclick={onClose}
  ></div>

  <div 
    class="slide-menu fixed top-0 md:top-[48px] bg-white transition-transform duration-300 ease-in-out transform overflow-auto
            md:w-80 w-full md:shadow-lg
            md:h-[calc(100vh-48px)] h-full
            md:pt-0 pt-[calc(48px+50px)]
            md:left-1/2 md:-translate-x-1/2 left-0"
    class:translate-x-0={isOpen && isMobileDevice}
    class:opacity-100={isOpen && !isMobileDevice}
    class:opacity-0={!isOpen && !isMobileDevice}
    class:-translate-x-full={!isOpen && isMobileDevice}
    class:pointer-events-auto={isOpen}
    class:pointer-events-none={!isOpen}
    style="z-index: 50;"
    >
    <div class="p-6 flex flex-col h-full">
      <h2 class="text-2xl font-bold mb-6">Menu</h2>
      
      <!-- Menu Items -->
      <nav class="space-y-1">
        <!-- Home navigation button -->
        <button 
          class="flex w-full items-center py-2 hover:bg-gray-100 rounded px-3 transition-colors"
          onclick={navigateToHome}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h2a1 1 0 001-1v-7m-6 0L12 5" />
          </svg>
          Home
        </button>
        
        <!-- Archives navigation button -->
        <button 
          class="flex w-full items-center py-2 hover:bg-gray-100 rounded px-3 transition-colors"
          onclick={navigateToArchives}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          Archives
        </button>
        
        <a 
          href="/privacy" 
          class="flex items-center py-2 hover:bg-gray-100 rounded px-3 transition-colors"
          onclick={(e) => {
            if (isMobileDevice) {
              onClose();
            }
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Privacy
        </a>
      </nav>
      
      <!-- Our Games Section -->
      <div class="mt-8 flex-grow">
        <h2 class="text-2xl font-bold mb-4">Our games</h2>
        
        <div class="space-y-3">
          <!-- Spotle Card -->
          <a href="/spotle" class="block bg-gray-50 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow max-w-[90%]">
            <div class="aspect-video bg-gray-200 w-full" style="max-height: 120px;">
              <img src="/spotle.png" alt="Spotle" class="w-full h-full object-cover" />
            </div>
            <div class="p-2">
              <h3 class="font-semibold text-sm">Spotle: Guess the Artist</h3>
            </div>
          </a>
          
          <!-- Harmonies Card -->
          <a href="/harmonies" class="block bg-gray-50 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow max-w-[90%]">
            <div class="aspect-video bg-gray-200 w-full" style="max-height: 120px;">
              <img src="/harmonies.png" alt="Harmonies" class="w-full h-full object-cover" />
            </div>
            <div class="p-2">
              <h3 class="font-semibold text-sm">Harmonies: Music Connections</h3>
            </div>
          </a>
        </div>
      </div>

      <!-- Company info footer -->
      <div class="mt-auto pt-6 text-center">
        <p class="text-sm font-medium text-gray-700">made by flatwhite studios</p>
        <p class="text-xs text-gray-500">inquiries: company@flatwhite-studios.com</p>
      </div>
    </div>
  </div>
</div>

<style>
  .slide-menu {
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y; /* Enable vertical scrolling */
    pointer-events: auto !important; /* Ensure clicks work */
  }

  /* Make all interactive elements explicitly clickable */
  .slide-menu a,
  .slide-menu button {
    position: relative;
    z-index: 51;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }

  /* Desktop animation for center slide menu */
  @media (min-width: 769px) {
    .slide-menu {
      transform: translate(-50%, 0) !important;
      transition: opacity 0.3s ease-in-out !important;
      top: 48px;
    }
  }
</style>