<script>
  import Navbar from "$lib/components/Navbar.svelte";

  export let data;
  const puzzles = data?.puzzles || [];

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
  <div class="mx-auto px-4 py-6 w-full max-w-3xl">
    <h1 class="text-2xl font-bold mb-4 text-black dark:text-white">
      User Puzzles
    </h1>

    {#if puzzles.length === 0}
      <div class="text-gray-600 dark:text-gray-300">No custom puzzles yet.</div>
    {:else}
      <ul
        class="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-[#202020] rounded"
      >
        {#each puzzles as p}
          <li class="p-4 flex items-center justify-between">
            <div>
              <div class="font-semibold text-black dark:text-white">
                {p.title || "Untitled puzzle"}
              </div>
              <div class="text-sm text-gray-500">{p.id}</div>
            </div>
            <a
              class="text-blue-600 dark:text-blue-400 font-medium hover:underline"
              href={`/puzzles/${p.id}`}
            >
              Open →
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</main>
