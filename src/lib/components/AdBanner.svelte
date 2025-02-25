<script>
    // Only show on mobile devices
    let isMobileDevice = $state(false);
  
    $effect(() => {
      if (typeof window !== 'undefined') {
        isMobileDevice = window.matchMedia('(max-width: 768px)').matches;
        
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        const handler = (e) => {
          isMobileDevice = e.matches;
        };
        
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
      }
    });
</script>
  
{#if isMobileDevice}
    <div class="h-[50px] w-full bg-gray-200 fixed top-0 left-0 right-0 z-[100] flex items-center justify-center">
        <span class="text-gray-500"><p>Ad Space (320x50)</p></span>
    </div>
{/if}

<style>
/* Adjust global padding to account for the ad banner on mobile */
:global(body) {
    @media (max-width: 768px) {
    padding-top: 50px !important;
    }
}
</style>