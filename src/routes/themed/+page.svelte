<script>
  import Navbar from "$lib/components/Navbar.svelte";
  import ThemedBoardGallery from "$lib/components/ThemedBoardGallery.svelte";
  import CrosswordGrid1 from "$lib/components/CrosswordGrid1.svelte";
  import themedCrosswords from "$lib/data/themed_crosswords.json";

  $effect(() => {
    if (typeof document !== "undefined") {
      document.title = selectedDate
        ? `Themed: ${selectedPuzzle?.title} - Crosstune`
        : "Themed Boards - Crosstune";

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

  let selectedDate = $state(null);
  let selectedPuzzle = $state(null);

  // References to hold the reveal functions
  let revealSquare = $state(null);
  let revealWord = $state(null);
  let revealPuzzle = $state(null);

  // Check if there's a date in the URL on load
  $effect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const dateParam = params.get("date");
      if (dateParam && themedCrosswords[dateParam]) {
        loadThemedPuzzle(dateParam);
      }
    }
  });

  function loadThemedPuzzle(date) {
    if (themedCrosswords[date]) {
      selectedDate = date;
      selectedPuzzle = themedCrosswords[date];

      // Update URL with the selected date
      if (typeof window !== "undefined") {
        const url = new URL(window.location);
        url.searchParams.set("date", date);
        window.history.pushState({}, "", url);
      }
    }
  }

  // Function to receive the reveal functions from CrosswordGrid
  function handleRevealFunctions(functions) {
    revealSquare = functions.revealSquare;
    revealWord = functions.revealWord;
    revealPuzzle = functions.revealPuzzle;
  }

  // Navigation functions
  function navigateToThemedBoards() {
    selectedDate = null;
    selectedPuzzle = null;
    // Update URL to remove date parameter
    if (typeof window !== "undefined") {
      const url = new URL(window.location);
      url.searchParams.delete("date");
      window.history.pushState({}, "", url);
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
  themedTitle={selectedPuzzle?.title || "Themed Puzzles"}
  isThemedMode={true}
  onRevealSquare={revealSquare}
  onRevealWord={revealWord}
  onRevealPuzzle={revealPuzzle}
  onNavigateToThemedBoards={navigateToThemedBoards}
  onNavigateToHome={navigateToHome}
  onNavigateToArchives={navigateToArchives}
  hideTimer={!selectedDate}
  words={selectedPuzzle?.words || []}
/>

<main class="dark min-h-screen flex flex-col">
  {#if selectedDate}
    <!-- In themed puzzle mode -->
    <div class="flex-1 pt-12.5 md:pt-0 lg:mr-35">
      <CrosswordGrid1
        puzzle={selectedPuzzle}
        isArchiveMode={true}
        isThemedMode={true}
        {selectedDate}
        onSetRevealFunctions={handleRevealFunctions}
        onNavigateBack={navigateToThemedBoards}
      />
    </div>
  {:else}
    <!-- In themed boards gallery mode -->
    <div class="themed-container mx-auto px-4 py-4 w-full max-w-6xl">
      <ThemedBoardGallery {themedCrosswords} onSelectDate={loadThemedPuzzle} />
    </div>
  {/if}
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
