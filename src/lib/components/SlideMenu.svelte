<script>
  let { isOpen, onClose } = $props();
  let isMobileDevice = $state(false);

  $effect(() => {
    isMobileDevice = window.matchMedia('(max-width: 768px)').matches;
  });

  // Modify the click handler to prevent event propagation issues
  function handleClickOutside(event) {
    if (!isMobileDevice) {
      const menu = document.querySelector('.slide-menu');
      // Check if click is outside menu but don't check for menu button
      if (isOpen && menu && !menu.contains(event.target)) {
        onClose();
      }
    }
  }

  $effect(() => {
    if (typeof document !== 'undefined') {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
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