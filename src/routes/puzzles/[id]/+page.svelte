<script>
  import Navbar from "$lib/components/Navbar.svelte";
  import { onMount } from "svelte";

  let GridComponent = null;

  export let data;
  const { id, puzzle, credit_name } = data;

  // Capture reveal functions from the grid to wire into the Navbar's Reveal menu
  let revealFns = {};
  function setRevealFunctions(fns) {
    revealFns = fns || {};
  }

  function handleRevealSquare() {
    if (revealFns.revealSquare) revealFns.revealSquare();
  }
  function handleRevealWord() {
    if (revealFns.revealWord) revealFns.revealWord();
  }
  function handleRevealPuzzle() {
    if (revealFns.revealPuzzle) revealFns.revealPuzzle();
  }

  onMount(async () => {
    const mod = await import("$lib/components/CrosswordGrid1.svelte");
    GridComponent = mod.default;

    // Fire GA event when a custom puzzle page is opened
    if (typeof gtag === "function") {
      gtag("event", "user_puzzle_opened", {
        event_category: "custom",
        event_label: puzzle?.title,
        puzzle_id: id,
        created_by: credit_name,
      });
    }
  });

  // No archive/themed mode; render as standalone custom puzzle
  function navigateToHome() {
    window.location.href = "/";
  }
  function navigateToArchives() {
    window.location.href = "/archives";
  }
  function navigateToThemed() {
    window.location.href = "/themed";
  }
</script>

<Navbar
  onHomeClick={navigateToHome}
  onArchivesClick={navigateToArchives}
  onThemedClick={navigateToThemed}
  hideTimer={false}
  words={puzzle?.words || []}
  onRevealSquare={handleRevealSquare}
  onRevealWord={handleRevealWord}
  onRevealPuzzle={handleRevealPuzzle}
/>

<main
  class="bg-gray-200 dark:bg-[#303030] md:min-h-screen md:lg:mr-35"
>
  <!-- Mobile: fixed wrapper that starts below the navbar (top:48px) and
       ends at the bottom of the viewport, divided into three rows:
       title (auto), play area (1fr), controls reserve. -->
  <div
    class="md:hidden fixed left-0 right-0 grid"
    style="top: 48px; bottom: 0; grid-template-rows: auto 1fr var(--mobile-controls-h, 210px);"
  >
    <!-- Title + credit. Always rendered so the play area has consistent
         breathing room from the navbar. -->
    <div class="px-3 py-2 min-w-0">
      <p class="text-sm leading-tight text-black dark:text-white truncate">
        {#if puzzle?.title}
          <span class="font-bold">{puzzle.title}</span>
        {/if}
        {#if credit_name && credit_name !== 'anon'}
          <span class="text-xs font-normal text-gray-600 dark:text-gray-300">
            {puzzle?.title ? ' · ' : ''}by {credit_name}
          </span>
        {/if}
      </p>
    </div>
    <!-- Grid play area -->
    <div class="min-h-0 overflow-hidden">
      {#if GridComponent}
        <svelte:component
          this={GridComponent}
          {puzzle}
          isArchiveMode={true}
          hideHeader={true}
          onSetRevealFunctions={setRevealFunctions}
        />
      {/if}
    </div>
    <!-- MobileControls overlay reserve (empty; controls render fixed) -->
  </div>

  <!-- Desktop: original flow -->
  <div class="hidden md:block pt-0">
    <div class="w-full md:max-w-3xl mx-auto px-2">
      <h1
        class="text-xl font-bold text-black dark:text-white text-left leading-tight"
      >
        {puzzle?.title}
        {#if credit_name && credit_name !== 'anon'}
          <span class="text-sm font-normal text-gray-600 dark:text-gray-300 ml-1">
            by {credit_name}
          </span>
        {/if}
      </h1>
    </div>
    {#if GridComponent}
      <svelte:component
        this={GridComponent}
        {puzzle}
        isArchiveMode={true}
        hideHeader={true}
        onSetRevealFunctions={setRevealFunctions}
      />
    {/if}
  </div>
</main>
