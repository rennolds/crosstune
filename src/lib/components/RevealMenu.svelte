<script>
  import ConfirmationDialog from "./ConfirmationDialog.svelte";

  let {
    isOpen = false,
    onClose = () => {},
    onRevealSquare = () => {},
    onRevealWord = () => {},
    onRevealPuzzle = () => {},
  } = $props();

  let showConfirmation = $state(false);
  let menuElement = $state(null);

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

  // Handle click outside to close menu
  function handleClickOutside(event) {
    if (menuElement && !menuElement.contains(event.target)) {
      onClose();
    }
  }

  // Add/remove click outside listener when menu opens/closes
  $effect(() => {
    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  });
</script>

{#if isOpen}
  <div
    bind:this={menuElement}
    class="absolute right-0 mt-2 w-48 bg-white dark:bg-[#202020] rounded-md shadow-lg py-1 z-50"
  >
    <button
      class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
      onclick={onRevealSquare}
    >
      Square
    </button>

    <button
      class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
      onclick={onRevealWord}
    >
      Word
    </button>

    <button
      class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
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
