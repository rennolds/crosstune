<script>
  import Navbar from "$lib/components/Navbar.svelte";
  import ThemedBoardGallery from "$lib/components/ThemedBoardGallery.svelte";
  import themedCrosswords from "$lib/data/themed_crosswords.json";

  $effect(() => {
    if (typeof document !== "undefined") {
      document.title = "Themed Boards - Crosstune";

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

  // Simple function to convert title to URL slug
  function titleToSlug(title) {
    return title?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";
  }

  function navigateToThemedPuzzle(puzzleId) {
    const puzzle = themedCrosswords[puzzleId];
    if (puzzle?.title) {
      const slug = titleToSlug(puzzle.title);
      window.location.href = `/themed/${slug}`;
    }
  }

  function navigateToHome() {
    window.location.href = "/";
  }

  function navigateToArchives() {
    window.location.href = "/archives";
  }
</script>

<Navbar
  themedTitle="Themed Puzzles"
  isThemedMode={false}
  onNavigateToHome={navigateToHome}
  onNavigateToArchives={navigateToArchives}
  hideTimer={true}
  words={[]}
/>

<main class="min-h-screen flex flex-col bg-gray-200 dark:bg-[#303030]">
  <!-- Themed boards gallery mode -->
  <div class="themed-container mx-auto px-4 py-4 w-full max-w-6xl">
    <ThemedBoardGallery
      {themedCrosswords}
      onSelectPuzzle={navigateToThemedPuzzle}
    />
  </div>
</main>

<style>
  /* Mobile-specific styles */
  @media (max-width: 768px) {
    .themed-container {
      padding-top: 3.5rem; /* Increase padding to ensure proper spacing below navbar */
      margin-top: 0;
    }
  }
</style>
