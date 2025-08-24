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
  let showSuccessScreen = $state(false);
  let detectedWords = $state([]);
  let soundcloudValidation = $state({}); // Track validation status for each word
  let widgetTiming = $state({}); // Track start/end times for each word

  // Game colors from crosswords.json
  const gameColors = [
    "#FFB34B", // Orange
    "#00FFFF", // Cyan
    "#FE9C9C", // Pink
    "#28D66A", // Green
    "#FFCEFD", // Light Pink
    "#FF5B5E", // Red
    "#568EFF", // Blue
  ];

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
              soundcloudUrl: "",
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
              soundcloudUrl: "",
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
    scrollToTop();
  }

  function dismissWarning() {
    showWarning = false;
  }

  function validateWordForms() {
    for (let i = 0; i < detectedWords.length; i++) {
      const word = detectedWords[i];
      const validationKey = `word-${i}`;
      const validation = soundcloudValidation[validationKey];

      if (!word.clue.trim() || !word.soundcloudUrl.trim()) {
        wordCountWarning = `All fields are required. Please fill in clue and SoundCloud URL for "${word.word}".`;
        showWarning = true;
        return false;
      }

      // Check if SoundCloud URL validation is complete and valid
      if (!validation || validation.status !== "valid" || !validation.trackId) {
        wordCountWarning = `Please wait for SoundCloud URL validation to complete for "${word.word}", or check that the URL is valid.`;
        showWarning = true;
        return false;
      }
    }
    return true;
  }

  function isValidSoundCloudUrl(url) {
    try {
      const urlObj = new URL(url);
      return (
        urlObj.hostname === "soundcloud.com" ||
        urlObj.hostname === "www.soundcloud.com"
      );
    } catch {
      return false;
    }
  }

  async function validateSoundCloudUrl(url, wordIndex) {
    const validationKey = `word-${wordIndex}`;

    // Reset validation state
    soundcloudValidation[validationKey] = {
      status: "validating",
      message: "Checking SoundCloud URL...",
      trackId: null,
    };

    if (!url.trim()) {
      soundcloudValidation[validationKey] = {
        status: "empty",
        message: "",
        trackId: null,
      };
      return;
    }

    if (!isValidSoundCloudUrl(url)) {
      soundcloudValidation[validationKey] = {
        status: "invalid",
        message: "Please enter a valid SoundCloud URL",
        trackId: null,
      };
      return;
    }

    try {
      const result = await getSoundCloudId(url);
      if (result && result.type === "tracks") {
        soundcloudValidation[validationKey] = {
          status: "valid",
          message: "✓ Track found and ready for timing",
          trackId: result.id,
        };

        // Initialize timing data
        if (!widgetTiming[validationKey]) {
          widgetTiming[validationKey] = {
            startAt: "0:00",
            endAt: "0:06",
            audioDuration: 6,
          };
        }
      } else {
        soundcloudValidation[validationKey] = {
          status: "invalid",
          message:
            "Could not find a valid SoundCloud track. Make sure it's a track (not a playlist).",
          trackId: null,
        };
      }
    } catch (error) {
      soundcloudValidation[validationKey] = {
        status: "error",
        message: "Error checking SoundCloud URL. Please try again.",
        trackId: null,
      };
    }
  }

  // Debounce function to avoid too many API calls
  let validationTimeouts = {};
  function debouncedValidation(url, wordIndex) {
    const validationKey = `word-${wordIndex}`;

    // Clear existing timeout
    if (validationTimeouts[validationKey]) {
      clearTimeout(validationTimeouts[validationKey]);
    }

    // Set new timeout
    validationTimeouts[validationKey] = setTimeout(() => {
      validateSoundCloudUrl(url, wordIndex);
    }, 500); // Wait 500ms after user stops typing
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function parseTime(timeString) {
    const [mins, secs] = timeString.split(":").map(Number);
    return mins * 60 + secs;
  }

  function updateStartTime(wordIndex, seconds) {
    const widgetKey = `word-${wordIndex}`;
    if (!widgetTiming[widgetKey]) {
      widgetTiming[widgetKey] = {
        startAt: "0:00",
        endAt: "0:06",
        audioDuration: 6,
      };
    }
    widgetTiming[widgetKey].startAt = formatTime(seconds);

    // Update end time based on start + duration
    const duration = widgetTiming[widgetKey].audioDuration;
    widgetTiming[widgetKey].endAt = formatTime(seconds + duration);
  }

  function updateDuration(wordIndex, duration) {
    const widgetKey = `word-${wordIndex}`;
    if (!widgetTiming[widgetKey]) {
      widgetTiming[widgetKey] = {
        startAt: "0:00",
        endAt: "0:06",
        audioDuration: 6,
      };
    }
    widgetTiming[widgetKey].audioDuration = duration;

    // Update end time based on start + duration
    const startSeconds = parseTime(widgetTiming[widgetKey].startAt);
    const endSeconds = startSeconds + duration;
    widgetTiming[widgetKey].endAt = formatTime(endSeconds);
  }

  function getCurrentTime(wordIndex) {
    const iframe = document.getElementById(`widget-${wordIndex}`);
    if (iframe && window.SC && window.SC.Widget) {
      const widget = window.SC.Widget(iframe);

      widget.getPosition((position) => {
        const seconds = Math.floor(position / 1000); // Convert from milliseconds
        updateStartTime(wordIndex, seconds);
      });
    } else {
      console.warn("SoundCloud Widget API not available or iframe not found");
    }
  }

  function setEndPoint(wordIndex) {
    const iframe = document.getElementById(`widget-${wordIndex}`);
    if (iframe && window.SC && window.SC.Widget) {
      const widget = window.SC.Widget(iframe);

      widget.getPosition((position) => {
        const endSeconds = Math.floor(position / 1000);
        const widgetKey = `word-${wordIndex}`;

        if (!widgetTiming[widgetKey]) {
          widgetTiming[widgetKey] = {
            startAt: "0:00",
            endAt: "0:06",
            audioDuration: 6,
          };
        }

        const startSeconds = parseTime(widgetTiming[widgetKey].startAt);
        const duration = Math.max(1, endSeconds - startSeconds); // Minimum 1 second

        widgetTiming[widgetKey].endAt = formatTime(endSeconds);
        widgetTiming[widgetKey].audioDuration = duration;
      });
    } else {
      console.warn("SoundCloud Widget API not available or iframe not found");
    }
  }

  function setPresetDuration(wordIndex, duration) {
    updateDuration(wordIndex, duration);
  }

  function previewSegment(wordIndex) {
    const iframe = document.getElementById(`widget-${wordIndex}`);
    if (iframe && window.SC && window.SC.Widget) {
      const widget = window.SC.Widget(iframe);
      const widgetKey = `word-${wordIndex}`;
      const timing = widgetTiming[widgetKey];

      if (timing) {
        const startMs = parseTime(timing.startAt) * 1000;
        const durationMs = timing.audioDuration * 1000;

        // Seek to start position and play
        widget.seekTo(startMs);
        widget.play();

        // Stop after duration
        setTimeout(() => {
          widget.pause();
        }, durationMs);
      }
    }
  }

  async function getSoundCloudId(permalinkUrl) {
    try {
      const res = await fetch(
        "https://soundcloud.com/oembed?format=json&url=" +
          encodeURIComponent(permalinkUrl)
      );

      if (!res.ok) {
        throw new Error(`SoundCloud API returned ${res.status}`);
      }

      const data = await res.json();
      const { html } = data;

      // Try multiple patterns to extract track ID from the iframe src
      const patterns = [
        /tracks%2F(\d+)/, // URL-encoded format: tracks%2F123456
        /tracks\/(\d+)/, // Direct format: tracks/123456
        /api\.soundcloud\.com\/(tracks|playlists)\/(\d+)/, // Original format
      ];

      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) {
          const trackId = match[1] || match[2]; // Handle different capture groups
          const type = match[1] === trackId ? "tracks" : match[1] || "tracks";
          return { type: type, id: Number(trackId) };
        }
      }

      console.error(
        "Could not extract track ID from SoundCloud embed HTML:",
        html
      );
      return null;
    } catch (error) {
      console.error("Error fetching SoundCloud ID:", error);
      return null;
    }
  }

  function handleStartCreating() {
    showSplash = false;
    scrollToTop();
  }

  function handleSubmitAnother() {
    // Reset everything and go back to splash
    gridData = Array(10)
      .fill()
      .map(() => Array(12).fill(""));
    showSplash = true;
    showWordForms = false;
    showFinalDetails = false;
    showSuccessScreen = false;
    detectedWords = [];
    soundcloudValidation = {}; // Clear validation state
    widgetTiming = {}; // Clear timing data
    finalDetails = {
      creditName: "",
      boardTitle: "",
      email: "",
      notes: "",
    };
    scrollToTop();
  }

  function handleFinalDetailsClick() {
    if (!validateWordForms()) {
      return; // Don't proceed if validation fails
    }

    showWordForms = false;
    showFinalDetails = true;
    showWarning = false; // Hide any existing warnings
    scrollToTop();
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

  function scrollToTop() {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
</script>

<Navbar
  onHomeClick={navigateToHome}
  onArchivesClick={navigateToArchives}
  onThemedClick={navigateToThemed}
  hideTimer={true}
/>

<main class="min-h-screen flex flex-col text-black dark:text-white">
  <div class="create-container mx-auto px-4 py-8 md:pt-16">
    {#if !showSplash && !showWordForms && !showFinalDetails && !showSuccessScreen}
      <!-- Instructions for Grid Page -->
      <div class="text-center mb-6">
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
          press ENTER to toggle direction while typing.
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          navigate with arrow keys or mouse clicks.
        </p>
      </div>
    {/if}

    {#if showSplash}
      <!-- Splash Screen / Guidelines -->
      <div class="max-w-4xl mx-auto">
        <div class="p-6 mb-6">
          <h2 class="text-2xl font-bold mb-6">
            Create your own crosstune puzzle to be featured!
          </h2>

          <!-- Mobile button - shown early -->
          <div class="text-center mb-6 md:hidden">
            <button
              class="rounded-xs px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-bold hover:bg-gray-900 dark:hover:bg-gray-300 transition-colors"
              onclick={handleStartCreating}
            >
              Start Creating
            </button>
          </div>

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
                >Most tracks played must be "household names." If it's too
                obscure, we can't use it.</span
              >
            </div>

            <div class="flex items-start">
              <span class="font-semibold mr-2">3.</span>
              <span
                >Answers can't float in empty space and must be connected</span
              >
            </div>

            <div class="flex items-start">
              <span class="font-semibold mr-2">4.</span>
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
              <span class="font-semibold mr-2">5.</span>
              <span>Profanity will not be featured on the Daily (usually).</span
              >
            </div>

            <div class="flex items-start">
              <span class="font-semibold mr-2">6.</span>
              <span
                >We occasionally can't get a certain song or play any snippet
                we'd like, so we may need to tweak your puzzle a bit.</span
              >
            </div>
          </div>
        </div>

        <!-- Desktop button - shown at bottom -->
        <div class="text-center mt-6 hidden md:block pb-24">
          <button
            class="rounded-xs px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-bold hover:bg-gray-900 dark:hover:bg-gray-300 transition-colors"
            onclick={handleStartCreating}
          >
            Start Creating
          </button>
        </div>
      </div>
    {:else if !showWordForms && !showFinalDetails && !showSuccessScreen}
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

      <!-- Direction Toggle below grid -->
      <div class="text-center mt-4 mb-4">
        <div class="flex items-center justify-center space-x-4">
          <div class="flex items-center space-x-3">
            <span class="text-sm font-medium text-black dark:text-white"
              >across</span
            >
            <button
              class="relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              class:bg-orange-400={direction === "DOWN"}
              class:bg-gray-300={direction === "ACROSS"}
              class:dark:bg-gray-600={direction === "ACROSS"}
              onclick={toggleDirection}
              aria-label="Toggle direction"
            >
              <span
                class="inline-block w-4 h-4 transform rounded-full transition-transform"
                class:bg-white={direction === "DOWN"}
                class:bg-gray-600={direction === "ACROSS"}
                class:dark:bg-gray-300={direction === "ACROSS"}
                class:translate-x-6={direction === "DOWN"}
                class:translate-x-1={direction === "ACROSS"}
              ></span>
            </button>
            <span class="text-sm font-medium text-black dark:text-white"
              >down</span
            >
          </div>
        </div>
      </div>

      <div class="mt-4 pb-24">
        <div class="flex justify-between items-center max-w-md mx-auto">
          <button
            class="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
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
              scrollToTop();
            }}
          >
            Clear Grid
          </button>

          <div
            class="text-black dark:text-white font-semibold cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center gap-2"
            onclick={handleNextClick}
          >
            clues and songs
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
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          </div>
        </div>
      </div>
    {:else if showWordForms}
      <!-- Word Forms Step -->
      <div class="max-w-5xl mx-auto">
        <div class="mb-8 text-center">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Add Clues & Song Details
          </h2>
          <p class="text-gray-600 dark:text-gray-400">
            Fill in the clue and song information for each word in your puzzle
          </p>
        </div>

        <div class="space-y-8">
          {#each detectedWords as word, index}
            <div
              class="bg-gray-50 dark:bg-[#303030] border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <!-- Word Header -->
              <div
                class="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700"
              >
                <div class="flex items-center space-x-3">
                  <div
                    class="flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm text-white shadow-sm"
                    style="background-color: {gameColors[
                      index % gameColors.length
                    ]}"
                  >
                    {index + 1}
                  </div>
                  <div>
                    <span
                      class="font-bold text-2xl text-gray-900 dark:text-white tracking-wider"
                    >
                      {word.word}
                    </span>
                    <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {word.direction} • Row {word.row + 1}, Col {word.col + 1}
                    </div>
                  </div>
                </div>
                <div
                  class="text-sm text-gray-500 dark:text-gray-400 font-medium"
                >
                  {word.word.length} letters
                </div>
              </div>

              <!-- Form Fields -->
              <div class="space-y-6">
                <!-- Clue Field - Full Width -->
                <div>
                  <label
                    for="clue-{index}"
                    class="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3"
                  >
                    <svg
                      class="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                    Clue
                    <span class="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    id="clue-{index}"
                    type="text"
                    required
                    placeholder="Enter your creative clue here..."
                    class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                    bind:value={detectedWords[index].clue}
                  />
                </div>

                <!-- SoundCloud URL Field -->
                <div>
                  <label
                    for="soundcloud-{index}"
                    class="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3"
                  >
                    <svg
                      class="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      ></path>
                    </svg>
                    SoundCloud URL
                    <span class="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    id="soundcloud-{index}"
                    type="url"
                    required
                    placeholder="https://soundcloud.com/artist/track-name"
                    class="w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                    class:border-gray-300={!soundcloudValidation[
                      `word-${index}`
                    ] ||
                      soundcloudValidation[`word-${index}`].status === "empty"}
                    class:dark:border-gray-600={!soundcloudValidation[
                      `word-${index}`
                    ] ||
                      soundcloudValidation[`word-${index}`].status === "empty"}
                    class:border-yellow-400={soundcloudValidation[
                      `word-${index}`
                    ]?.status === "validating"}
                    class:focus:ring-yellow-500={soundcloudValidation[
                      `word-${index}`
                    ]?.status === "validating"}
                    class:border-green-500={soundcloudValidation[
                      `word-${index}`
                    ]?.status === "valid"}
                    class:focus:ring-green-500={soundcloudValidation[
                      `word-${index}`
                    ]?.status === "valid"}
                    class:border-red-500={soundcloudValidation[`word-${index}`]
                      ?.status === "invalid" ||
                      soundcloudValidation[`word-${index}`]?.status === "error"}
                    class:focus:ring-red-500={soundcloudValidation[
                      `word-${index}`
                    ]?.status === "invalid" ||
                      soundcloudValidation[`word-${index}`]?.status === "error"}
                    bind:value={detectedWords[index].soundcloudUrl}
                    oninput={(event) =>
                      debouncedValidation(event.target.value, index)}
                  />

                  <!-- Validation feedback -->
                  {#if soundcloudValidation[`word-${index}`]?.message}
                    <div
                      class="text-xs mt-2 flex items-center gap-1"
                      class:text-yellow-600={soundcloudValidation[
                        `word-${index}`
                      ].status === "validating"}
                      class:text-green-600={soundcloudValidation[
                        `word-${index}`
                      ].status === "valid"}
                      class:text-red-600={soundcloudValidation[`word-${index}`]
                        .status === "invalid" ||
                        soundcloudValidation[`word-${index}`].status ===
                          "error"}
                    >
                      {#if soundcloudValidation[`word-${index}`].status === "validating"}
                        <svg
                          class="w-3 h-3 animate-spin"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          ></path>
                        </svg>
                      {:else if soundcloudValidation[`word-${index}`].status === "valid"}
                        <svg
                          class="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          ></path>
                        </svg>
                      {/if}
                      {soundcloudValidation[`word-${index}`].message}
                    </div>
                  {:else}
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Paste the full SoundCloud URL for the track you want to
                      use
                    </p>
                  {/if}

                  <!-- SoundCloud Widget Area -->
                  <div
                    class="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border"
                  >
                    <h4 class="font-semibold text-sm mb-3">
                      Preview & Set Timing
                    </h4>

                    {#if soundcloudValidation[`word-${index}`]?.trackId}
                      <!-- SoundCloud iframe -->
                      <div class="w-full max-w-md mx-auto mb-4">
                        <iframe
                          id="widget-{index}"
                          class="w-full"
                          height="120"
                          scrolling="no"
                          frameborder="no"
                          allow="autoplay"
                          title="SoundCloud player for {detectedWords[index]
                            .word}"
                          src="https://w.soundcloud.com/player/?visual=false&url=https%3A//api.soundcloud.com/tracks/{soundcloudValidation[
                            `word-${index}`
                          ]
                            .trackId}&show_artwork=false&show_user=false&show_playcount=false&download=false&sharing=false&buying=false&auto_play=false"
                        ></iframe>
                      </div>

                      <!-- Enhanced Timing Controls -->
                      <div class="space-y-4">
                        <!-- Time Controls -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label class="block text-xs font-medium mb-2"
                              >Start Time</label
                            >
                            <div class="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="0:00"
                                class="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700"
                                value={widgetTiming[`word-${index}`]?.startAt ||
                                  "0:00"}
                                oninput={(event) => {
                                  const widgetKey = `word-${index}`;
                                  if (!widgetTiming[widgetKey]) {
                                    widgetTiming[widgetKey] = {
                                      startAt: "0:00",
                                      endAt: "0:06",
                                      audioDuration: 6,
                                    };
                                  }
                                  widgetTiming[widgetKey].startAt =
                                    event.target.value;
                                  // Update end time and duration
                                  const startSeconds = parseTime(
                                    event.target.value
                                  );
                                  const duration =
                                    widgetTiming[widgetKey].audioDuration;
                                  widgetTiming[widgetKey].endAt = formatTime(
                                    startSeconds + duration
                                  );
                                }}
                              />
                              <button
                                class="px-3 py-2 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                onclick={() => getCurrentTime(index)}
                              >
                                Use Current
                              </button>
                            </div>
                          </div>

                          <div>
                            <label class="block text-xs font-medium mb-2"
                              >End Time</label
                            >
                            <div class="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="0:06"
                                class="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700"
                                value={widgetTiming[`word-${index}`]?.endAt ||
                                  "0:06"}
                                readonly
                              />
                              <button
                                class="px-3 py-2 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                                onclick={() => setEndPoint(index)}
                              >
                                Set End Point
                              </button>
                            </div>
                          </div>
                        </div>

                        <!-- Duration Controls -->
                        <div>
                          <label class="block text-xs font-medium mb-2"
                            >Duration</label
                          >
                          <div class="flex items-center gap-2 mb-2">
                            <input
                              type="number"
                              min="1"
                              max="30"
                              class="w-20 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700"
                              value={widgetTiming[`word-${index}`]
                                ?.audioDuration || 6}
                              oninput={(event) =>
                                updateDuration(
                                  index,
                                  parseInt(event.target.value) || 6
                                )}
                            />
                            <span class="text-xs text-gray-500">seconds</span>
                            <button
                              class="px-3 py-2 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors ml-2"
                              onclick={() => previewSegment(index)}
                            >
                              ▶ Preview Segment
                            </button>
                          </div>

                          <!-- Quick Duration Presets -->
                          <div class="flex gap-2">
                            <span class="text-xs text-gray-500 self-center"
                              >Quick:</span
                            >
                            {#each [3, 6, 10, 15] as duration}
                              <button
                                class="px-2 py-1 text-xs rounded transition-colors"
                                class:bg-blue-500={widgetTiming[`word-${index}`]
                                  ?.audioDuration === duration}
                                class:text-white={widgetTiming[`word-${index}`]
                                  ?.audioDuration === duration}
                                class:bg-gray-200={widgetTiming[`word-${index}`]
                                  ?.audioDuration !== duration}
                                class:dark:bg-gray-700={widgetTiming[
                                  `word-${index}`
                                ]?.audioDuration !== duration}
                                class:hover:bg-blue-400={widgetTiming[
                                  `word-${index}`
                                ]?.audioDuration !== duration}
                                onclick={() =>
                                  setPresetDuration(index, duration)}
                              >
                                {duration}s
                              </button>
                            {/each}
                          </div>
                        </div>

                        <div
                          class="text-xs text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded"
                        >
                          <strong>💡 Tips:</strong> Play the track above, navigate
                          to your desired start point, then click "Use Current".
                          Navigate to the end point and click "Set End Point", or
                          use the duration presets for quick selection.
                        </div>
                      </div>
                    {:else}
                      <!-- Placeholder -->
                      <div class="w-full max-w-md mx-auto mb-4">
                        <div
                          class="w-full h-[120px] bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600"
                        >
                          <div
                            class="text-center text-gray-500 dark:text-gray-400"
                          >
                            <svg
                              class="w-8 h-8 mx-auto mb-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                              ></path>
                            </svg>
                            <p class="text-sm">
                              SoundCloud player will appear here
                            </p>
                            <p class="text-xs">
                              Enter a valid SoundCloud URL above
                            </p>
                          </div>
                        </div>
                      </div>

                      <!-- Disabled Timing Controls -->
                      <div
                        class="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50"
                      >
                        <div>
                          <label class="block text-xs font-medium mb-2"
                            >Start Time</label
                          >
                          <div class="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="0:00"
                              disabled
                              class="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                              value="0:00"
                            />
                            <button
                              disabled
                              class="px-3 py-2 text-xs bg-gray-400 text-white rounded cursor-not-allowed"
                            >
                              Use Current
                            </button>
                          </div>
                        </div>

                        <div>
                          <label class="block text-xs font-medium mb-2"
                            >Duration (seconds)</label
                          >
                          <input
                            type="number"
                            disabled
                            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                            value="6"
                          />
                        </div>
                      </div>

                      <div
                        class="mt-3 text-xs text-gray-500 dark:text-gray-500"
                      >
                        Timing controls will be enabled once a valid SoundCloud
                        URL is provided.
                      </div>
                    {/if}
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>

        <div
          class="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-6 mt-12 pt-8 pb-24 border-t border-gray-200 dark:border-gray-700"
        >
          <button
            class="w-full sm:w-auto px-8 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-[#404040] text-gray-700 dark:text-gray-300 font-semibold transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
            onclick={() => {
              showWordForms = false;
              scrollToTop();
            }}
          >
            ← Back to Grid
          </button>
          <button
            class="w-full sm:w-auto rounded-xs px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-bold hover:bg-gray-900 dark:hover:bg-gray-300 transition-colors"
            onclick={handleFinalDetailsClick}
          >
            Continue to Final Details →
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
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-[#303030]"
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
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-[#303030]"
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
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-[#303030]"
              bind:value={finalDetails.email}
              placeholder="your.email@example.com (optional)"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">
              Any other notes for us?
            </label>
            <textarea
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-[#303030] h-24 resize-vertical"
              bind:value={finalDetails.notes}
              placeholder="Any additional notes or comments (optional)"
            ></textarea>
          </div>
        </div>

        <div class="flex justify-center space-x-4 mt-8 pb-24">
          <button
            class="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-[#404040] transition-colors"
            onclick={() => {
              showFinalDetails = false;
              showWordForms = true;
              scrollToTop();
            }}
          >
            Back to Clues
          </button>
          <button
            class="rounded-xs px-6 py-2 bg-black dark:bg-white text-white dark:text-black font-bold hover:bg-gray-900 dark:hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onclick={async (event) => {
              const button = event.target;
              button.disabled = true;
              button.textContent = "Processing...";

              try {
                // Use pre-validated track IDs and timing data
                const wordsWithTrackIds = detectedWords.map((word, index) => {
                  const validationKey = `word-${index}`;
                  const validation = soundcloudValidation[validationKey];
                  const timing = widgetTiming[validationKey] || {
                    startAt: "0:00",
                    audioDuration: 6,
                  };

                  return {
                    ...word,
                    trackId: validation.trackId,
                    startAt: timing.startAt,
                    audioDuration: timing.audioDuration,
                  };
                });

                const response = await fetch("/api/submit-puzzle", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    grid: gridData,
                    words: wordsWithTrackIds,
                    details: finalDetails,
                  }),
                });

                if (response.ok) {
                  const result = await response.json();
                  showFinalDetails = false;
                  showSuccessScreen = true;
                  scrollToTop();
                } else {
                  wordCountWarning =
                    "Failed to submit puzzle. Please try again.";
                  showWarning = true;
                  button.disabled = false;
                  button.textContent = "Submit Puzzle";
                }
              } catch (error) {
                console.error("Submission error:", error);
                wordCountWarning =
                  "Error submitting puzzle. Please check your connection and try again.";
                showWarning = true;
                button.disabled = false;
                button.textContent = "Submit Puzzle";
              }
            }}
          >
            Submit Puzzle
          </button>
        </div>
      </div>
    {:else if showSuccessScreen}
      <!-- Success Screen -->
      <div class="max-w-2xl mx-auto text-center">
        <div class="p-8 pb-24">
          <h2 class="text-3xl font-bold mb-6">Thanks for your submission!</h2>
          <p class="text-lg mb-8">We'll check out your puzzle asap!</p>

          <p class="text-lg mb-8">In the meantime...</p>

          <div class="space-y-4">
            <button
              class="w-full rounded-xs px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-bold hover:bg-gray-900 dark:hover:bg-gray-300 transition-colors"
              onclick={handleSubmitAnother}
            >
              SUBMIT ANOTHER ONE
            </button>

            <button
              class="w-full rounded-xs px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-bold hover:bg-gray-900 dark:hover:bg-gray-300 transition-colors"
              onclick={() => (window.location.href = "/")}
            >
              PLAY TODAY'S
            </button>

            <button
              class="w-full bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
              onclick={() => (window.location.href = "/themed")}
            >
              PLAY THEMED PUZZLES
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</main>

<!-- Word Count Warning -->
{#if showWarning}
  <div
    class="fixed top-20 right-4 bg-amber-100 dark:bg-amber-900 border-l-4 border-amber-500 text-amber-800 dark:text-amber-200 px-4 py-3 rounded-lg shadow-lg z-40 max-w-sm"
  >
    <div class="flex items-start justify-between">
      <div class="mr-3">
        <p class="text-sm font-medium">{wordCountWarning}</p>
      </div>
      <button
        onclick={dismissWarning}
        class="flex-shrink-0 p-1 hover:bg-amber-200 dark:hover:bg-amber-800 rounded transition-colors"
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

  /* Mobile-specific styles */
  @media (max-width: 768px) {
    .create-container {
      padding-top: 5rem; /* Increase padding to ensure proper spacing below navbar and instructions */
      margin-top: 0;
      padding-bottom: 2rem; /* Add bottom padding for better mobile experience */
    }
  }
</style>
