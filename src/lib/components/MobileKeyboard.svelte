<script>
  let { onKeyPress } = $props();
  let showSymbols = $state(false);

  const letterRow1 = ['Q','W','E','R','T','Y','U','I','O','P'];
  const letterRow2 = ['A','S','D','F','G','H','J','K','L'];
  const letterRow3 = ['Z','X','C','V','B','N','M','.'];  // Added period here

  const symbolRow1 = ['1','2','3','4','5','6','7','8','9','0'];
  const symbolRow2 = ['@','#','$','%','&','*','-','+','='];
  const symbolRow3 = ['.','!','?','/','(',')',';',':'];  // Added period here too
</script>

<div class="virtual-keyboard md:hidden fixed bottom-0 left-0 right-0 bg-gray-100 dark:bg-gray-900 shadow-lg pb-2 dark:text-black">
  <!-- Increased bottom padding -->
  <div class="px-1 pb-2 space-y-2"> <!-- Reduced horizontal padding, increased vertical gap -->
    <!-- Row 1 -->
    <div class="flex gap-1">
      {#each (showSymbols ? symbolRow1 : letterRow1) as key}
        <button
          class="flex-1 h-12 bg-white dark:bg-gray-200 rounded shadow text-base font-semibold flex items-center justify-center hover:bg-gray-200 active:bg-gray-300"
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
          class="flex-1 h-12 bg-white dark:bg-gray-200 rounded shadow text-base font-semibold flex items-center justify-center hover:bg-gray-200 active:bg-gray-300"
          onclick={() => onKeyPress(key)}
        >
          {key}
        </button>
      {/each}
    </div>

    <!-- Row 3 -->
    <div class="flex gap-1">
      <!-- Made toggle and backspace buttons narrower -->
      <button
        class="w-12 h-12 bg-white dark:bg-gray-200 rounded shadow text-xs font-semibold flex items-center justify-center hover:bg-gray-200 active:bg-gray-300"
        onclick={() => showSymbols = !showSymbols}
      >
        {showSymbols ? 'ABC' : '123'}
      </button>

      <!-- Middle keys get more space now -->
      <div class="flex-1 flex gap-1">
        {#each (showSymbols ? symbolRow3 : letterRow3) as key}
          <button
            class="flex-1 h-12 bg-white dark:bg-gray-200 rounded shadow text-base font-semibold flex items-center justify-center hover:bg-gray-200 active:bg-gray-300"
            onclick={() => onKeyPress(key)}
          >
            {key}
          </button>
        {/each}
      </div>

      <button
        class="w-12 h-12 bg-white dark:bg-gray-200 rounded shadow text-xl font-semibold flex items-center justify-center hover:bg-gray-200 active:bg-gray-300"
        onclick={() => onKeyPress('Backspace')}
      >
        ⌫
      </button>
    </div>
  </div>
</div>