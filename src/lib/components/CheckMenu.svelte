<script>
  let {
    isOpen = false,
    onClose = () => {},
    onCheckSquare = () => {},
    onCheckWord = () => {},
    onCheckPuzzle = () => {},
  } = $props();

  let menuElement = $state(null);

  function handlePuzzleCheckClick() {
    onCheckPuzzle();
    onClose();
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
      onclick={onCheckSquare}
    >
      Square
    </button>

    <button
      class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
      onclick={onCheckWord}
    >
      Word
    </button>

    <button
      class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
      onclick={handlePuzzleCheckClick}
    >
      Puzzle
    </button>
  </div>
{/if}
