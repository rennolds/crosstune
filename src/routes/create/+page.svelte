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
  let showSuccessScreen = $state(false);
  let createdPuzzleId = $state("");
  let shareCopied = $state(false);
  let submittingToUs = $state(false);
  let submitProgress = $state(0);
  let submittedToUs = $state(false);
  let isMobile = $state(false);
  let detectedWords = $state([]);
  let soundcloudValidation = $state({}); // Track validation status for each word
  let widgetTiming = $state({}); // Track start/end times for each word
  import { validateClue, containsProfanity } from "$lib/utils/filters.js";

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

      // Detect mobile for share behavior
      isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
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
    if (wordCount < 1) {
      wordCountWarning = `Add at least 1 word to continue.`;
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

    // Block malicious/offensive words before proceeding
    for (const w of words) {
      if (containsProfanity(w.word)) {
        wordCountWarning = `Word "${w.word}" is not allowed.`;
        showWarning = true;
        return;
      }
    }

    // Merge previously entered data (clues, URLs, validation, timing) when returning from grid
    const previousWords = Array.isArray(detectedWords) ? detectedWords : [];
    const previousValidation = soundcloudValidation || {};
    const previousTiming = widgetTiming || {};

    const makeKey = (w) => `${w.direction}-${w.row}-${w.col}-${w.word}`;

    const previousMap = new Map();
    previousWords.forEach((w, idx) => {
      previousMap.set(makeKey(w), { word: w, index: idx });
    });

    const mergedWords = words.map((w) => {
      const key = makeKey(w);
      if (previousMap.has(key)) {
        const { word: prev } = previousMap.get(key);
        return {
          ...w,
          clue: prev.clue || "",
          soundcloudUrl: prev.soundcloudUrl || "",
        };
      }
      return w;
    });

    // Remap validation/timing by new indices
    const newValidation = {};
    const newTiming = {};
    mergedWords.forEach((w, newIdx) => {
      const key = makeKey(w);
      const prev = previousMap.get(key);
      if (prev) {
        const oldIdx = prev.index;
        const oldVal = previousValidation[`word-${oldIdx}`];
        const oldTime = previousTiming[`word-${oldIdx}`];
        if (oldVal) newValidation[`word-${newIdx}`] = oldVal;
        if (oldTime) newTiming[`word-${newIdx}`] = oldTime;
      }
    });

    detectedWords = mergedWords;
    soundcloudValidation = newValidation;
    widgetTiming = newTiming;

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

      // Clue safety validation
      const clueCheck = validateClue(word.clue);
      if (!clueCheck.valid) {
        const reasons = clueCheck.reasons;
        let msg = `Clue for "${word.word}" is not allowed: `;
        const map = {
          url: "no URLs",
          pii: "no personal contact info",
          profanity: "disallowed language",
          length: "too long (max 150 chars)",
          empty: "cannot be empty",
        };
        msg += reasons.map((r) => map[r] || r).join(", ");
        wordCountWarning = msg;
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

    try {
      // Use server-side validation endpoint to avoid CORS and regional issues
      const response = await fetch("/api/validate-soundcloud", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const result = await response.json();

      if (response.ok && result.status === "valid") {
        // Update the URL if it was normalized by the server
        if (result.normalizedUrl !== url) {
          detectedWords[wordIndex].soundcloudUrl = result.normalizedUrl;
        }

        soundcloudValidation[validationKey] = {
          status: "valid",
          message: result.message || "✓ Track found and ready for timing",
          trackId: result.trackId,
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
        // Handle error responses from server
        soundcloudValidation[validationKey] = {
          status: result.status === "error" ? "error" : "invalid",
          message: result.error || "Could not validate SoundCloud URL",
          trackId: null,
        };
      }
    } catch (error) {
      console.error("Error validating SoundCloud URL:", error);
      soundcloudValidation[validationKey] = {
        status: "error",
        message: "Network error. Please check your connection and try again.",
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
    const secs = seconds % 60;
    const wholeSeconds = Math.floor(secs);
    const decimal = secs - wholeSeconds;

    if (decimal > 0.001) {
      // If there's a meaningful decimal part
      // Format to 1 decimal place, trimming trailing zeros
      const decimalPart = (secs % 1).toFixed(1).substring(1); // Get ".X"
      return `${mins}:${wholeSeconds.toString().padStart(2, "0")}${decimalPart}`;
    }
    return `${mins}:${wholeSeconds.toString().padStart(2, "0")}`;
  }

  function parseTime(timeString) {
    if (!timeString) return 0;
    const parts = timeString.split(":");
    if (parts.length !== 2) return 0;

    const mins = Number(parts[0]) || 0;
    const secsPart = parts[1];
    const secs = Number(secsPart) || 0; // This will handle decimals like "23.5"

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
    // Enforce 30-second maximum limit, allow decimals
    const clampedDuration = Math.min(Math.max(0.1, duration), 30);
    widgetTiming[widgetKey].audioDuration = clampedDuration;

    // Update end time based on start + duration
    const startSeconds = parseTime(widgetTiming[widgetKey].startAt);
    const endSeconds = startSeconds + clampedDuration;
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
        const endSeconds = Math.floor(position / 1000); // Use integer for button-set values
        const widgetKey = `word-${wordIndex}`;

        if (!widgetTiming[widgetKey]) {
          widgetTiming[widgetKey] = {
            startAt: "0:00",
            endAt: "0:06",
            audioDuration: 6,
          };
        }

        const startSeconds = parseTime(widgetTiming[widgetKey].startAt);
        const duration = Math.min(Math.max(0.1, endSeconds - startSeconds), 30); // Minimum 0.1 second, maximum 30 seconds

        widgetTiming[widgetKey].endAt = formatTime(endSeconds);
        widgetTiming[widgetKey].audioDuration = duration;
      });
    } else {
      console.warn("SoundCloud Widget API not available or iframe not found");
    }
  }

  function setPresetDuration(wordIndex, duration) {
    // Enforce 30-second maximum limit for preset durations
    updateDuration(wordIndex, Math.min(duration, 30));
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
    showSuccessScreen = false;
    createdPuzzleId = "";
    shareCopied = false;
    submittingToUs = false;
    submitProgress = 0;
    submittedToUs = false;
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

  function getShareUrl() {
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://crosstune.io";
    return `${origin}/puzzles/${createdPuzzleId}`;
  }

  async function handleShareOrCopy() {
    const url = getShareUrl();
    try {
      if (isMobile && navigator.share) {
        await navigator.share({
          title: "Crosstune Puzzle",
          text: `Try this Crosstune puzzle I made! ${url}`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        shareCopied = true;
        setTimeout(() => (shareCopied = false), 1500);
      }
    } catch (_) {
      try {
        await navigator.clipboard.writeText(url);
        shareCopied = true;
        setTimeout(() => (shareCopied = false), 1500);
      } catch {}
    }
  }

  function playNow() {
    const url = getShareUrl();
    window.open(url, "_blank", "noopener");
  }

  async function handleSubmitToUs() {
    if (!createdPuzzleId || submittedToUs) return;
    // Require at least 8 words for official submission
    if (detectedWords.length < 0) {
      wordCountWarning =
        "Please include at least 8 words before submitting to us.";
      showWarning = true;
      return;
    }
    submittingToUs = true;
    submitProgress = 10;
    let timer = setInterval(() => {
      submitProgress = Math.min(90, submitProgress + 5);
    }, 150);
    try {
      const res = await fetch("/api/submit-existing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: createdPuzzleId,
          creditName: finalDetails.creditName,
          email: finalDetails.email,
          notes: finalDetails.notes,
        }),
      });
      if (!res.ok) throw new Error("Submit failed");
      submitProgress = 100;
      submittedToUs = true;
    } catch (e) {
      wordCountWarning = "Failed to submit. Please try again.";
      showWarning = true;
      submitProgress = 0;
    } finally {
      clearInterval(timer);
      submittingToUs = false;
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
    {#if !showSplash && !showWordForms && !showSuccessScreen}
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
            Create your own Crosstune puzzle!
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

          <div class="space-y-3">
            <p>
              Get a link to share with your friends, fans, or idk, play it
              yourself.
            </p>
            <p>
              If you're proud of it, submit it to us to be featured on the Daily
              or Themed section!
            </p>
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
    {:else if !showWordForms && !showSuccessScreen}
      <!-- Grid Creation Step -->
      <div class="flex justify-center px-2 md:px-0 w-full overflow-x-hidden">
        <div
          class="grid grid-cols-12 gap-px bg-black p-1 md:p-2 rounded-lg w-full md:w-auto overflow-x-hidden"
        >
          {#each gridData as row, rowIndex}
            {#each row as cell, colIndex}
              <div class="relative">
                <input
                  type="text"
                  class="w-full aspect-square md:w-10 md:h-10 text-center text-black font-bold text-sm md:text-lg focus:outline-none bg-white"
                  autocomplete="off"
                  autocapitalize="off"
                  spellcheck="false"
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

          <button
            type="button"
            class="text-black dark:text-white font-semibold hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center gap-2"
            onclick={handleNextClick}
            aria-label="Proceed to clues and songs"
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
          </button>
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
            Write your clues and add audio snippets for each word.
          </p>
          <p class="text-gray-600 dark:text-gray-400">
            All audio must come from <a
              href="https://soundcloud.com"
              class="text-orange-500">SoundCloud</a
            >.
          </p>
        </div>

        <div class="space-y-8">
          {#each detectedWords as word, index}
            <div
              class="bg-gray-50 dark:bg-[#303030] border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
              class:border-green-500={detectedWords[index].clue &&
                detectedWords[index].clue.trim().length > 0}
              class:dark\:border-green-500={detectedWords[index].clue &&
                detectedWords[index].clue.trim().length > 0}
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
                    autocomplete="off"
                    autocapitalize="off"
                    placeholder="Enter your creative clue here..."
                    class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                    maxlength="150"
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
                    autocomplete="off"
                    autocapitalize="off"
                    spellcheck="false"
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
                    class="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border max-w-lg mx-auto"
                  >
                    <h4 class="font-semibold text-sm mb-3">
                      Preview & Set Timing
                    </h4>

                    {#if soundcloudValidation[`word-${index}`]?.trackId}
                      <!-- SoundCloud iframe -->
                      <div class="mb-4 flex justify-center">
                        <iframe
                          id="widget-{index}"
                          class="w-full max-w-md"
                          height="120"
                          scrolling="no"
                          frameborder="no"
                          allow="autoplay"
                          title="SoundCloud player for {detectedWords[index]
                            .word}"
                          src="https://w.soundcloud.com/player/?visual=false&url=https%3A//api.soundcloud.com/tracks/{soundcloudValidation[
                            `word-${index}`
                          ]
                            .trackId}&show_artwork=false&show_user=false&show_playcount=false&show_comments=false&show_reposts=false&hide_related=true&show_teaser=false&download=false&sharing=false&buying=false&auto_play=false"
                        ></iframe>
                      </div>

                      <!-- Enhanced Timing Controls -->
                      <div class="space-y-4">
                        <!-- Time Controls -->
                        <div
                          class="grid grid-cols-1 md:grid-cols-2 gap-4 justify-items-center"
                        >
                          <div>
                            <label class="block text-xs font-medium mb-2"
                              >Start Time</label
                            >
                            <div class="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="0:00"
                                class="w-16 px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-center"
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
                                Set Start Point
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
                                class="w-16 px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-center"
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
                        <div class="flex justify-center">
                          <div>
                            <label
                              class="block text-xs font-medium mb-2 text-center"
                              >Duration (30s max)</label
                            >
                            <div class="flex items-center gap-2 mb-2">
                              <input
                                type="number"
                                min="0.1"
                                max="30"
                                step="0.1"
                                class="w-20 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700"
                                value={widgetTiming[`word-${index}`]
                                  ?.audioDuration || 6}
                                oninput={(event) => {
                                  const value = parseFloat(event.target.value);
                                  if (value > 30) {
                                    event.target.value = 30;
                                  }
                                  updateDuration(
                                    index,
                                    Math.min(
                                      parseFloat(event.target.value) || 6,
                                      30
                                    )
                                  );
                                }}
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
                            <div class="flex gap-2 justify-center">
                              <span class="text-xs text-gray-500 self-center"
                                >Quick:</span
                              >
                              {#each [3, 6, 10, 15] as duration}
                                <button
                                  class="px-2 py-1 text-xs rounded transition-colors"
                                  class:bg-blue-500={widgetTiming[
                                    `word-${index}`
                                  ]?.audioDuration === duration}
                                  class:text-white={widgetTiming[
                                    `word-${index}`
                                  ]?.audioDuration === duration}
                                  class:bg-gray-200={widgetTiming[
                                    `word-${index}`
                                  ]?.audioDuration !== duration}
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
                        </div>

                        {#if index === 0}
                          <div
                            class="text-xs text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded"
                          >
                            <strong>💡 Tips:</strong> Play the track above, navigate
                            to your desired start point, then click "Set Start Point".
                            Navigate to the end point and click "Set End Point",
                            or use the duration presets for quick selection.
                          </div>
                        {/if}
                      </div>
                    {:else}
                      <!-- Placeholder -->
                      <div class="mb-4 flex justify-center">
                        <div
                          class="w-full max-w-md h-[120px] bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600"
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
                      <div class="space-y-4 opacity-50">
                        <!-- Time Controls -->
                        <div
                          class="grid grid-cols-1 md:grid-cols-2 gap-4 justify-items-center"
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
                                class="w-16 px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 cursor-not-allowed text-center"
                                value="0:00"
                              />
                              <button
                                disabled
                                class="px-3 py-2 text-xs bg-gray-400 text-white rounded cursor-not-allowed"
                              >
                                Set Start Point
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
                                disabled
                                class="w-16 px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 cursor-not-allowed text-center"
                                value="0:06"
                              />
                              <button
                                disabled
                                class="px-3 py-2 text-xs bg-gray-400 text-white rounded cursor-not-allowed"
                              >
                                Set End Point
                              </button>
                            </div>
                          </div>
                        </div>

                        <!-- Duration Controls -->
                        <div class="flex justify-center">
                          <div>
                            <label
                              class="block text-xs font-medium mb-2 text-center"
                              >Duration</label
                            >
                            <div class="flex items-center gap-2 mb-2">
                              <input
                                type="number"
                                min="1"
                                max="30"
                                disabled
                                class="w-20 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                                value="6"
                              />
                              <span class="text-xs text-gray-500">seconds</span>
                              <button
                                disabled
                                class="px-3 py-2 text-xs bg-gray-400 text-white rounded cursor-not-allowed ml-2"
                              >
                                ▶ Preview Segment
                              </button>
                            </div>

                            <!-- Quick Duration Presets -->
                            <div class="flex gap-2 justify-center">
                              <span class="text-xs text-gray-500 self-center"
                                >Quick:</span
                              >
                              {#each [3, 6, 10, 15] as duration}
                                <button
                                  disabled
                                  class="px-2 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                                >
                                  {duration}s
                                </button>
                              {/each}
                            </div>
                          </div>
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

        <!-- Title input moved to bottom of clues/songs page -->
        <div class="max-w-2xl mx-auto mt-10">
          <label
            for="board-title"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Title for the board? <span class="text-xs text-gray-500"
              >(optional)</span
            >
          </label>
          <input
            id="board-title"
            type="text"
            autocomplete="off"
            autocapitalize="off"
            class="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            bind:value={finalDetails.boardTitle}
            placeholder="Give your puzzle a title"
            maxlength="100"
          />
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
            onclick={async (event) => {
              if (!validateWordForms()) return;
              const button = event.target;
              button.disabled = true;
              button.textContent = "Processing...";

              try {
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

                const response = await fetch("/api/create-puzzle", {
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
                  createdPuzzleId = result.id;
                  showWordForms = false;
                  showSuccessScreen = true;
                  scrollToTop();
                } else {
                  wordCountWarning =
                    "Failed to create puzzle. Please try again.";
                  showWarning = true;
                  button.disabled = false;
                  button.textContent = "Create & Get Share Link";
                }
              } catch (error) {
                console.error("Create error:", error);
                wordCountWarning =
                  "Error creating puzzle. Please check your connection and try again.";
                showWarning = true;
                button.disabled = false;
                button.textContent = "Create & Get Share Link";
              }
            }}
          >
            Create & Get Share Link
          </button>
        </div>
      </div>
    {:else if showSuccessScreen}
      <!-- Post-Creation Share & Submit Screen -->
      <div class="max-w-3xl mx-auto">
        <div class="p-8 pb-6">
          <h2 class="text-2xl font-bold mb-4">Voilà, here is your creation.</h2>
          <div class="max-w-2xl mx-auto">
            <div
              class="text-xs italic text-gray-600 dark:text-gray-500 text-right mb-1"
            >
              *This link will be live for 30 days
            </div>
            <div
              class="text-sm md:text-base bg-gray-100 dark:bg-[#D9D9D9] px-3 py-2 rounded select-all break-all text-black dark:text-black"
            >
              {typeof window !== "undefined"
                ? getShareUrl()
                : `https://crosstune.io/puzzles/${createdPuzzleId}`}
            </div>
            <div class="mt-2 flex items-center justify-between">
              <button
                class="rounded-xs px-4 py-2 mt-2 bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors"
                onclick={playNow}
              >
                Play Now
              </button>
              <div class="relative flex items-center">
                {#if shareCopied}
                  <div
                    class="absolute right-12 text-xs text-green-600 dark:text-green-400 whitespace-nowrap"
                  >
                    Copied!
                  </div>
                {/if}
                <button
                  class="inline-flex items-center justify-center h-9 w-9 transition-colors text-black dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 align-middle"
                  onclick={handleShareOrCopy}
                  aria-label={isMobile
                    ? "Share"
                    : shareCopied
                      ? "Copied!"
                      : "Copy link"}
                  title={isMobile ? "Share" : "Copy link"}
                >
                  {#if isMobile}
                    <!-- Share icon (provided) -->
                    <svg
                      class="block h-6 w-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M11.293 2.29279C11.4805 2.10532 11.7348 2 12 2C12.2652 2 12.5195 2.10532 12.707 2.29279L15.707 5.29279C15.8892 5.48139 15.99 5.73399 15.9877 5.99619C15.9854 6.25838 15.8802 6.5092 15.6948 6.6946C15.5094 6.88001 15.2586 6.98518 14.9964 6.98746C14.7342 6.98974 14.4816 6.88894 14.293 6.70679L13 5.41379V14.9998C13 15.265 12.8946 15.5194 12.7071 15.7069C12.5196 15.8944 12.2652 15.9998 12 15.9998C11.7348 15.9998 11.4804 15.8944 11.2929 15.7069C11.1054 15.5194 11 15.265 11 14.9998V5.41379L9.707 6.70679C9.5184 6.88894 9.2658 6.98974 9.0036 6.98746C8.7414 6.98518 8.49059 6.88001 8.30518 6.6946C8.11977 6.5092 8.0146 6.25838 8.01233 5.99619C8.01005 5.73399 8.11084 5.48139 8.293 5.29279L11.293 2.29279ZM4 10.9998C4 10.4694 4.21071 9.96065 4.58579 9.58557C4.96086 9.2105 5.46957 8.99979 6 8.99979H8C8.26522 8.99979 8.51957 9.10514 8.70711 9.29268C8.89464 9.48022 9 9.73457 9 9.99979C9 10.265 8.89464 10.5194 8.70711 10.7069C8.51957 10.8944 8.26522 10.9998 8 10.9998H6V19.9998H18V10.9998H16C15.7348 10.9998 15.4804 10.8944 15.2929 10.7069C15.1054 10.5194 15 10.265 15 9.99979C15 9.73457 15.1054 9.48022 15.2929 9.29268C15.4804 9.10514 15.7348 8.99979 16 8.99979H18C18.5304 8.99979 19.0391 9.2105 19.4142 9.58557C19.7893 9.96065 20 10.4694 20 10.9998V19.9998C20 20.5302 19.7893 21.0389 19.4142 21.414C19.0391 21.7891 18.5304 21.9998 18 21.9998H6C5.46957 21.9998 4.96086 21.7891 4.58579 21.414C4.21071 21.0389 4 20.5302 4 19.9998V10.9998Z"
                        fill="currentColor"
                      />
                    </svg>
                  {:else}
                    <!-- Desktop copy icon (provided) -->
                    <svg
                      class="block h-6 w-6"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M15.24 2H11.346C9.582 2 8.184 2 7.091 2.148C5.965 2.3 5.054 2.62 4.336 3.341C3.617 4.062 3.298 4.977 3.147 6.107C3 7.205 3 8.608 3 10.379V16.217C3 17.725 3.92 19.017 5.227 19.559C5.16 18.649 5.16 17.374 5.16 16.312V11.302C5.16 10.021 5.16 8.916 5.278 8.032C5.405 7.084 5.691 6.176 6.425 5.439C7.159 4.702 8.064 4.415 9.008 4.287C9.888 4.169 10.988 4.169 12.265 4.169H15.335C16.611 4.169 17.709 4.169 18.59 4.287C18.3261 3.61329 17.8653 3.03474 17.2678 2.62678C16.6702 2.21883 15.9635 2.00041 15.24 2Z"
                        fill="currentColor"
                      />
                      <path
                        d="M6.59998 11.3968C6.59998 8.67077 6.59998 7.30777 7.44398 6.46077C8.28698 5.61377 9.64398 5.61377 12.36 5.61377H15.24C17.955 5.61377 19.313 5.61377 20.157 6.46077C21.001 7.30777 21 8.67077 21 11.3968V16.2168C21 18.9428 21 20.3058 20.157 21.1528C19.313 21.9998 17.955 21.9998 15.24 21.9998H12.36C9.64498 21.9998 8.28698 21.9998 7.44398 21.1528C6.59998 20.3058 6.59998 18.9428 6.59998 16.2168V11.3968Z"
                        fill="currentColor"
                      />
                    </svg>
                  {/if}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="px-8 mt-6">
          <div
            class="max-w-2xl mx-auto border border-black-200 dark:border-gray-700 rounded-lg p-6"
          >
            <h3 class="text-lg font-bold mb-2 text-center">
              Think your puzzle is great? Send it to us.
            </h3>
            <p
              class="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center"
            >
              Can be featured on The Daily or Themed Section
            </p>
            <!-- Author/Email/Notes moved above submit button -->
            <div class="space-y-4 mb-4">
              <div>
                <label for="credit-name" class="block text-sm font-medium mb-2"
                  >Want a shoutout?</label
                >
                <input
                  id="credit-name"
                  type="text"
                  autocomplete="off"
                  autocapitalize="off"
                  spellcheck="false"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-[#303030]"
                  bind:value={finalDetails.creditName}
                  placeholder="Give us a name or handle (optional)"
                  maxlength="80"
                />
              </div>
              <div>
                <label for="credit-email" class="block text-sm font-medium mb-2"
                  >What's your email?</label
                >
                <input
                  id="credit-email"
                  type="email"
                  autocomplete="off"
                  autocapitalize="off"
                  spellcheck="false"
                  inputmode="email"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-[#303030]"
                  bind:value={finalDetails.email}
                  placeholder="We'll contact you if the puzzle is featured (optional)"
                />
              </div>
              <div>
                <label for="credit-notes" class="block text-sm font-medium mb-2"
                  >Anything else we should know?</label
                >
                <textarea
                  id="credit-notes"
                  autocomplete="off"
                  autocapitalize="off"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-[#303030] h-24 resize-vertical"
                  bind:value={finalDetails.notes}
                  placeholder="Additional info (optional)"
                  maxlength="300"
                ></textarea>
              </div>
            </div>
            <div class="mb-4 flex flex-col items-center">
              <button
                class="rounded-xs px-6 py-2 bg-black dark:bg-white text-white dark:text-black font-bold hover:bg-gray-900 dark:hover:bg-gray-300 transition-colors disabled:cursor-not-allowed"
                disabled={submittingToUs || submittedToUs}
                onclick={handleSubmitToUs}
              >
                {submittedToUs ? "Submitted ✓" : "Submit"}
              </button>

              {#if submittedToUs}
                <!-- Hide bar when complete and show a success line instead (button stays disabled) -->
                <div
                  class="mt-3 text-green-600 dark:text-green-400 text-sm font-semibold"
                >
                  All set!
                </div>
              {:else if submittingToUs || submitProgress > 0}
                <div
                  class="mt-3 h-2 w-full max-w-sm bg-gray-200 dark:bg-gray-700 rounded"
                >
                  <div
                    class="h-2 bg-green-500 rounded transition-all"
                    style={`width: ${submitProgress}%`}
                  ></div>
                </div>
              {/if}
            </div>

            <h4 class="text-sm italic font-semibold mb-2">
              Notes about features
            </h4>
            <div class="space-y-3 text-xs italic">
              <div class="flex items-start">
                <span class="font-semibold mr-2">1.</span>
                <span>Each puzzle must have at least 8 words</span>
              </div>

              <div class="flex items-start">
                <span class="font-semibold mr-2">2.</span>
                <span
                  >Most tracks played must be "household names." If it's too
                  obscure, we can't use it</span
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
                <span
                  >Profanity will not be featured on the Daily (usually)</span
                >
              </div>
            </div>
          </div>
          <div class="pb-24"></div>
        </div>
      </div>
    {/if}
  </div>
</main>

<!-- Word Count Warning -->
{#if showWarning}
  <div
    class="fixed right-4 bg-amber-100 dark:bg-amber-900 border-l-4 border-amber-500 text-amber-800 dark:text-amber-200 px-4 py-3 rounded-lg shadow-lg z-40 max-w-sm"
    class:top-20={!isMobile}
    class:top-32={isMobile}
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
