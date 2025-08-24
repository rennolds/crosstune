<script>
  export const ssr = false;
  import Navbar from "$lib/components/Navbar.svelte";
  import { onMount } from "svelte";

  let GridComponent = null;

  export let data;
  const { id, puzzle, created_by } = data;

  onMount(async () => {
    const mod = await import("$lib/components/CrosswordGrid1.svelte");
    GridComponent = mod.default;
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
  hideTimer={true}
/>

<main class="min-h-screen flex flex-col bg-gray-200 dark:bg-[#303030]">
  <div class="flex-1 pt-12.5 md:pt-0 lg:mr-35">
    <div class="w-full md:max-w-3xl mx-auto mt-2 px-2">
      <h1 class="text-xl font-bold text-black dark:text-white mb-1">
        {puzzle?.title || "Untitled puzzle"}
      </h1>
      {#if created_by}
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">
          by {created_by}
        </p>
      {/if}
    </div>
    {#if GridComponent}
      <svelte:component
        this={GridComponent}
        {puzzle}
        isArchiveMode={true}
        hideHeader={true}
      />
    {/if}
  </div>
</main>
