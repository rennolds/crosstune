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
</script>
  
<div 
  class="fixed inset-0 transition-all z-40 pointer-events-none"
  class:md:pointer-events-auto={isOpen}
  >
  <!-- Overlay for mobile only -->
  <div 
    class="absolute inset-0 bg-black bg-opacity-50 transition-opacity md:hidden"
    class:opacity-0={!isOpen}
    class:invisible={!isOpen}
    onclick={onClose}
  ></div>

  <div 
    class="slide-menu fixed top-0 left-0 h-full bg-white transition-transform duration-300 ease-in-out transform overflow-auto
            md:w-80 w-full md:shadow-lg
            md:top-[48px] md:h-[calc(100vh-48px)]
            md:pt-0 pt-[calc(48px+50px)]"
    class:translate-x-0={isOpen}
    class:-translate-x-full={!isOpen}
    style="z-index: 50;"
    >
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-6">Menu</h2>
      
      <!-- Menu Items -->
      <nav class="space-y-4">
        {#each [
          { href: '/', text: 'Today\'s Puzzle' },
          { href: '/archives', text: 'Archives', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' },
          { href: '/privacy', text: 'Privacy' },
        ] as item}
          <a 
            href={item.href} 
            class="flex items-center py-2 hover:bg-gray-100 rounded px-3 transition-colors"
            onclick={(e) => {
              if (isMobileDevice) {
                onClose();
              }
            }}
          >
            {#if item.icon}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
              </svg>
            {/if}
            {item.text}
          </a>
        {/each}
      </nav>
      
      <!-- Our Games Section -->
      <div class="mt-8">
        <h2 class="text-2xl font-bold mb-4">Our games</h2>
        
        <div class="space-y-3">
          <!-- Spotle Card -->
          <a href="/spotle" class="block bg-gray-50 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow max-w-[90%]">
            <div class="aspect-video bg-gray-200 w-full" style="max-height: 120px;">
              <img src="/api/placeholder/240/120" alt="Spotle" class="w-full h-full object-cover" />
            </div>
            <div class="p-2">
              <h3 class="font-semibold text-sm">Spotle: Guess the Artist</h3>
            </div>
          </a>
          
          <!-- Harmonies Card -->
          <a href="/harmonies" class="block bg-gray-50 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow max-w-[90%]">
            <div class="aspect-video bg-gray-200 w-full" style="max-height: 120px;">
              <img src="/api/placeholder/240/120" alt="Harmonies" class="w-full h-full object-cover" />
            </div>
            <div class="p-2">
              <h3 class="font-semibold text-sm">Harmonies: Music Connections</h3>
            </div>
          </a>
        </div>
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
</style>