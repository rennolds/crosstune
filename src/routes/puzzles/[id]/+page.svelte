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

<main class="h-[100dvh] overflow-hidden flex flex-col md:min-h-screen md:h-auto md:overflow-visible bg-gray-200 dark:bg-[#303030]">
  <div class="flex-1 min-h-0 flex flex-col pt-12 md:pt-0 lg:mr-35">
    <div class="w-full md:max-w-3xl mx-auto px-2 flex-shrink-0">
      <h1
        class="text-sm md:text-xl font-bold text-black dark:text-white text-left ml-2 md:ml-0 leading-tight"
      >
        {puzzle?.title}
        {#if credit_name && credit_name !== 'anon'}
          <span class="text-[10px] md:text-sm font-normal text-gray-600 dark:text-gray-300 ml-1">
            by {credit_name}
          </span>
        {/if}
      </h1>
    </div>
    <div class="flex-1 min-h-0">
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
  </div>
</main>
