<script>
  import { getIsDarkMode } from "$lib/stores/theme.svelte.js";

  let { onKeyPress } = $props();
  let showSymbols = $state(false);

  let isDark = $derived(getIsDarkMode());

  const letterRow1 = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"];
  const letterRow2 = ["A", "S", "D", "F", "G", "H", "J", "K", "L"];
  const letterRow3 = ["Z", "X", "C", "V", "B", "N", "M"];

  const symbolRow1 = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
  const symbolRow2 = ["@", "#", "$", "%", "&", "*", "-", "+", "="];
  const symbolRow3 = [".", "!", "?", "/", "(", ")", ";", ":"];
</script>

<div
  class="virtual-keyboard md:hidden fixed bottom-0 left-0 right-0 pb-1 z-20"
  class:bg-[#F3F4F6]={!isDark}
  class:bg-[#202020]={isDark}
>
  <div class="px-1 pb-1 space-y-2">
    <!-- Row 1 -->
    <div class="flex gap-1">
      {#each showSymbols ? symbolRow1 : letterRow1 as key}
        <button
          class="flex-1 h-12 rounded shadow text-base font-semibold flex items-center justify-center"
          class:bg-white={!isDark}
          class:bg-gray-700={isDark}
          class:text-black={!isDark}
          class:text-white={isDark}
          class:hover:bg-gray-200={!isDark}
          class:hover:bg-gray-600={isDark}
          class:active:bg-gray-300={!isDark}
          class:active:bg-gray-500={isDark}
          onclick={() => onKeyPress(key)}
        >
          {key}
        </button>
      {/each}
    </div>

    <!-- Row 2 -->
    <div class="flex gap-1">
      {#each showSymbols ? symbolRow2 : letterRow2 as key}
        <button
          class="flex-1 h-12 rounded shadow text-base font-semibold flex items-center justify-center"
          class:bg-white={!isDark}
          class:bg-gray-700={isDark}
          class:text-black={!isDark}
          class:text-white={isDark}
          class:hover:bg-gray-200={!isDark}
          class:hover:bg-gray-600={isDark}
          class:active:bg-gray-300={!isDark}
          class:active:bg-gray-500={isDark}
          onclick={() => onKeyPress(key)}
        >
          {key}
        </button>
      {/each}
    </div>

    <!-- Row 3 -->
    <div class="flex gap-1">
      <button
        class="w-12 h-12 rounded shadow text-xs font-semibold flex items-center justify-center"
        class:bg-white={!isDark}
        class:bg-gray-700={isDark}
        class:text-black={!isDark}
        class:text-white={isDark}
        class:hover:bg-gray-200={!isDark}
        class:hover:bg-gray-600={isDark}
        class:active:bg-gray-300={!isDark}
        class:active:bg-gray-500={isDark}
        onclick={() => (showSymbols = !showSymbols)}
      >
        {showSymbols ? "ABC" : "123"}
      </button>

      <div class="flex-1 flex gap-1">
        {#each showSymbols ? symbolRow3 : letterRow3 as key}
          <button
            class="flex-1 h-12 rounded shadow text-base font-semibold flex items-center justify-center"
            class:bg-white={!isDark}
            class:bg-gray-700={isDark}
            class:text-black={!isDark}
            class:text-white={isDark}
            class:hover:bg-gray-200={!isDark}
            class:hover:bg-gray-600={isDark}
            class:active:bg-gray-300={!isDark}
            class:active:bg-gray-500={isDark}
            onclick={() => onKeyPress(key)}
          >
            {key}
          </button>
        {/each}
      </div>

      <button
        class="w-12 h-12 rounded shadow text-xl font-semibold flex items-center justify-center"
        class:bg-white={!isDark}
        class:bg-gray-700={isDark}
        class:text-black={!isDark}
        class:text-white={isDark}
        class:hover:bg-gray-200={!isDark}
        class:hover:bg-gray-600={isDark}
        class:active:bg-gray-300={!isDark}
        class:active:bg-gray-500={isDark}
        onclick={() => onKeyPress("Backspace")}
      >
        ⌫
      </button>
    </div>
  </div>
</div>
