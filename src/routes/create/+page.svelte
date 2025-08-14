<script>
  import Navbar from "$lib/components/Navbar.svelte";

  let gridData = $state(
    Array(10)
      .fill()
      .map(() => Array(12).fill(""))
  );
  let selectedCell = $state({ row: -1, col: -1 });
  let direction = $state("ACROSS"); // "ACROSS" or "DOWN"
  let showSplash = $state(true);
  let showWordForms = $state(false);
  let showFinalDetails = $state(false);
  let detectedWords = $state([]);
  let finalDetails = $state({
    creditName: "",
    boardTitle: "",
    email: "",
    notes: "",
  });
  let wordCountWarning = $state("");
  let showWarning = $state(false);

  $effect(() => {
    if (typeof document !== "undefined") {
      document.title = "Create Puzzle - Crosstune";

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

  function handleCellClick(row, col) {
    selectedCell = { row, col };
  }

  function handleCellInput(event, row, col) {
    const value = event.target.value.toUpperCase().slice(-1); // Take the last character typed
    gridData[row][col] = value;

    // Move to next cell after input based on direction
    if (value) {
      if (direction === "ACROSS" && col < 11) {
        selectedCell = { row, col: col + 1 };
        setTimeout(() => {
          const nextInput = document.querySelector(
            `input[data-row="${row}"][data-col="${col + 1}"]`
          );
          if (nextInput) nextInput.focus();
        }, 0);
      } else if (direction === "DOWN" && row < 9) {
        selectedCell = { row: row + 1, col };
        setTimeout(() => {
          const nextInput = document.querySelector(
            `input[data-row="${row + 1}"][data-col="${col}"]`
          );
          if (nextInput) nextInput.focus();
        }, 0);
      }
    }
  }

  function handleCellFocus(event, row, col) {
    // Select all text when focusing on a cell so typing will replace it
    event.target.select();
  }

  function toggleDirection() {
    direction = direction === "ACROSS" ? "DOWN" : "ACROSS";
  }

  function detectWords() {
    const words = [];

    // Detect ACROSS words
    for (let row = 0; row < 10; row++) {
      let currentWord = "";
      let startCol = -1;

      for (let col = 0; col < 12; col++) {
        const cell = gridData[row][col];

        if (cell && cell.trim() !== "") {
          if (currentWord === "") {
            startCol = col;
          }
          currentWord += cell;
        } else {
          if (currentWord.length >= 2) {
            words.push({
              word: currentWord,
              direction: "ACROSS",
              row: row,
              col: startCol,
              clue: "",
              artistName: "",
              songName: "",
            });
          }
          currentWord = "";
          startCol = -1;
        }
      }

      // Check for word at end of row
      if (currentWord.length >= 2) {
        words.push({
          word: currentWord,
          direction: "ACROSS",
          row: row,
          col: startCol,
          clue: "",
          artistName: "",
          songName: "",
        });
      }
    }

    // Detect DOWN words
    for (let col = 0; col < 12; col++) {
      let currentWord = "";
      let startRow = -1;

      for (let row = 0; row < 10; row++) {
        const cell = gridData[row][col];

        if (cell && cell.trim() !== "") {
          if (currentWord === "") {
            startRow = row;
          }
          currentWord += cell;
        } else {
          if (currentWord.length >= 2) {
            words.push({
              word: currentWord,
              direction: "DOWN",
              row: startRow,
              col: col,
              clue: "",
              artistName: "",
              songName: "",
            });
          }
          currentWord = "";
          startRow = -1;
        }
      }

      // Check for word at end of column
      if (currentWord.length >= 2) {
        words.push({
          word: currentWord,
          direction: "DOWN",
          row: startRow,
          col: col,
          clue: "",
          artistName: "",
          songName: "",
        });
      }
    }

    return words;
  }

  function validateWordCount(words) {
    const wordCount = words.length;
    if (wordCount < 8) {
      wordCountWarning = `You need at least 8 words. Currently have ${wordCount} words.`;
      showWarning = true;
      return false;
    } else if (wordCount > 9) {
      wordCountWarning = `Maximum 9 words allowed. Currently have ${wordCount} words.`;
      showWarning = true;
      return false;
    }
    return true;
  }

  function handleNextClick() {
    const words = detectWords();

    if (!validateWordCount(words)) {
      return; // Don't proceed if word count is invalid
    }

    detectedWords = words;
    showWordForms = true;
    showWarning = false; // Hide any existing warnings
  }

  function dismissWarning() {
    showWarning = false;
  }

  function validateWordForms() {
    for (let i = 0; i < detectedWords.length; i++) {
      const word = detectedWords[i];
      if (
        !word.clue.trim() ||
        !word.artistName.trim() ||
        !word.songName.trim()
      ) {
        wordCountWarning = `All fields are required. Please fill in clue, artist name, and song name for "${word.word}".`;
        showWarning = true;
        return false;
      }
    }
    return true;
  }

  function handleStartCreating() {
    showSplash = false;
  }

  function handleFinalDetailsClick() {
    if (!validateWordForms()) {
      return; // Don't proceed if validation fails
    }

    showWordForms = false;
    showFinalDetails = true;
    showWarning = false; // Hide any existing warnings
  }

  function handleKeyDown(event, row, col) {
    if (event.key === "Enter") {
      event.preventDefault();
      toggleDirection();
      return;
    }

    if (event.key === "Backspace" && !gridData[row][col]) {
      if (direction === "ACROSS" && col > 0) {
        selectedCell = { row, col: col - 1 };
        setTimeout(() => {
          const prevInput = document.querySelector(
            `input[data-row="${row}"][data-col="${col - 1}"]`
          );
          if (prevInput) prevInput.focus();
        }, 0);
      } else if (direction === "DOWN" && row > 0) {
        selectedCell = { row: row - 1, col };
        setTimeout(() => {
          const prevInput = document.querySelector(
            `input[data-row="${row - 1}"][data-col="${col}"]`
          );
          if (prevInput) prevInput.focus();
        }, 0);
      }
    } else if (event.key === "ArrowLeft" && col > 0) {
      selectedCell = { row, col: col - 1 };
      setTimeout(() => {
        const prevInput = document.querySelector(
          `input[data-row="${row}"][data-col="${col - 1}"]`
        );
        if (prevInput) prevInput.focus();
      }, 0);
    } else if (event.key === "ArrowRight" && col < 11) {
      selectedCell = { row, col: col + 1 };
      setTimeout(() => {
        const nextInput = document.querySelector(
          `input[data-row="${row}"][data-col="${col + 1}"]`
        );
        if (nextInput) nextInput.focus();
      }, 0);
    } else if (event.key === "ArrowUp" && row > 0) {
      selectedCell = { row: row - 1, col };
      setTimeout(() => {
        const upInput = document.querySelector(
          `input[data-row="${row - 1}"][data-col="${col}"]`
        );
        if (upInput) upInput.focus();
      }, 0);
    } else if (event.key === "ArrowDown" && row < 9) {
      selectedCell = { row: row + 1, col };
      setTimeout(() => {
        const downInput = document.querySelector(
          `input[data-row="${row + 1}"][data-col="${col}"]`
        );
        if (downInput) downInput.focus();
      }, 0);
    }
  }

  function navigateToHome() {
    window.location.href = "/";
  }

  function navigateToArchives() {
    window.location.href = "/archives";
  }

  function navigateToThemed() {
    window.location.href = "/themed";
  }
</script>

<Navbar
  onHomeClick={navigateToHome}
  onArchivesClick={navigateToArchives}
  onThemedClick={navigateToThemed}
  hideTimer={true}
/>

<main
  class="min-h-screen bg-white dark:bg-[#202020] text-black dark:text-white"
>
  <div class="container mx-auto px-4 py-8 pt-16 md:pt-8">
    {#if !showSplash && !showWordForms && !showFinalDetails}
      <!-- Direction Toggle for Grid Page -->
      <div class="text-center mb-8">
        <div class="flex items-center justify-center space-x-4">
          <div class="flex items-center space-x-3">
            <span class="text-sm font-medium">across</span>
            <button
              class="relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              class:bg-blue-500={direction === "DOWN"}
              class:bg-gray-300={direction === "ACROSS"}
              class:dark:bg-gray-600={direction === "ACROSS"}
              onclick={toggleDirection}
              aria-label="Toggle direction"
            >
              <span
                class="inline-block w-4 h-4 transform bg-white rounded-full transition-transform"
                class:translate-x-6={direction === "DOWN"}
                class:translate-x-1={direction === "ACROSS"}
              ></span>
            </button>
            <span class="text-sm font-medium">down</span>
          </div>
        </div>

        <p
          class="text-sm text-gray-500 dark:text-gray-400 mt-2 hidden md:block"
        >
          Press ENTER to toggle direction while typing
        </p>
      </div>
    {/if}

    {#if showSplash}
      <!-- Splash Screen / Guidelines -->
      <div class="max-w-4xl mx-auto">
        <div class="p-6 mb-6">
          <h2 class="text-2xl font-bold mb-3">
            Create your own crosstune puzzle to be featured!
          </h2>

          <div class="space-y-2">
            <div class="flex items-start">
              <span class="font-semibold mr-2">1.</span>
              <span
                >Fill the puzzle grid with your answers (songs, artists,
                lyrics...)</span
              >
            </div>
            <div class="flex items-start">
              <span class="font-semibold mr-2">2.</span>
              <span>Add the clue & song hint on the next page</span>
            </div>
            <div class="flex items-start">
              <span class="font-semibold mr-2">3.</span>
              <span
                >Give us your contact info and we'll reach out if we feature the
                puzzle!</span
              >
            </div>
          </div>
        </div>

        <div class="p-6">
          <h3 class="text-xl font-bold mb-3">Helpful info</h3>

          <div class="space-y-3">
            <div class="flex items-start">
              <span class="font-semibold mr-2">1.</span>
              <span>Each puzzle must have at least 8 words</span>
            </div>

            <div class="flex items-start">
              <span class="font-semibold mr-2">2.</span>
              <span
                >Answers can't float in empty space and must be connected</span
              >
            </div>

            <div class="flex items-start">
              <span class="font-semibold mr-2">3.</span>
              <div>
                <div class="mb-1">
                  Hints can be as creative as you'd like. Some common ones:
                </div>
                <div class="ml-4 space-y-0.5">
                  <div class="flex items-start">
                    <span class="mr-2">a.</span>
                    <span>Song title</span>
                  </div>
                  <div class="flex items-start">
                    <span class="mr-2">b.</span>
                    <span>Artist name</span>
                  </div>
                  <div class="flex items-start">
                    <span class="mr-2">c.</span>
                    <span>Complete the lyric: ____</span>
                  </div>
                </div>
                <div class="mt-1 text-sm">
                  Very trivia focused clues like "what country was this artist
                  born in" or "what year did this song come out?" are
                  discouraged.
                </div>
              </div>
            </div>

            <div class="flex items-start">
              <span class="font-semibold mr-2">4.</span>
              <span>Profanity will not be featured on the Daily.</span>
            </div>

            <div class="flex items-start">
              <span class="font-semibold mr-2">5.</span>
              <span
                >We occasionally can't get a certain song or play any snippet
                we'd like, so we may need to tweak your puzzle a bit.</span
              >
            </div>
          </div>
        </div>

        <div class="text-center mt-6">
          <button
            class="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
            onclick={handleStartCreating}
          >
            Start Creating
          </button>
        </div>
      </div>
    {:else if !showWordForms && !showFinalDetails}
      <!-- Grid Creation Step -->
      <div class="flex justify-center px-2 md:px-0">
        <div
          class="grid grid-cols-12 gap-0.5 md:gap-1 bg-black p-1 md:p-2 rounded-lg w-full max-w-fit overflow-x-auto"
        >
          {#each gridData as row, rowIndex}
            {#each row as cell, colIndex}
              <div class="relative">
                <input
                  type="text"
                  class="w-8 h-8 md:w-10 md:h-10 text-center text-black font-bold text-sm md:text-lg border border-gray-300 focus:border-blue-500 focus:outline-none bg-white"
                  class:bg-blue-100={selectedCell.row === rowIndex &&
                    selectedCell.col === colIndex}
                  value={cell}
                  data-row={rowIndex}
                  data-col={colIndex}
                  onclick={() => handleCellClick(rowIndex, colIndex)}
                  onfocus={(event) =>
                    handleCellFocus(event, rowIndex, colIndex)}
                  oninput={(event) =>
                    handleCellInput(event, rowIndex, colIndex)}
                  onkeydown={(event) =>
                    handleKeyDown(event, rowIndex, colIndex)}
                  maxlength="1"
                />
              </div>
            {/each}
          {/each}
        </div>
      </div>

      <div class="mt-8">
        <div class="flex justify-between items-center max-w-md mx-auto">
          <button
            class="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            onclick={() => {
              // Clear grid and reset to splash
              gridData = Array(10)
                .fill()
                .map(() => Array(12).fill(""));
              showSplash = true;
              showWordForms = false;
              showFinalDetails = false;
              detectedWords = [];
              finalDetails = {
                creditName: "",
                boardTitle: "",
                email: "",
                notes: "",
              };
            }}
          >
            Clear Grid
          </button>

          <button
            class="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            onclick={handleNextClick}
          >
            NEXT
          </button>
        </div>

        <div class="text-center mt-4">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            Use letters and numbers to fill your crossword. Navigate with arrow
            keys or mouse clicks.
          </div>
        </div>
      </div>
    {:else if showWordForms}
      <!-- Word Forms Step -->
      <div class="max-w-4xl mx-auto">
        <div class="space-y-6">
          {#each detectedWords as word, index}
            <div
              class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div class="flex items-center mb-3">
                <span class="font-bold text-lg mr-2">{word.word}</span>
                <span class="text-sm text-gray-500 dark:text-gray-400">
                  ({word.direction} - Row {word.row + 1}, Col {word.col + 1})
                </span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-1">
                    Clue: <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                    bind:value={detectedWords[index].clue}
                    placeholder="Enter the crossword clue (required)"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-1">
                    Artist Name: <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                    bind:value={detectedWords[index].artistName}
                    placeholder="Enter artist name (required)"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-1">
                    Song Name: <span class="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                    bind:value={detectedWords[index].songName}
                    placeholder="Enter song name (required)"
                  />
                </div>
              </div>
            </div>
          {/each}
        </div>

        <div class="flex justify-center space-x-4 mt-8">
          <button
            class="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            onclick={() => (showWordForms = false)}
          >
            Back to Grid
          </button>
          <button
            class="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
            onclick={handleFinalDetailsClick}
          >
            Final Details
          </button>
        </div>
      </div>
    {:else if showFinalDetails}
      <!-- Final Details Step -->
      <div class="max-w-2xl mx-auto">
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-medium mb-2">
              Want credit? Give us a name/handle to shoutout
            </label>
            <input
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
              bind:value={finalDetails.creditName}
              placeholder="Your name or handle (optional)"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">
              Title for the board?
            </label>
            <input
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
              bind:value={finalDetails.boardTitle}
              placeholder="Give your puzzle a title (optional)"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">
              How can we reach out to you to let you know we're featuring the
              puzzle? Email only please!
            </label>
            <input
              type="email"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
              bind:value={finalDetails.email}
              placeholder="your.email@example.com (optional)"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">
              Any other notes for us?
            </label>
            <textarea
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 h-24 resize-vertical"
              bind:value={finalDetails.notes}
              placeholder="Any additional notes or comments (optional)"
            ></textarea>
          </div>
        </div>

        <div class="flex justify-center space-x-4 mt-8">
          <button
            class="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            onclick={() => {
              showFinalDetails = false;
              showWordForms = true;
            }}
          >
            Back to Clues
          </button>
          <button
            class="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
            onclick={async () => {
              try {
                const response = await fetch("/api/submit-puzzle", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    grid: gridData,
                    words: detectedWords,
                    details: finalDetails,
                  }),
                });

                if (response.ok) {
                  const result = await response.json();
                  wordCountWarning =
                    "Puzzle submitted successfully! Thank you for your submission.";
                  showWarning = true;

                  // Reset form after successful submission
                  setTimeout(() => {
                    gridData = Array(10)
                      .fill()
                      .map(() => Array(12).fill(""));
                    showSplash = true;
                    showWordForms = false;
                    showFinalDetails = false;
                    detectedWords = [];
                    finalDetails = {
                      creditName: "",
                      boardTitle: "",
                      email: "",
                      notes: "",
                    };
                    showWarning = false;
                  }, 3000);
                } else {
                  wordCountWarning =
                    "Failed to submit puzzle. Please try again.";
                  showWarning = true;
                }
              } catch (error) {
                console.error("Submission error:", error);
                wordCountWarning =
                  "Error submitting puzzle. Please check your connection and try again.";
                showWarning = true;
              }
            }}
          >
            Submit Puzzle
          </button>
        </div>
      </div>
    {/if}
  </div>
</main>

<!-- Word Count Warning -->
{#if showWarning}
  <div
    class="fixed top-20 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg z-40 max-w-sm"
  >
    <div class="flex items-start justify-between">
      <div class="mr-3">
        <p class="text-sm font-medium">{wordCountWarning}</p>
      </div>
      <button
        onclick={dismissWarning}
        class="flex-shrink-0 p-1 hover:bg-red-600 rounded transition-colors"
        aria-label="Dismiss warning"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          ></path>
        </svg>
      </button>
    </div>
  </div>
{/if}

<style>
  input:focus {
    z-index: 10;
  }
</style>
