<script>
    // Handle key presses
    let { onKeyPress } = $props();
    let showSymbols = $state(false);

    // Letter mode rows
    const letterRow1 = ['Q','W','E','R','T','Y','U','I','O','P'];
    const letterRow2 = ['A','S','D','F','G','H','J','K','L'];
    const letterRow3 = ['Z','X','C','V','B','N','M'];

    // Symbol mode rows (customize these as desired)
    const symbolRow1 = ['1','2','3','4','5','6','7','8','9','0'];
    const symbolRow2 = ['@','#','$','%','&','*','-','+','='];
    const symbolRow3 = ['!','?','/','(',')',';',':'];
</script>

<div class="virtual-keyboard md:hidden fixed bottom-0 left-0 right-0 bg-gray-100 shadow-lg">
  <!-- Outer container with horizontal padding -->
  <div class="px-2 pb-2 space-y-1">
    <!-- Row 1 -->
    <div class="flex gap-1">
      {#each (showSymbols ? symbolRow1 : letterRow1) as key}
        <button
          class="flex-1 h-10 bg-white rounded shadow text-sm font-semibold flex items-center justify-center hover:bg-gray-200 active:bg-gray-300"
          onclick={() => onKeyPress(key)}
        >
          {key}
        </button>
      {/each}
    </div>

    <!-- Row 2 -->
    <div class="flex gap-1">
      {#each (showSymbols ? symbolRow2 : letterRow2) as key}
        <button
          class="flex-1 h-10 bg-white rounded shadow text-sm font-semibold flex items-center justify-center hover:bg-gray-200 active:bg-gray-300"
          onclick={() => onKeyPress(key)}
        >
          {key}
        </button>
      {/each}
    </div>

    <!-- Row 3: Toggle, keys, Backspace -->
    <div class="flex gap-1">
      <!-- Toggle button on the left -->
      <button
        class="w-16 h-10 bg-white rounded shadow text-sm font-semibold flex items-center justify-center hover:bg-gray-200 active:bg-gray-300"
        onclick={() => showSymbols = !showSymbols}
      >
        {showSymbols ? 'ABC' : '123'}
      </button>

      <!-- Middle keys -->
      {#each (showSymbols ? symbolRow3 : letterRow3) as key}
        <button
          class="flex-1 h-10 bg-white rounded shadow text-sm font-semibold flex items-center justify-center hover:bg-gray-200 active:bg-gray-300"
          onclick={() => onKeyPress(key)}
        >
          {key}
        </button>
      {/each}

      <!-- Backspace button on the right -->
      <button
        class="w-16 h-10 bg-white rounded shadow text-sm font-semibold flex items-center justify-center hover:bg-gray-200 active:bg-gray-300"
        onclick={() => onKeyPress('Backspace')}
      >
        ⌫
      </button>
    </div>

    <!-- Row 4: Space button
    <div class="flex gap-1">
      <button
        class="flex-1 h-10 bg-white rounded shadow text-sm font-semibold flex items-center justify-center hover:bg-gray-200 active:bg-gray-300"
        onclick={() => onKeyPress('Space')}
      >
        Space
      </button>
    </div> -->
  </div>
</div>