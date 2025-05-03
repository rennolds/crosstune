<script>
  // Props combined from MobileClue and MobileKeyboard
  let { clue, onPlay, isPlaying, playingClue, onStopAudio, words, onKeyPress } =
    $props();

  // Imports combined and de-duplicated
  import { isWidgetReady } from "$lib/stores/game.svelte.js";
  import { getIsDarkMode } from "$lib/stores/theme.svelte.js";

  // --- State from MobileClue ---
  let isCurrentClueActive = $derived(
    isPlaying &&
      playingClue &&
      clue &&
      playingClue.startX === clue.startX &&
      playingClue.startY === clue.startY &&
      playingClue.direction === clue.direction
  );
  let currentWidgetReady = $state(false);
  let fontSize = $state("text-lg");
  let lineHeight = $state("leading-normal");

  // --- State from MobileKeyboard ---
  let showSymbols = $state(false);
  let isDark = $derived(getIsDarkMode());

  // --- Keyboard Layouts ---
  const letterRow1 = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"];
  const letterRow2 = ["A", "S", "D", "F", "G", "H", "J", "K", "L"];
  const letterRow3 = ["Z", "X", "C", "V", "B", "N", "M"];
  const symbolRow1 = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
  const symbolRow2 = ["@", "#", "$", "%", "&", "*", "-", "+", "="];
  const symbolRow3 = [".", "!", "?", "/", "(", ")", ";", ":"];

  // --- Effects from MobileClue ---
  $effect(() => {
    if (clue && clue.textClue) {
      const len = clue.textClue.length;
      if (len > 70) {
        fontSize = "text-xs";
        lineHeight = "leading-none";
      } else if (len > 55) {
        fontSize = "text-sm";
        lineHeight = "leading-none";
      } else if (len > 40) {
        fontSize = "text-base";
        lineHeight = "leading-tight";
      } else if (len > 30) {
        fontSize = "text-lg";
        lineHeight = "leading-snug";
      } else {
        fontSize = "text-xl";
        lineHeight = "leading-normal";
      }
    } else {
      fontSize = "text-lg";
      lineHeight = "leading-normal";
    }
  });

  $effect(() => {
    if (!clue) {
      currentWidgetReady = false;
      return;
    }
    const widgetId = `${clue.startX}:${clue.startY}:${clue.direction}`;
    currentWidgetReady = isWidgetReady(widgetId);
    const checkInterval = setInterval(() => {
      const isReady = isWidgetReady(widgetId);
      if (isReady) {
        currentWidgetReady = true;
        clearInterval(checkInterval);
      }
    }, 200);
    return () => clearInterval(checkInterval);
  });

  // --- Functions from MobileClue ---
  function findAdjacentClue(currentClue, direction) {
    if (!currentClue) return null;
    const sortedWords = [...words].sort((a, b) =>
      a.startY === b.startY ? a.startX - b.startX : a.startY - b.startY
    );
    const currentIndex = sortedWords.findIndex(
      (w) =>
        w.startX === currentClue.startX &&
        w.startY === currentClue.startY &&
        w.direction === currentClue.direction
    );
    if (direction === "next") {
      return sortedWords[(currentIndex + 1) % sortedWords.length];
    } else {
      return sortedWords[
        (currentIndex - 1 + sortedWords.length) % sortedWords.length
      ];
    }
  }

  function handleNavigation(direction) {
    if (isPlaying) {
      onStopAudio();
    }
    const nextClue = findAdjacentClue(clue, direction);
    if (nextClue) {
      const event = new CustomEvent("navigationrequest", {
        detail: {
          startX: nextClue.startX,
          startY: nextClue.startY,
          direction: nextClue.direction,
        },
      });
      document.dispatchEvent(event);
    }
  }

  // --- Responsive Sizing State ---
  let windowWidth = $state(
    typeof window !== "undefined" ? window.innerWidth : 0
  );

  $effect(() => {
    if (typeof window !== "undefined") {
      const updateWidth = () => (windowWidth = window.innerWidth);
      window.addEventListener("resize", updateWidth);
      updateWidth(); // Initial check
      return () => window.removeEventListener("resize", updateWidth);
    }
  });

  let clueHeightClass = $derived(
    windowWidth < 375
      ? "h-8"
      : windowWidth < 389
        ? "h-10"
        : windowWidth < 414
          ? "h-13"
          : "h-14"
  );
  let keyHeightClass = $derived(
    windowWidth < 375
      ? "h-7"
      : windowWidth < 389
        ? "h-9"
        : windowWidth < 414
          ? "h-12"
          : "h-14"
  );
</script>

<!-- Combined container, fixed to bottom -->
<div class="md:hidden fixed bottom-0 left-0 right-0 z-30 flex flex-col">
  <!-- Clue Section (modified from MobileClue.svelte) -->
  {#if clue}
    <div
      class="w-full bg-white shadow-sm dark:text-black {clueHeightClass} mb-1"
      style="order: 1;"
    >
      <div
        class="flex items-center justify-between h-full px-2"
        style="background-color: {clue.color};"
      >
        <!-- Left Section - Clue Text -->
        <div class="flex items-center flex-grow min-w-0">
          <div
            class="flex items-center gap-2 flex-grow min-w-0 overflow-hidden pl-2 pr-2"
          >
            <span
              class="{fontSize} {lineHeight} transition-all duration-200 block"
              >{clue.textClue}</span
            >
          </div>
        </div>
        <!-- Right Section - Navigation and Play Buttons -->
        <div class="flex items-center flex-shrink-0">
          <button
            class="p-1 flex-shrink-0"
            onclick={() => handleNavigation("prev")}
            aria-label="Previous clue"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-9 w-9"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M20.24 7.24V16.76L13.41 12L20.24 7.24Z" /><rect
                x="12"
                y="7.24"
                width="2"
                height="9.52"
              />
            </svg>
          </button>
          <button
            onclick={() => onPlay(clue)}
            class="w-[70px] h-[30px] rounded-md text-lg font-medium flex-shrink-0 flex items-center justify-center"
            disabled={!currentWidgetReady && !isCurrentClueActive}
          >
            <span class="flex items-center justify-center h-full">
              {#if isCurrentClueActive}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  enable-background="new 0 0 20 20"
                  height="48px"
                  viewBox="0 0 20 20"
                  width="48px"
                  fill="black"
                >
                  <g><rect fill="none" height="20" width="20" /></g>
                  <g>
                    <path
                      d="M10,2c-4.42,0-8,3.58-8,8s3.58,8,8,8s8-3.58,8-8S14.42,2,10,2z M8.25,13L8.25,13c-0.41,0-0.75-0.34-0.75-0.75v-4.5 C7.5,7.34,7.84,7,8.25,7h0C8.66,7,9,7.34,9,7.75v4.5C9,12.66,8.66,13,8.25,13z M11.75,13L11.75,13C11.34,13,11,12.66,11,12.25v-4.5 C11,7.34,11.34,7,11.75,7h0c0.41,0,0.75,0.34,0.75,0.75v4.5C12.5,12.66,12.16,13,11.75,13z"
                    />
                  </g>
                </svg>
              {:else if !currentWidgetReady}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="animate-spin inline-block"
                >
                  <circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
                  <path
                    d="M12 2C6.47715 2 2 6.47715 2 12C2 12.6343 2.06115 13.2554 2.17856 13.8577"
                  />
                </svg>
              {:else}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  enable-background="new 0 0 20 20"
                  height="48px"
                  viewBox="0 0 20 20"
                  width="48px"
                  fill="black"
                >
                  <g><rect fill="none" height="20" width="20" /></g>
                  <g>
                    <path
                      d="M10,2c-4.42,0-8,3.58-8,8s3.58,8,8,8s8-3.58,8-8S14.42,2,10,2z M8,12.59V7.41c0-0.39,0.44-0.63,0.77-0.42l4.07,2.59 c0.31,0.2,0.31,0.65,0,0.84l-4.07,2.59C8.44,13.22,8,12.98,8,12.59z"
                    />
                  </g>
                </svg>
              {/if}
            </span>
          </button>
          <button
            class="p-1 flex-shrink-0"
            onclick={() => handleNavigation("next")}
            aria-label="Next clue"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-9 w-9"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M3.76 7.24V16.76L10.59 12L3.76 7.24Z" /><rect
                x="10"
                y="7.24"
                width="2"
                height="9.52"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Keyboard Section (modified from MobileKeyboard.svelte) -->
  <div
    class="virtual-keyboard w-full pb-1"
    class:bg-[#F3F4F6]={!isDark}
    class:bg-[#202020]={isDark}
    style="order: 2;"
  >
    <div class="px-1 pb-1 space-y-1">
      <!-- Row 1 -->
      <div class="flex gap-0.5">
        {#each showSymbols ? symbolRow1 : letterRow1 as key}
          <button
            class="flex-1 rounded shadow text-base font-semibold flex items-center justify-center {keyHeightClass}"
            class:bg-white={!isDark}
            class:bg-gray-700={isDark}
            class:text-black={!isDark}
            class:text-white={isDark}
            class:hover:bg-gray-200={!isDark}
            class:hover:bg-gray-600={isDark}
            class:active:bg-gray-300={!isDark}
            class:active:bg-gray-500={isDark}
            onclick={() => onKeyPress(key)}>{key}</button
          >
        {/each}
      </div>
      <!-- Row 2 -->
      <div class="flex gap-0.5">
        {#each showSymbols ? symbolRow2 : letterRow2 as key}
          <button
            class="flex-1 rounded shadow text-base font-semibold flex items-center justify-center {keyHeightClass}"
            class:bg-white={!isDark}
            class:bg-gray-700={isDark}
            class:text-black={!isDark}
            class:text-white={isDark}
            class:hover:bg-gray-200={!isDark}
            class:hover:bg-gray-600={isDark}
            class:active:bg-gray-300={!isDark}
            class:active:bg-gray-500={isDark}
            onclick={() => onKeyPress(key)}>{key}</button
          >
        {/each}
      </div>
      <!-- Row 3 -->
      <div class="flex gap-0.5">
        <button
          class="w-12 rounded shadow text-xs font-semibold flex items-center justify-center {keyHeightClass}"
          class:bg-white={!isDark}
          class:bg-gray-700={isDark}
          class:text-black={!isDark}
          class:text-white={isDark}
          class:hover:bg-gray-200={!isDark}
          class:hover:bg-gray-600={isDark}
          class:active:bg-gray-300={!isDark}
          class:active:bg-gray-500={isDark}
          onclick={() => (showSymbols = !showSymbols)}
          >{showSymbols ? "ABC" : "123"}</button
        >
        <div class="flex-1 flex gap-0.5">
          {#each showSymbols ? symbolRow3 : letterRow3 as key}
            <button
              class="flex-1 rounded shadow text-base font-semibold flex items-center justify-center {keyHeightClass}"
              class:bg-white={!isDark}
              class:bg-gray-700={isDark}
              class:text-black={!isDark}
              class:text-white={isDark}
              class:hover:bg-gray-200={!isDark}
              class:hover:bg-gray-600={isDark}
              class:active:bg-gray-300={!isDark}
              class:active:bg-gray-500={isDark}
              onclick={() => onKeyPress(key)}>{key}</button
            >
          {/each}
        </div>
        <button
          class="w-12 rounded shadow text-xl font-semibold flex items-center justify-center {keyHeightClass}"
          class:bg-white={!isDark}
          class:bg-gray-700={isDark}
          class:text-black={!isDark}
          class:text-white={isDark}
          class:hover:bg-gray-200={!isDark}
          class:hover:bg-gray-600={isDark}
          class:active:bg-gray-300={!isDark}
          class:active:bg-gray-500={isDark}
          onclick={() => onKeyPress("Backspace")}>⌫</button
        >
      </div>
    </div>
  </div>
</div>

<style>
  /* Optional: Add any specific styles for MobileControls if needed */
</style>
