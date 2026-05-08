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
    <!-- Mobile: fixed full-viewport grid. Optional title row collapses to 0 when empty. -->
    <div
      class="md:hidden fixed inset-0 grid"
      style="grid-template-rows: 48px auto 1fr var(--mobile-controls-h, 230px);"
    >
      <div></div>
      {#if todayPuzzle?.title}
        <div class="px-3 py-1 min-w-0">
          <p class="text-xs leading-tight text-black dark:text-white truncate">
            <span class="font-bold">{todayPuzzle.title}</span>
          </p>
        </div>
      {:else}
        <div></div>
      {/if}
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
