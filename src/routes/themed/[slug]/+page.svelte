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
  themedTitle={selectedPuzzle?.title || "Themed Puzzle"}
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

<main class="min-h-screen flex flex-col bg-gray-200 dark:bg-[#303030]">
  {#if selectedPuzzle}
    <div class="flex-1 pt-12.5 md:pt-0 lg:mr-35">
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
