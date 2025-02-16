<script>
    let { onPlay } = $props();
    let isMobileDevice = $state(false);

    $effect(() => {
        isMobileDevice = window.matchMedia('(max-width: 768px)').matches;
    });
</script>

<div class="fixed inset-0 bg-white flex flex-col items-center px-4">
    <div class="pt-12 md:pt-0 md:flex-1 flex flex-col items-center md:justify-center gap-4">
        <!-- Placeholder logo -->
        <div class="w-48 h-48 bg-black/10 rounded-xl flex items-center justify-center text-black text-xl">
        LOGO
        </div>
        
        <!-- Tagline -->
        <h2 class="text-black text-xl text-center font-light">
        A music crossword!
        </h2>
        
        <!-- Play Button -->
        <button 
        onclick={onPlay}
        class="mt-8 px-12 py-3 bg-black text-white rounded-full text-xl font-bold hover:bg-gray-900 transition-colors"
        >
        PLAY
        </button>
    </div>

    <!-- Spacer for mobile -->
    <div class="flex-1 md:hidden"></div>

    <!-- Other Games Section -->
    <div class="w-full max-w-sm mb-12">
        <h3 class="text-black text-center mb-4 text-lg">
        Play our other games!
        </h3>
        
        <div class="flex flex-col gap-3">
        <a 
            href="https://spotle.io"
            target="_blank"
            rel="noopener noreferrer"
            class="w-full py-3 bg-black/10 text-black rounded-lg hover:bg-black/20 transition-colors text-center"
        >
            SPOTLE
        </a>
        
        <a 
            href="https://harmonies.io"
            target="_blank"
            rel="noopener noreferrer"
            class="w-full py-3 bg-black/10 text-black rounded-lg hover:bg-black/20 transition-colors text-center"
        >
            HARMONIES
        </a>
        </div>
    </div>
</div>
  
<style>
    :global(body) {
        @media (max-width: 768px) {
        overflow: hidden;
        }
    }
</style>