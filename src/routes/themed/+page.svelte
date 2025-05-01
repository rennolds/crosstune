<script>
  import Navbar from "$lib/components/Navbar.svelte";
  import CrosswordGrid1 from "$lib/components/CrosswordGrid1.svelte";
  import themedCrosswords from "$lib/data/themed_crosswords.json";
  import { getIsDarkMode } from "$lib/stores/theme.svelte.js";

  let selectedThemeTitle = $state(null);
  let selectedPuzzle = $state(null);
  let revealFunctions = $state({});
  let isDark = $derived(getIsDarkMode());
  let completedThemeTitles = $state(new Set());

  // Load completed themes from localStorage
  $effect(() => {
    if (typeof localStorage !== "undefined") {
      const completedStr = localStorage.getItem("crosstune_themed_completed");
      if (completedStr) {
        try {
          completedThemeTitles = new Set(JSON.parse(completedStr));
        } catch (e) {
          console.error("Error parsing completed themed puzzles:", e);
          completedThemeTitles = new Set(); // Reset on error
        }
      } else {
        completedThemeTitles = new Set();
      }
    }
  });

  const themes = $derived(
    Object.entries(themedCrosswords).map(([title, data]) => ({
      title,
      thumbnail:
        data.thumbnail || data.backgroundImage || "/placeholder_thumbnail.png",
      puzzleData: data,
      completed: completedThemeTitles.has(title), // Check if this theme is completed
    }))
  );

  $effect(() => {
    if (typeof document !== "undefined") {
      document.title = selectedThemeTitle
        ? `Themed: ${selectedThemeTitle} - Crosstune`
        : "Themed Puzzles - Crosstune";

      let metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (!metaThemeColor) {
        metaThemeColor = document.createElement("meta");
        metaThemeColor.name = "theme-color";
        document.head.appendChild(metaThemeColor);
      }

      // Use the derived isDark state
      metaThemeColor.content = isDark ? "#202020" : "#ffffff";
    }
  });

  // Update theme color when dark mode changes
  $effect(() => {
    if (typeof document !== "undefined") {
      let metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.content = isDark ? "#202020" : "#ffffff";
      }
    }
  });

  function selectTheme(theme) {
    selectedThemeTitle = theme.title;
  }

  function playSelectedTheme() {
    if (selectedThemeTitle) {
      selectedPuzzle = themedCrosswords[selectedThemeTitle];
      // Optionally, update URL here if needed, similar to archives
      // updateUrlWithTheme(selectedThemeTitle);
    }
  }

  function handleRevealFunctions(functions) {
    revealFunctions = functions;
  }

  // Navigation functions (similar to archives)
  function navigateToThemesList() {
    selectedThemeTitle = null;
    selectedPuzzle = null;
    // Optionally, update URL here to remove theme parameter
    // removeThemeFromUrl();
  }

  function navigateToToday() {
    window.location.href = "/";
  }
  function navigateToHome() {
    window.location.href = "/";
  }
  function navigateToArchives() {
    window.location.href = "/archives";
  }
</script>

<Navbar
  themeTitle={selectedThemeTitle}
  isThemedMode={!!selectedPuzzle}
  onRevealSquare={revealFunctions.revealSquare}
  onRevealWord={revealFunctions.revealWord}
  onRevealPuzzle={revealFunctions.revealPuzzle}
  onNavigateToThemesList={navigateToThemesList}
  onNavigateToToday={navigateToToday}
  onNavigateToHome={navigateToHome}
  onNavigateToArchives={navigateToArchives}
  hideTimer={!selectedPuzzle}
/>

<main class="dark min-h-screen flex flex-col">
  {#if selectedPuzzle}
    <!-- Themed puzzle view -->
    <div class="flex-1 pt-12.5 md:pt-0 lg:mr-35">
      <CrosswordGrid1
        puzzle={selectedPuzzle}
        isThemedMode={true}
        isArchiveMode={false}
        selectedDate={null}
        onSetRevealFunctions={handleRevealFunctions}
      />
    </div>
  {:else}
    <!-- Themed puzzles list/gallery view -->
    <div class="themes-container mx-auto px-4 py-4 w-full max-w-5xl">
      <h2
        class="text-2xl font-bold mb-6 text-center"
        class:text-white={isDark}
        class:text-black={!isDark}
      >
        Themed Puzzles
      </h2>
      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        {#each themes as theme}
          <button
            class="theme-card border rounded-lg overflow-hidden text-left transition-all duration-200 relative"
            class:border-yellow-400={selectedThemeTitle === theme.title}
            class:scale-105={selectedThemeTitle === theme.title}
            class:shadow-lg={selectedThemeTitle === theme.title}
            class:border-gray-700={selectedThemeTitle !== theme.title && isDark}
            class:hover:border-gray-500={selectedThemeTitle !== theme.title &&
              isDark}
            class:border-gray-300={selectedThemeTitle !== theme.title &&
              !isDark}
            class:hover:border-gray-400={selectedThemeTitle !== theme.title &&
              !isDark}
            style="background-color: {isDark ? '#2a2a2a' : '#f9f9f9'};"
            onclick={() => selectTheme(theme)}
          >
            <img
              src={theme.thumbnail}
              alt="{theme.title} thumbnail"
              class="w-full h-32 object-cover"
            />
            <div class="p-4 flex items-center justify-between">
              <h3
                class="font-semibold"
                class:text-white={isDark}
                class:text-black={!isDark}
              >
                {theme.title}
              </h3>
              {#if theme.completed}
                <!-- Completed Checkmark Icon -->
                <svg
                  class="w-5 h-5 text-green-500 flex-shrink-0 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              {/if}
              <!-- Add more details here if needed -->
            </div>
          </button>
        {/each}
      </div>

      <div class="text-center mt-8">
        <button
          class="px-8 py-3 rounded font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          class:bg-yellow-500={selectedThemeTitle}
          class:hover:bg-yellow-600={selectedThemeTitle}
          class:text-black={selectedThemeTitle}
          class:bg-gray-600={!selectedThemeTitle && isDark}
          class:text-gray-400={!selectedThemeTitle && isDark}
          class:bg-gray-300={!selectedThemeTitle && !isDark}
          class:text-gray-500={!selectedThemeTitle && !isDark}
          disabled={!selectedThemeTitle}
          onclick={playSelectedTheme}
        >
          PLAY
        </button>
      </div>
    </div>
  {/if}
</main>

<style>
  .themes-container {
    padding-top: 3.5rem; /* Adjust based on Navbar height */
    margin-top: 0;
  }
  .theme-card:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.5); /* Yellow focus ring */
  }
  /* Add styles for the grayscale filter */
  .filter.grayscale {
    filter: grayscale(100%);
  }
  /* Mobile-specific styles if needed */
  @media (max-width: 768px) {
    .themes-container {
      padding-top: 3.5rem; /* Ensure spacing below mobile navbar */
    }
    .grid {
      grid-template-columns: repeat(
        auto-fit,
        minmax(150px, 1fr)
      ); /* Responsive grid for mobile */
      gap: 1rem; /* Smaller gap on mobile */
    }
    .theme-card img {
      height: 8rem; /* Adjust image height for mobile */
    }
  }
</style>
