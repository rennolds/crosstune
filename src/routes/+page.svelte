<script>
  import CrosswordGrid1 from "$lib/components/CrosswordGrid1.svelte";
  import Navbar from "$lib/components/Navbar.svelte";
  import SplashScreen from "$lib/components/SplashScreen.svelte";

  // Check if we should show splash on load (always show on main route)

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
    <!-- Mobile: fixed full-viewport grid: 48px navbar reserve, 1fr play area, 230px controls reserve. -->
    <div
      class="md:hidden fixed inset-0 grid"
      style="grid-template-rows: 48px 1fr var(--mobile-controls-h, 230px);"
    >
      <div></div>
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
