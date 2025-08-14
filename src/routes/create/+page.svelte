<script>
  import Navbar from "$lib/components/Navbar.svelte";

  let gridData = $state(
    Array(10)
      .fill()
      .map(() => Array(12).fill(""))
  );
  let selectedCell = $state({ row: -1, col: -1 });
  let direction = $state("ACROSS"); // "ACROSS" or "DOWN"
  let showWordForms = $state(false);
  let showFinalDetails = $state(false);
  let detectedWords = $state([]);
  let finalDetails = $state({
    creditName: "",
    boardTitle: "",
    email: "",
    notes: "",
  });

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
    const value = event.target.value.toUpperCase().slice(0, 1);
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

  function handleNextClick() {
    const words = detectWords();
    detectedWords = words;
    showWordForms = true;
  }

  function handleFinalDetailsClick() {
    showWordForms = false;
    showFinalDetails = true;
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
  <div class="container mx-auto px-4 py-8">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold mb-2">Create Your Puzzle</h1>
      {#if !showWordForms && !showFinalDetails}
        <p class="text-gray-600 dark:text-gray-400">
          Design a 12x10 crossword puzzle to submit for featuring
        </p>

        <!-- Direction Toggle -->
        <div class="mt-4 flex items-center justify-center space-x-4">
          <div class="flex items-center space-x-2">
            <span class="text-sm font-medium">Direction:</span>
            <button
              class="px-3 py-1 rounded-lg border-2 transition-colors font-medium"
              class:bg-blue-500={direction === "ACROSS"}
              class:text-white={direction === "ACROSS"}
              class:border-blue-500={direction === "ACROSS"}
              class:bg-transparent={direction !== "ACROSS"}
              class:text-gray-700={direction !== "ACROSS"}
              class:dark:text-gray-300={direction !== "ACROSS"}
              class:border-gray-300={direction !== "ACROSS"}
              onclick={toggleDirection}
            >
              ACROSS
            </button>
            <button
              class="px-3 py-1 rounded-lg border-2 transition-colors font-medium"
              class:bg-blue-500={direction === "DOWN"}
              class:text-white={direction === "DOWN"}
              class:border-blue-500={direction === "DOWN"}
              class:bg-transparent={direction !== "DOWN"}
              class:text-gray-700={direction !== "DOWN"}
              class:dark:text-gray-300={direction !== "DOWN"}
              class:border-gray-300={direction !== "DOWN"}
              onclick={toggleDirection}
            >
              DOWN
            </button>
          </div>
        </div>

        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Press ENTER to toggle direction while typing
        </p>
      {:else if showWordForms}
        <p class="text-gray-600 dark:text-gray-400">
          Enter clues and song information for each word
        </p>
      {:else if showFinalDetails}
        <p class="text-gray-600 dark:text-gray-400">
          Just a few optional details and you're done!
        </p>
      {/if}
    </div>

    {#if !showWordForms && !showFinalDetails}
      <!-- Grid Creation Step -->
      <div class="flex justify-center">
        <div class="grid grid-cols-12 gap-1 bg-black p-2 rounded-lg">
          {#each gridData as row, rowIndex}
            {#each row as cell, colIndex}
              <div class="relative">
                <input
                  type="text"
                  class="w-8 h-8 text-center text-black font-bold text-sm border-2 border-gray-300 focus:border-blue-500 focus:outline-none bg-white"
                  class:bg-blue-100={selectedCell.row === rowIndex &&
                    selectedCell.col === colIndex}
                  value={cell}
                  data-row={rowIndex}
                  data-col={colIndex}
                  onclick={() => handleCellClick(rowIndex, colIndex)}
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

      <div class="mt-8 text-center">
        <div class="space-y-4">
          <div class="flex justify-center space-x-4">
            <button
              class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              onclick={() => {
                // Clear grid
                gridData = Array(10)
                  .fill()
                  .map(() => Array(12).fill(""));
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
                  <label class="block text-sm font-medium mb-1">Clue:</label>
                  <input
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                    bind:value={detectedWords[index].clue}
                    placeholder="Enter the crossword clue"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-1"
                    >Artist Name:</label
                  >
                  <input
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                    bind:value={detectedWords[index].artistName}
                    placeholder="Enter artist name"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-1"
                    >Song Name:</label
                  >
                  <input
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                    bind:value={detectedWords[index].songName}
                    placeholder="Enter song name"
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
            onclick={() => {
              // TODO: Handle final submission
              console.log("Complete puzzle data:", {
                grid: gridData,
                words: detectedWords,
                details: finalDetails,
              });
            }}
          >
            Submit Puzzle
          </button>
        </div>
      </div>
    {/if}
  </div>
</main>

<style>
  input:focus {
    z-index: 10;
  }
</style>
