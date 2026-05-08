<script>
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import Navbar from "$lib/components/Navbar.svelte";
  import CrosswordGrid1 from "$lib/components/CrosswordGrid1.svelte";
  import themedCrosswords from "$lib/data/themed_crosswords.json";

  // Simple function to convert title to URL slug
  function titleToSlug(title) {
    return title?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";
  }

  // Find puzzle ID by slug
  function findIdBySlug(slug) {
    for (const [id, puzzle] of Object.entries(themedCrosswords)) {
      if (titleToSlug(puzzle.title) === slug) {
        return id;
      }
    }
    return null;
  }

  let selectedId = $state(null);
  let selectedPuzzle = $state(null);

  // References to hold the reveal functions
  let revealSquare = $state(null);
  let revealWord = $state(null);
  let revealPuzzle = $state(null);

  // Load puzzle based on slug from URL
  $effect(() => {
    const slug = $page.params.slug;
    if (slug) {
      const foundId = findIdBySlug(slug);
      if (foundId) {
        selectedId = foundId;
        selectedPuzzle = themedCrosswords[foundId];
      } else {
        // If slug not found, redirect to themed gallery
        goto("/themed");
      }
    }
  });

  $effect(() => {
    if (typeof document !== "undefined") {
      document.title = selectedPuzzle?.title
        ? `Themed: ${selectedPuzzle.title} - Crosstune`
        : "Themed Puzzle - Crosstune";

      let metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (!metaThemeColor) {
        metaThemeColor = document.createElement("meta");
        metaThemeColor.name = "theme-color";
        document.head.appendChild(metaThemeColor);
      }

      const isDarkMode = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      metaThemeColor.content = isDarkMode ? "#202020" : "#ffffff";

      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", (e) => {
          metaThemeColor.content = e.matches ? "#202020" : "#ffffff";
        });
    }
  });

  // Function to receive the reveal functions from CrosswordGrid
  function handleRevealFunctions(functions) {
    revealSquare = functions.revealSquare;
    revealWord = functions.revealWord;
    revealPuzzle = functions.revealPuzzle;
  }

  // Navigation functions
  function navigateToThemedBoards() {
    goto("/themed");
  }

  function navigateToHome() {
    goto("/");
  }

  function navigateToArchives() {
    goto("/archives");
  }
</script>

<Navbar
  isThemedMode={true}
  onRevealSquare={revealSquare}
  onRevealWord={revealWord}
  onRevealPuzzle={revealPuzzle}
  onNavigateToThemedBoards={navigateToThemedBoards}
  onNavigateToHome={navigateToHome}
  onNavigateToArchives={navigateToArchives}
  hideTimer={false}
  words={selectedPuzzle?.words || []}
/>

<main class="bg-gray-200 dark:bg-[#303030] md:min-h-screen md:lg:mr-35">
  {#if selectedPuzzle}
    <!-- Mobile: fixed full-viewport grid with optional title row -->
    <div
      class="md:hidden fixed inset-0 grid"
      style="grid-template-rows: 48px auto 1fr var(--mobile-controls-h, 230px);"
    >
      <div></div>
      {#if selectedPuzzle?.title}
        <div class="px-3 py-1 min-w-0">
          <p class="text-xs leading-tight text-black dark:text-white truncate">
            <span class="font-bold">{selectedPuzzle.title}</span>
          </p>
        </div>
      {:else}
        <div></div>
      {/if}
      <div class="min-h-0 overflow-hidden">
        <CrosswordGrid1
          puzzle={selectedPuzzle}
          isArchiveMode={true}
          isThemedMode={true}
          {selectedId}
          onSetRevealFunctions={handleRevealFunctions}
          onNavigateBack={navigateToThemedBoards}
        />
      </div>
    </div>

    <!-- Desktop: original flow -->
    <div class="hidden md:block pt-0">
      <CrosswordGrid1
        puzzle={selectedPuzzle}
        isArchiveMode={true}
        isThemedMode={true}
        {selectedId}
        onSetRevealFunctions={handleRevealFunctions}
        onNavigateBack={navigateToThemedBoards}
      />
    </div>
  {/if}
</main>
