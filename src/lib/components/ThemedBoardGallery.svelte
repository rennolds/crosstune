<script>
  import { getIsDarkMode } from "$lib/stores/theme.svelte.js";
  import { isThemedPuzzleSolved } from "$lib/utils/storage.js";

  let { themedCrosswords, onSelectPuzzle } = $props();
  let isDark = $derived(getIsDarkMode());

  // Store for play counts
  let playCounts = $state({});

  // Store for completion status
  let completionStatus = $state({});

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

  // Function to get fun alternating colors for play count badges
  function getBadgeColor(index) {
    const colors = [
      "#8b5cf6", // Purple
      "#10b981", // Green
      "#f59e0b", // Yellow
      "#3b82f6", // Blue
      "#ec4899", // Pink
    ];
    return colors[index % colors.length];
  }

  // Function to fetch play count for a puzzle
  async function fetchPlayCount(puzzleId) {
    try {
      const response = await fetch(`/api/solve/${puzzleId}`);
      if (response.ok) {
        const data = await response.json();
        return data.solve_count || 0;
      }
    } catch (error) {
      console.error("Error fetching play count:", error);
    }
    return 0;
  }

  // Convert themed crosswords object to array, filter by availability date, and sort by date_available (newest first)
  let sortedPuzzles = $derived(
    Object.entries(themedCrosswords)
      .map(([id, puzzle]) => ({
        id: parseInt(id),
        ...puzzle,
      }))
      .filter((puzzle) => {
        // Only show puzzles that are available (date_available <= today)
        const puzzleDate = new Date(puzzle.date_available + "T12:00:00-04:00"); // EST/EDT timezone
        const today = new Date();
        return puzzleDate <= today;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date_available + "T12:00:00");
        const dateB = new Date(b.date_available + "T12:00:00");
        return dateB - dateA; // Newest first
      })
  );

  // Load play counts and completion status when puzzles change
  $effect(() => {
    if (sortedPuzzles.length > 0) {
      sortedPuzzles.forEach(async (puzzle) => {
        const count = await fetchPlayCount(puzzle.id);
        playCounts[puzzle.id] = count;
        completionStatus[puzzle.id] = isThemedPuzzleSolved(puzzle.id);
      });
    }
  });

  // Refresh completion status periodically to catch updates from the current session
  $effect(() => {
    const interval = setInterval(() => {
      if (sortedPuzzles.length > 0) {
        sortedPuzzles.forEach((puzzle) => {
          const isCompleted = isThemedPuzzleSolved(puzzle.id);
          if (completionStatus[puzzle.id] !== isCompleted) {
            completionStatus[puzzle.id] = isCompleted;
          }
        });
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  });
</script>

<div class="themed-gallery">
  <!-- Header -->
  <div class="text-center mb-8">
    <p
      class="text-lg md:text-xl mt-2 max-w-2xl mx-auto"
      style="color: {isDark ? '#d1d5db' : '#6b7280'}"
    >
      themed puzzles. new every sunday.
    </p>
  </div>

  <!-- Gallery Grid -->
  <div
    class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto px-0 md:px-4 lg:px-8"
  >
    {#each sortedPuzzles as puzzle, index}
      <div
        class="puzzle-card bg-white dark:bg-[#303030] rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group border-2"
        class:border-green-500={completionStatus[puzzle.id]}
        class:border-gray-200={!completionStatus[puzzle.id] && !isDark}
        class:dark:border-gray-700={!completionStatus[puzzle.id] && isDark}
        onclick={() => {
          // --- GA Event ---
          if (typeof gtag === "function") {
            gtag("event", "themed_game_clicked", {
              event_category: "themed",
              event_label: puzzle.id,
              puzzle_title: puzzle.title,
              puzzle_author: puzzle.author,
            });
          }
          // --- End GA Event ---
          onSelectPuzzle(puzzle.id);
        }}
      >
        <!-- Thumbnail -->
        <div
          class="relative h-32 md:h-48 bg-gradient-to-br from-purple-400 to-pink-400 overflow-hidden"
        >
          <!-- Mobile Views Count (top left) -->
          <div class="absolute top-2 left-2 z-10 md:hidden">
            <div class="flex items-center bg-black/60 rounded px-2 py-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-3 w-3 mr-1 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fill-rule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clip-rule="evenodd"
                />
              </svg>
              <span class="text-xs font-medium text-white">
                {playCounts[puzzle.id] ?? "..."}
              </span>
            </div>
          </div>

          <!-- Completion indicator -->
          {#if completionStatus[puzzle.id]}
            <div class="absolute top-2 right-2 z-10">
              <div class="bg-green-500 rounded-full p-1 shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
            </div>
          {/if}
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

          <!-- Play Count Badge -->
          <div class="flex items-center">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
              style="background-color: {getBadgeColor(index)};"
            >
              plays: {playCounts[puzzle.id] ?? "..."}
            </span>
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
