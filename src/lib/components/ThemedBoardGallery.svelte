<script>
  import { getIsDarkMode } from "$lib/stores/theme.svelte.js";

  let { themedCrosswords, onSelectDate } = $props();
  let isDark = $derived(getIsDarkMode());

  // Function to format date in a readable way
  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(`${dateString}T12:00:00-04:00`);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "America/New_York",
    });
  }

  // Convert themed crosswords object to array and sort by date (newest first)
  let sortedPuzzles = $derived(
    Object.entries(themedCrosswords)
      .map(([date, puzzle]) => ({
        date,
        ...puzzle,
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  );
</script>

<div class="themed-gallery">
  <!-- Header -->
  <div class="text-center mb-8">
    <p
      class="text-lg md:text-xl mt-2 max-w-2xl mx-auto"
      style="color: {isDark ? '#d1d5db' : '#6b7280'}"
    >
      Special puzzles released every Sunday
    </p>
  </div>

  <!-- Gallery Grid -->
  <div
    class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto px-0 md:px-4 lg:px-8"
  >
    {#each sortedPuzzles as puzzle}
      <div
        class="puzzle-card bg-white dark:bg-[#303030] rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group border border-gray-200 dark:border-gray-700"
        onclick={() => onSelectDate(puzzle.date)}
      >
        <!-- Thumbnail -->
        <div
          class="relative h-32 md:h-48 bg-gradient-to-br from-purple-400 to-pink-400 overflow-hidden"
        >
          {#if puzzle.thumbnail}
            <img
              src={puzzle.thumbnail}
              alt="{puzzle.title} thumbnail"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onerror={(e) => (e.target.style.display = "none")}
            />
          {:else}
            <!-- Fallback gradient background based on theme -->
            <div
              class="w-full h-full flex items-center justify-center"
              style="background: linear-gradient(135deg, {puzzle.theme ===
              'pink'
                ? '#ec4899'
                : puzzle.theme === 'purple'
                  ? '#8b5cf6'
                  : '#1f2937'}, {puzzle.theme === 'pink'
                ? '#f472b6'
                : puzzle.theme === 'purple'
                  ? '#a78bfa'
                  : '#374151'});"
            >
              <div class="text-white text-center">
                <div class="text-4xl mb-2">🎵</div>
                <div class="text-sm font-medium">{puzzle.title}</div>
              </div>
            </div>
          {/if}

          <!-- Mobile Title Overlay -->
          <div
            class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 md:hidden"
          >
            <h3 class="text-white font-bold text-base leading-tight">
              {puzzle.title}
            </h3>
          </div>
        </div>

        <!-- Mobile Author (below image) -->
        <div class="p-3 md:hidden">
          <p class="text-xs font-medium text-gray-700 dark:text-gray-300">
            by {puzzle.author}
          </p>
        </div>

        <!-- Desktop Content -->
        <div class="p-4 hidden md:block">
          <!-- Title -->
          <div class="mb-2">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">
              {puzzle.title}
            </h3>
          </div>

          <!-- Author -->
          <div class="mb-3">
            <p class="text-xs font-medium text-gray-700 dark:text-gray-300">
              by {puzzle.author}
            </p>
          </div>

          <!-- Grid Size Badge -->
          <div class="flex items-center justify-between">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              style="background-color: {puzzle.theme === 'pink'
                ? '#fce7f3'
                : puzzle.theme === 'purple'
                  ? '#f3e8ff'
                  : '#f3f4f6'}; color: {puzzle.theme === 'pink'
                ? '#be185d'
                : puzzle.theme === 'purple'
                  ? '#7c3aed'
                  : '#374151'};"
            >
              {puzzle.size.width}×{puzzle.size.height}
            </span>

            <!-- Play button -->
            <button
              class="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 hover:opacity-90"
              style="background-color: {puzzle.theme === 'pink'
                ? '#ec4899'
                : puzzle.theme === 'purple'
                  ? '#8b5cf6'
                  : '#1f2937'}; color: white;"
            >
              Play
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-4 w-4 ml-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  d="M10,2c-4.42,0-8,3.58-8,8s3.58,8,8,8s8-3.58,8-8S14.42,2,10,2z M8,12.59V7.41c0-0.39,0.44-0.63,0.77-0.42l4.07,2.59 c0.31,0.2,0.31,0.65,0,0.84l-4.07,2.59C8.44,13.22,8,12.98,8,12.59z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    {/each}
  </div>

  <!-- Empty State -->
  {#if sortedPuzzles.length === 0}
    <div class="text-center py-12">
      <div class="text-6xl mb-4">🎵</div>
      <h3 class="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
        No themed puzzles yet
      </h3>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Check back every Sunday for new themed puzzles!
      </p>
    </div>
  {/if}
</div>

<style>
  .puzzle-card {
    transition: all 0.3s ease;
  }

  .puzzle-card:hover {
    transform: translateY(-4px);
  }

  /* Mobile optimizations */
  @media (max-width: 768px) {
    .themed-gallery {
      padding: 0 1rem;
    }

    .puzzle-card {
      margin-bottom: 1rem;
    }
  }
</style>
