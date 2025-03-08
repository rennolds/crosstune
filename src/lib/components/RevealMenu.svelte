<script>
  import ConfirmationDialog from './ConfirmationDialog.svelte';
  
  let { 
    isOpen = false, 
    onClose = () => {}, 
    onRevealSquare = () => {}, 
    onRevealWord = () => {}, 
    onRevealPuzzle = () => {} 
  } = $props();
  
  let showConfirmation = $state(false);
  
  function handlePuzzleRevealClick() {
    showConfirmation = true;
  }
  
  function handleConfirmReveal() {
    showConfirmation = false;
    onRevealPuzzle();
    onClose();
  }
  
  function handleCancelReveal() {
    showConfirmation = false;
  }
</script>

{#if isOpen}
  <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
    <button 
      class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
      onclick={onRevealSquare}
    >
      Square
    </button>
    
    <button 
      class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
      onclick={onRevealWord}
    >
      Word
    </button>
    
    <button 
      class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
      onclick={handlePuzzleRevealClick}
    >
      Puzzle
    </button>
  </div>
{/if}

<ConfirmationDialog
  isOpen={showConfirmation}
  message="Are you sure you want to reveal the puzzle?"
  confirmText="REVEAL"
  cancelText="NEVER MIND"
  onConfirm={handleConfirmReveal}
  onCancel={handleCancelReveal}
/>