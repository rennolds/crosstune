<script>
  import Navbar from "$lib/components/Navbar.svelte";
  import ArchiveList from "$lib/components/ArchiveList.svelte";
  import CrosswordGrid1 from "$lib/components/CrosswordGrid1.svelte";
  import crosswords from "$lib/data/crosswords.json";
  import { onMount } from "svelte";

  // Render only the mobile OR desktop wrapper — never both. With both
  // mounted, each CrosswordGrid1 instance calls onSetRevealFunctions and
  // the second call wins, so Reveal targets the wrong (hidden) grid.
  let isMobile = $state(false);
  onMount(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 768px)");
    isMobile = mq.matches;
    const handler = (e) => (isMobile = e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  });

  $effect(() => {
    if (typeof document !== "undefined") {
      document.title = selectedDate
        ? `Archive: ${formatCompactDate(selectedDate)} - Crosstune`
        : "Archives - Crosstune";

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
  let puzzle = $state(null);

  // References to hold the reveal functions
  let revealSquare = $state(null);
  let revealWord = $state(null);
  let revealPuzzle = $state(null);

  // Check if there's a date in the URL on load
  $effect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const dateParam = params.get("date");
      if (dateParam && crosswords[dateParam]) {
        loadArchivePuzzle(dateParam);
      }
    }
  });

  function loadArchivePuzzle(date) {
    if (crosswords[date]) {
      selectedDate = date;
      puzzle = crosswords[date];

      // Update URL with the selected date
      if (typeof window !== "undefined") {
        const url = new URL(window.location);
        url.searchParams.set("date", date);
        window.history.pushState({}, "", url);
      }
    }
  }

  // Function to format date in a compact way (MM/DD/YY) using Eastern Time
  function formatCompactDate(dateString) {
    if (!dateString) return "";
    const date = new Date(`${dateString}T12:00:00-04:00`);
    return date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "2-digit",
      timeZone: "America/New_York",
    });
  }

  // Function to receive the reveal functions from CrosswordGrid
  function handleRevealFunctions(functions) {
    revealSquare = functions.revealSquare;
    revealWord = functions.revealWord;
    revealPuzzle = functions.revealPuzzle;
  }

  // Navigation functions
  function navigateToArchives() {
    selectedDate = null;
    // Update URL to remove date parameter
    if (typeof window !== "undefined") {
      const url = new URL(window.location);
      url.searchParams.delete("date");
      window.history.pushState({}, "", url);
    }
  }

  function navigateToToday() {
    window.location.href = "/";
  }

  function navigateToHome() {
    window.location.href = "/";
  }
</script>

<Navbar
  archiveDate={selectedDate ? formatCompactDate(selectedDate) : null}
  isArchiveMode={true}
  onRevealSquare={revealSquare}
  onRevealWord={revealWord}
  onRevealPuzzle={revealPuzzle}
  onNavigateToArchives={navigateToArchives}
  onNavigateToToday={navigateToToday}
  onNavigateToHome={navigateToHome}
  hideTimer={!selectedDate}
  words={puzzle?.words || []}
/>

<main class="min-h-screen flex flex-col bg-gray-200 dark:bg-[#303030]">
  {#if selectedDate}
    {#if isMobile}
    <!-- Mobile: fixed wrapper below the navbar with title / play / controls rows. -->
    <div
      class="fixed left-0 right-0 grid"
      style="top: 98px; bottom: 0; grid-template-rows: auto 1fr var(--mobile-controls-h, 210px);"
    >
      {#if puzzle?.title}
        <div class="px-3 pt-1 pb-0.5 min-w-0">
          <p class="text-sm leading-tight text-black dark:text-white truncate">
            <span class="font-bold">{puzzle.title}</span>
          </p>
        </div>
      {:else}
        <div></div>
      {/if}
      <div class="min-h-0 overflow-hidden">
        {#key selectedDate}
          <CrosswordGrid1
            {puzzle}
            isArchiveMode={true}
            {selectedDate}
            onSetRevealFunctions={handleRevealFunctions}
          />
        {/key}
      </div>
    </div>

    {:else}

    <!-- Desktop: original flow -->
    <div class="flex-1 lg:mr-35">
      {#key selectedDate}
        <CrosswordGrid1
          {puzzle}
          isArchiveMode={true}
          {selectedDate}
          onSetRevealFunctions={handleRevealFunctions}
        />
      {/key}
    </div>
    {/if}
  {:else}
    <!-- In archive list mode -->
    <div class="archives-container mx-auto px-4 py-4 w-full max-w-5xl">
      <ArchiveList {crosswords} onSelectDate={loadArchivePuzzle} />
    </div>
  {/if}
</main>

<style>
  /* Mobile-specific styles */
  @media (max-width: 768px) {
    .archives-container {
      padding-top: 3.5rem; /* Increase padding to ensure proper spacing below navbar */
      margin-top: 0;
    }
  }
</style>
