<script>
    // Handle key presses
    let { onKeyPress } = $props();
  
    // Define keyboard layout
    const keyboardLayout = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
    ];
  </script>
  
  <div class="virtual-keyboard md:hidden fixed bottom-0 left-0 right-0 bg-gray-100 shadow-lg">
    <div class="p-2">
      {#each keyboardLayout as row}
        <div class="flex justify-center gap-1 mb-1">
          {#each row as key}
            <button
              class="w-8 h-10 bg-white rounded shadow flex items-center justify-center text-sm font-semibold hover:bg-gray-200 active:bg-gray-300"
              onclick={() => onKeyPress(key)}
            >
              {key}
            </button>
          {/each}
        </div>
      {/each}
      <div class="flex justify-center gap-2">
        <button
          class="px-4 py-2 bg-white rounded shadow flex items-center justify-center text-sm font-semibold hover:bg-gray-200 active:bg-gray-300"
          onclick={() => onKeyPress('Space')}
        >
          Space
        </button>
        <button
          class="px-4 py-2 bg-white rounded shadow flex items-center justify-center text-sm font-semibold hover:bg-gray-200 active:bg-gray-300"
          onclick={() => onKeyPress('Backspace')}
        >
          ⌫
        </button>
      </div>
    </div>
  </div>