<script>
    let { isOpen, onClose, onRevealSquare, onRevealWord, onRevealPuzzle } = $props();
    
    // Handle clicking outside to close the menu
    function handleClickOutside(event) {
      if (isOpen && !event.target.closest('.reveal-menu') && !event.target.closest('.reveal-button')) {
        onClose();
      }
    }
    
    $effect(() => {
      if (typeof document !== 'undefined') {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    });
  </script>
  
  {#if isOpen}
    <div class="reveal-menu absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
      <div class="py-1" role="menu" aria-orientation="vertical">
        <button 
          onclick={onRevealSquare}
          class="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" 
          role="menuitem"
        >
          Reveal Square
        </button>
        <button 
          onclick={onRevealWord}
          class="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" 
          role="menuitem"
        >
          Reveal Word
        </button>
        <div class="border-t border-gray-100"></div>
        <button 
          onclick={onRevealPuzzle}
          class="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 font-medium" 
          role="menuitem"
        >
          Reveal Puzzle
        </button>
      </div>
    </div>
  {/if}