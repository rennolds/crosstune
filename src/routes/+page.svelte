<script>
  import CrosswordGrid1 from "$lib/components/CrosswordGrid1.svelte";
  import Navbar from "$lib/components/Navbar.svelte";
  import SplashScreen from "$lib/components/SplashScreen.svelte";
  import crosswords from "$lib/data/crosswords.json";

  function getEastCoastDate() {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/New_York",
      year: "numeric", month: "2-digit", day: "2-digit",
    });
    return fmt.format(now);
  }
  const todayPuzzle = crosswords[getEastCoastDate()] || null;

  // References to hold the reveal functions
  let revealSquare = $state(null);
  let revealWord = $state(null);
  let revealPuzzle = $state(null);
  let showSplash = $state(true);
  let words = $state([]); // Add state for words

  function handlePlay() {
    showSplash = false;
  }

  // Function to receive the reveal functions from CrosswordGrid
  function handleRevealFunctions(functions) {
    revealSquare = functions.revealSquare;
    revealWord = functions.revealWord;
    revealPuzzle = functions.revealPuzzle;
  }

  // Function to receive words from CrosswordGrid
  function handleWords(newWords) {
    words = newWords;
  }

  function navigateToHome() {
    window.location.reload();
  }
</script>

<Navbar
  onRevealSquare={revealSquare}
  onRevealWord={revealWord}
  onRevealPuzzle={revealPuzzle}
  hideTimer={showSplash}
  {words}
/>
{#if showSplash}
  <SplashScreen onPlay={handlePlay} />
{:else}
  <main
    class="bg-gray-200 dark:bg-[#303030] md:min-h-screen md:lg:mr-35"
  >
    <!-- Mobile: fixed wrapper below the navbar with title / play / controls rows. -->
    <div
      class="md:hidden fixed left-0 right-0 grid"
      style="top: 48px; bottom: 0; grid-template-rows: auto 1fr var(--mobile-controls-h, 210px);"
    >
      <div class="px-3 py-2 min-w-0">
        <p class="text-sm leading-tight text-black dark:text-white truncate">
          {#if todayPuzzle?.title}
            <span class="font-bold">{todayPuzzle.title}</span>
          {/if}
        </p>
      </div>
      <div class="min-h-0 overflow-hidden">
        <CrosswordGrid1
          onSetRevealFunctions={handleRevealFunctions}
          onWords={handleWords}
        />
      </div>
    </div>

    <!-- Desktop: original flow -->
    <div class="hidden md:block">
      <CrosswordGrid1
        onSetRevealFunctions={handleRevealFunctions}
        onWords={handleWords}
      />
    </div>
  </main>
{/if}
