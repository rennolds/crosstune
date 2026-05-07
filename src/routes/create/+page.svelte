<script>
  import Navbar from "$lib/components/Navbar.svelte";
  import ConfirmationDialog from "$lib/components/ConfirmationDialog.svelte";
  import { getUser, getLoading } from "$lib/stores/auth.svelte.js";
  import { supabase } from "$lib/supabaseClient";
  import { onMount } from "svelte";

  let { data } = $props();

  let editPuzzleId = $state(data.puzzleId || null);

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
  let isMobile = $state(false);
  let detectedWords = $state([]);
  let soundcloudValidation = $state({}); // { status, message, itunesId, previewUrl, title, artist, artworkUrl }
  let widgetTiming = $state({}); // Track start/end times for each word
  let searchQueries = $state({}); // Search text per word
  let searchResults = $state({}); // Search results per word { loading, items, error }
  let isAdminMode = $state(false);
  let jsonInput = $state("");
  let jsonError = $state("");
  let jsonCopied = $state(false);
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
    boardTitle: "",
    creditUser: true,
    submitForReview: false,
  });
  // Hub state (splash screen for returning creators)
  let userPuzzles = $state([]);
  let puzzlesLoading = $state(true);
  let deleteTargetId = $state(null);
  let deleting = $state(false);
  let savedDraftTitle = $state(null); // non-null = there's an in-progress draft to resume

  async function fetchUserPuzzles() {
    const user = getUser();
    if (!user) return;
    puzzlesLoading = true;
    try {
      const { data: rows } = await supabase
        .from('crosstune_puzzles')
        .select('id, puzzle_json, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (rows) {
        userPuzzles = rows.map((row) => {
          let title = '(Untitled)';
          try {
            const json = typeof row.puzzle_json === 'string' ? JSON.parse(row.puzzle_json) : row.puzzle_json;
            title = json.title || '(Untitled)';
          } catch {}
          return { id: row.id, title, created_at: row.created_at, puzzle_json: row.puzzle_json };
        });
      }
    } finally {
      puzzlesLoading = false;
    }
  }

  async function deletePuzzle() {
    if (!deleteTargetId) return;
    deleting = true;
    try {
      const res = await fetch(`/api/puzzles/${deleteTargetId}`, { method: 'DELETE' });
      if (res.ok) {
        userPuzzles = userPuzzles.filter((p) => p.id !== deleteTargetId);
        deleteTargetId = null;
      }
    } finally {
      deleting = false;
    }
  }

  function handleEditPuzzle(puzzle) {
    editPuzzleId = puzzle.id;
    parseJsonAndPopulate(puzzle.puzzle_json);
    showWordForms = false; // land on grid, not word forms
  }

  function handleBackToHub() {
    showSplash = true;
    showWordForms = false;
    editPuzzleId = null;
    // Recheck if there's still draft content to surface the banner correctly
    const hasContent = detectedWords.length > 0 || gridData.some(r => r.some(c => c !== ''));
    if (hasContent && !savedDraftTitle) {
      savedDraftTitle = finalDetails.boardTitle || 'Untitled puzzle';
    }
    scrollToTop();
  }

  function continueDraft() {
    savedDraftTitle = null;
    showSplash = false;
    showWordForms = false; // grid view
    scrollToTop();
  }

  function dismissDraft() {
    localStorage.removeItem(STORAGE_KEY);
    savedDraftTitle = null;
    editPuzzleId = null;
    gridData = Array(10).fill().map(() => Array(12).fill(''));
    detectedWords = [];
    soundcloudValidation = {};
    widgetTiming = {};
    finalDetails = { boardTitle: '', creditUser: true, submitForReview: false };
  }

  function formatPuzzleDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

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

      // Check for admin mode via URL parameter or puzzle ID
      const urlParams = new URLSearchParams(window.location.search);
      isAdminMode = urlParams.get("admin") === "true";
    }
  });

  const STORAGE_KEY = "crosstune_create_puzzle_state";

  $effect(() => {
    if (getLoading()) return; // auth not ready yet
    const user = getUser();
    if (user) {
      fetchUserPuzzles();
    } else {
      puzzlesLoading = false;
    }
  });

  onMount(() => {
    // If puzzle data was loaded from DB via ?id= param, auto-populate
    if (data?.puzzleData) {
      const puzzleJson = JSON.stringify(data.puzzleData);
      parseJsonAndPopulate(puzzleJson);
      showWordForms = false; // land on grid
      return;
    }

    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        gridData = parsed.gridData || gridData;
        detectedWords = parsed.detectedWords || detectedWords;
        soundcloudValidation = parsed.soundcloudValidation || soundcloudValidation;
        widgetTiming = parsed.widgetTiming || widgetTiming;
        if (parsed.finalDetails) {
          finalDetails = {
            boardTitle: parsed.finalDetails.boardTitle || "",
            creditUser: parsed.finalDetails.creditUser ?? true,
            submitForReview: parsed.finalDetails.submitForReview ?? false,
          };
        }
        // Restore edit context
        if (parsed.editPuzzleId) {
          editPuzzleId = parsed.editPuzzleId;
        }
        // Never auto-navigate away from splash — detect draft and let user choose
        const hasContent = parsed.detectedWords?.length > 0 ||
          parsed.gridData?.some(r => r.some(c => c !== ''));
        if (hasContent) {
          savedDraftTitle = parsed.finalDetails?.boardTitle || 'Untitled puzzle';
        }
      } catch (e) {
        console.error("Failed to load puzzle state", e);
      }
    }
  });

  $effect(() => {
    if (typeof localStorage !== "undefined") {
      // Don't save state if we're on the success screen
      if (showSuccessScreen) return;

      const stateToSave = {
        gridData,
        detectedWords,
        soundcloudValidation,
        widgetTiming,
        finalDetails,
        editPuzzleId,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }
  });

  function handleCellClick(row, col) {
    selectedCell = { row, col };
  }

  function handleCellInput(event, row, col) {
    const value = event.target.value.toUpperCase().slice(-1); // Take the last character typed
    event.target.value = value; // Force DOM to show uppercase immediately
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
              song_title: "",
              artist_name: "",
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
          song_title: "",
          artist_name: "",
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
              song_title: "",
              artist_name: "",
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
          song_title: "",
          artist_name: "",
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

  async function handleNextClick() {
    const words = detectWords();

    if (!validateWordCount(words)) {
      return; // Don't proceed if word count is invalid
    }

    // Block malicious/offensive words before proceeding
    for (const w of words) {
      if (await containsProfanity(w.word)) {
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
          song_title: prev.song_title || "",
          artist_name: prev.artist_name || "",
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

  async function validateWordForms() {
    for (let i = 0; i < detectedWords.length; i++) {
      const word = detectedWords[i];
      const validationKey = `word-${i}`;
      const validation = soundcloudValidation[validationKey];

      if (!word.clue.trim()) {
        wordCountWarning = `Please fill in a clue for "${word.word}".`;
        showWarning = true;
        return false;
      }

      // Clue safety validation
      const clueCheck = await validateClue(word.clue);
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

      if (!validation || validation.status !== "valid" || !validation.itunesId) {
        wordCountWarning = `Please select an Apple Music track for "${word.word}".`;
        showWarning = true;
        return false;
      }
    }
    return true;
  }

  async function searchAppleMusic(query, wordIndex) {
    const key = `word-${wordIndex}`;
    if (!query.trim()) {
      searchResults[key] = { loading: false, items: [] };
      return;
    }
    searchResults[key] = { loading: true, items: [] };
    try {
      const resp = await fetch(`/api/search-apple-music?q=${encodeURIComponent(query.trim())}`);
      if (!resp.ok) throw new Error("Search failed");
      const data = await resp.json();
      searchResults[key] = { loading: false, items: data.results || [] };
    } catch (e) {
      searchResults[key] = { loading: false, items: [], error: "Search failed. Try again." };
    }
  }

  function selectTrack(wordIndex, track) {
    const key = `word-${wordIndex}`;
    soundcloudValidation[key] = {
      status: "valid",
      message: `✓ ${track.title} — ${track.artist}`,
      itunesId: track.id,
      previewUrl: track.previewUrl,
      title: track.title,
      artist: track.artist,
      artworkUrl: track.artworkUrl,
    };
    detectedWords[wordIndex].song_title = track.title;
    detectedWords[wordIndex].artist_name = track.artist;
    searchResults[key] = { loading: false, items: [] };
    searchQueries[key] = "";
    if (!widgetTiming[key]) {
      widgetTiming[key] = { startAt: "0:00", endAt: "0:06", audioDuration: 6 };
    }
  }

  let searchTimeouts = {};
  function debouncedSearch(query, wordIndex) {
    const key = `word-${wordIndex}`;
    if (searchTimeouts[key]) clearTimeout(searchTimeouts[key]);
    searchTimeouts[key] = setTimeout(() => searchAppleMusic(query, wordIndex), 400);
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
    const audio = document.getElementById(`audio-${wordIndex}`);
    if (audio) updateStartTime(wordIndex, audio.currentTime);
  }

  function setEndPoint(wordIndex) {
    const audio = document.getElementById(`audio-${wordIndex}`);
    if (!audio) return;
    const widgetKey = `word-${wordIndex}`;
    if (!widgetTiming[widgetKey]) {
      widgetTiming[widgetKey] = { startAt: "0:00", endAt: "0:06", audioDuration: 6 };
    }
    const startSeconds = parseTime(widgetTiming[widgetKey].startAt);
    const duration = Math.min(Math.max(0.1, audio.currentTime - startSeconds), 30);
    widgetTiming[widgetKey].endAt = formatTime(audio.currentTime);
    widgetTiming[widgetKey].audioDuration = duration;
  }

  function setPresetDuration(wordIndex, duration) {
    // Enforce 30-second maximum limit for preset durations
    updateDuration(wordIndex, Math.min(duration, 30));
  }

  function previewSegment(wordIndex) {
    const audio = document.getElementById(`audio-${wordIndex}`);
    const key = `word-${wordIndex}`;
    const timing = widgetTiming[key];
    if (!audio || !timing) return;
    const startSecs = parseTime(timing.startAt);
    audio.currentTime = startSecs + timing.audioDuration <= 30 ? startSecs : 0;
    audio.play();
    setTimeout(() => audio.pause(), timing.audioDuration * 1000);
  }

  function parseJsonAndPopulate(jsonText) {
    try {
      jsonError = "";
      const parsed = JSON.parse(jsonText);

      // Reset the grid
      gridData = Array(10)
        .fill()
        .map(() => Array(12).fill(""));

      // Populate grid from words
      if (!parsed.words || !Array.isArray(parsed.words)) {
        throw new Error("Invalid JSON structure: 'words' array is required");
      }

      const words = [];
      const validation = {};
      const timing = {};

      parsed.words.forEach((word, idx) => {
        const {
          word: wordText,
          startX,
          startY,
          direction,
          textClue,
          audioUrl,
          startAt,
          audioDuration,
          itunesId: jsonItunesId,
          song_title: jsonSongTitle,
          artist_name: jsonArtistName,
        } = word;

        // Populate the grid
        const isAcross = direction.toLowerCase() === "across";
        for (let i = 0; i < wordText.length; i++) {
          const row = isAcross ? startY : startY + i;
          const col = isAcross ? startX + i : startX;
          if (row >= 0 && row < 10 && col >= 0 && col < 12) {
            gridData[row][col] = wordText[i];
          }
        }

        // Prepare word for detectedWords
        words.push({
          word: wordText,
          direction: direction.toUpperCase(),
          row: startY,
          col: startX,
          clue: textClue || "",
          song_title: jsonSongTitle || "",
          artist_name: jsonArtistName || "",
        });

        // Set validation status
        if (jsonItunesId) {
          validation[`word-${idx}`] = {
            status: "valid",
            message: `✓ ${jsonSongTitle || "Track"} — ${jsonArtistName || ""}`,
            itunesId: jsonItunesId,
            title: jsonSongTitle || "",
            artist: jsonArtistName || "",
          };
        } else {
          validation[`word-${idx}`] = {
            status: "legacy",
            message: "Crosstune no longer uses SoundCloud. Search Apple Music to replace this track.",
            itunesId: null,
          };
        }

        // Set timing data
        timing[`word-${idx}`] = {
          startAt: startAt || "0:00",
          endAt: formatTime(
            parseTime(startAt || "0:00") + (audioDuration || 6)
          ),
          audioDuration: audioDuration || 6,
        };
      });

      detectedWords = words;
      soundcloudValidation = validation;
      widgetTiming = timing;

      console.log("detectedWords after JSON parse:", detectedWords);

      // Populate board title if present
      if (parsed.title) {
        finalDetails.boardTitle = parsed.title;
      }

      // Close splash and go to word forms
      showSplash = false;
      showWordForms = true;
      scrollToTop();
    } catch (error) {
      console.error("JSON parse error:", error);
      jsonError = error.message || "Invalid JSON format";
    }
  }

  function handleStartCreating() {
    showSplash = false;
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

  async function handleCreateJSON() {
    if (!(await validateWordForms())) return;

    try {
      const wordsWithTrackIds = detectedWords.map((word, index) => {
        const validationKey = `word-${index}`;
        const validation = soundcloudValidation[validationKey];
        const timing = widgetTiming[validationKey] || {
          startAt: "0:00",
          audioDuration: 6,
        };

        const wordData = {
          word: word.word,
          startX: word.col,
          startY: word.row,
          direction: word.direction.toLowerCase(),
          color: gameColors[index % gameColors.length],
          textClue: word.clue,
          itunesId: validation.itunesId,
          audioUrl: validation.itunesId?.toString() || "",
          startAt: timing.startAt,
          audioDuration: timing.audioDuration,
        };

        if (word.artist_name) wordData.artist_name = word.artist_name;
        if (word.song_title) wordData.song_title = word.song_title;

        return wordData;
      });

      const puzzleJSON = {
        version: "1.0.0",
        title: finalDetails.boardTitle || "Untitled Puzzle",
        theme: "green", // Default theme
        size: {
          width: 12,
          height: 10,
        },
        words: wordsWithTrackIds,
      };

      // Convert to pretty JSON
      const prettyJSON = JSON.stringify(puzzleJSON, null, 2);

      // Copy to clipboard
      await navigator.clipboard.writeText(prettyJSON);
      jsonCopied = true;
      setTimeout(() => (jsonCopied = false), 2000);
    } catch (error) {
      console.error("Error creating JSON:", error);
      wordCountWarning = "Failed to copy JSON to clipboard. Please try again.";
      showWarning = true;
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
        {#if userPuzzles.length > 0 || editPuzzleId}
          <button
            onclick={handleBackToHub}
            class="text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors mb-3 block mx-auto"
          >
            ← Back to your puzzles
          </button>
        {/if}
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
              yourself. All your puzzles will be stored in your profile, forever.
            </p>
            <p>
              If you're proud of it, submit it to us to be featured on the Daily
              or Themed section!
            </p>
          </div>
        </div>

        <!-- Admin-only JSON input section -->
        {#if isAdminMode}
          <div
            class="p-6 mb-6 border-2 border-orange-500 rounded-lg bg-orange-50 dark:bg-orange-900/20"
          >
            <h3
              class="text-lg font-bold mb-4 text-orange-700 dark:text-orange-300"
            >
              🔧 Admin Mode: Load from JSON
            </h3>
            <p class="text-sm mb-4 text-gray-700 dark:text-gray-300">
              Paste a puzzle JSON definition to pre-populate the grid and clues:
            </p>
            <textarea
              class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm h-64 resize-vertical"
              placeholder="Paste puzzle JSON here..."
              bind:value={jsonInput}
            ></textarea>

            {#if jsonError}
              <div
                class="mt-3 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 rounded text-red-700 dark:text-red-300 text-sm"
              >
                <strong>Error:</strong>
                {jsonError}
              </div>
            {/if}

            <div class="mt-4 flex gap-3">
              <button
                class="rounded-xs px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors"
                onclick={() => parseJsonAndPopulate(jsonInput)}
                disabled={!jsonInput.trim()}
              >
                Load from JSON
              </button>
              <button
                class="rounded-xs px-6 py-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold transition-colors"
                onclick={() => {
                  jsonInput = "";
                  jsonError = "";
                }}
              >
                Clear
              </button>
            </div>

            <div
              class="mt-4 pt-4 border-t border-orange-300 dark:border-orange-700"
            >
              <p class="text-xs text-gray-600 dark:text-gray-400 italic">
                Or start from scratch below ↓
              </p>
            </div>
          </div>
        {/if}

        <!-- Desktop button -->
        <div class="text-center mt-6 hidden md:block pb-8">
          <button
            class="rounded-xs px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-bold hover:bg-gray-900 dark:hover:bg-gray-300 transition-colors"
            onclick={handleStartCreating}
          >
            Start Creating
          </button>
        </div>

        <!-- Continue editing card -->
        {#if savedDraftTitle}
          <div class="px-6 pb-6">
            <div class="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow-sm">
              <!-- Mini grid preview -->
              <button onclick={continueDraft} class="flex-shrink-0" aria-label="Continue editing">
                <div class="grid gap-px p-1 rounded bg-gray-100 dark:bg-gray-800" style="grid-template-columns: repeat(12, 5px);">
                  {#each gridData as row}
                    {#each row as cell}
                      <div style="width:5px;height:5px;border-radius:1px;background:{cell ? 'currentColor' : 'transparent'};outline:1px solid #d1d5db;" class="text-black dark:text-white"></div>
                    {/each}
                  {/each}
                </div>
              </button>
              <!-- Label -->
              <button onclick={continueDraft} class="flex-1 text-left min-w-0 group">
                <span class="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">Continue editing</span>
                <span class="font-medium text-black dark:text-white group-hover:text-orange-500 transition-colors">
                  {finalDetails.boardTitle || 'Untitled puzzle'}
                </span>
                {#if detectedWords.length > 0}
                  <span class="text-xs text-gray-400 dark:text-gray-500 block mt-0.5">{detectedWords.length} word{detectedWords.length !== 1 ? 's' : ''}</span>
                {/if}
              </button>
              <!-- Dismiss -->
              <button
                onclick={dismissDraft}
                class="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Dismiss draft"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        {/if}

        <!-- Your Puzzles: only shown for authenticated users who have puzzles -->
        {#if !puzzlesLoading && userPuzzles.length > 0}
          <div class="px-6 pb-16">
            <h3 class="text-lg font-bold mb-3 text-black dark:text-white">Your Puzzles</h3>
            <div class="space-y-2">
              {#each userPuzzles as puzzle}
                <div class="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-black border border-gray-100 dark:border-gray-800 shadow-sm">
                  <a href="/puzzles/{puzzle.id}" class="flex-1 min-w-0 mr-3 group">
                    <span class="font-medium text-black dark:text-white group-hover:text-orange-500 transition-colors block truncate">
                      {puzzle.title}
                    </span>
                    <span class="text-sm text-gray-400 dark:text-gray-500">{formatPuzzleDate(puzzle.created_at)}</span>
                  </a>
                  <div class="flex items-center gap-1 flex-shrink-0">
                    <button
                      onclick={() => handleEditPuzzle(puzzle)}
                      class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                      aria-label="Edit puzzle"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onclick={() => (deleteTargetId = puzzle.id)}
                      class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="Delete puzzle"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

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
              localStorage.removeItem(STORAGE_KEY);
              gridData = Array(10)
                .fill()
                .map(() => Array(12).fill(""));
              showSplash = true;
              showWordForms = false;
              detectedWords = [];
              jsonInput = ""; // Clear admin JSON input
              jsonError = ""; // Clear admin JSON error
              finalDetails = {
                boardTitle: "",
                creditUser: true,
                submitForReview: false,
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
            Audio previews are 30-second clips from Apple Music.
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

                <!-- Apple Music Search Field -->
                <div>
                  <label
                    for="music-search-{index}"
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
                        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                      ></path>
                    </svg>
                    Apple Music Track
                    <span class="text-red-500 ml-1">*</span>
                  </label>

                  {#if soundcloudValidation[`word-${index}`]?.status === "valid"}
                    <!-- Selected track display -->
                    <div
                      class="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg"
                    >
                      <div class="flex items-center gap-3">
                        {#if soundcloudValidation[`word-${index}`].artworkUrl}
                          <img
                            src={soundcloudValidation[`word-${index}`].artworkUrl}
                            alt=""
                            class="w-10 h-10 rounded object-cover flex-shrink-0"
                          />
                        {/if}
                        <div>
                          <p class="text-sm font-semibold text-gray-900 dark:text-white">
                            {soundcloudValidation[`word-${index}`].title}
                          </p>
                          <p class="text-xs text-gray-500 dark:text-gray-400">
                            {soundcloudValidation[`word-${index}`].artist}
                          </p>
                        </div>
                      </div>
                      <button
                        class="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors ml-4 flex-shrink-0"
                        onclick={() => {
                          soundcloudValidation[`word-${index}`] = { status: "empty" };
                          widgetTiming[`word-${index}`] = null;
                        }}
                      >
                        Change
                      </button>
                    </div>
                  {:else if soundcloudValidation[`word-${index}`]?.status === "legacy"}
                    <!-- Legacy SC track - needs replacement -->
                    <div
                      class="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg mb-2"
                    >
                      <p class="text-xs text-amber-700 dark:text-amber-300">
                        Crosstune no longer uses SoundCloud. Search Apple Music to replace this track.
                      </p>
                    </div>
                    <div class="relative">
                      <input
                        id="music-search-{index}"
                        type="text"
                        autocomplete="off"
                        autocapitalize="off"
                        placeholder="Search for a song or artist..."
                        class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                        value={searchQueries[`word-${index}`] ?? ""}
                        oninput={(e) => {
                          searchQueries[`word-${index}`] = e.target.value;
                          debouncedSearch(e.target.value, index);
                        }}
                      />
                      {#if searchResults[`word-${index}`]?.loading}
                        <div class="absolute left-0 right-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg px-3 py-2">
                          <p class="text-xs text-gray-500 dark:text-gray-400">Searching...</p>
                        </div>
                      {:else if searchResults[`word-${index}`]?.items?.length}
                        <div class="absolute left-0 right-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden shadow-lg">
                          {#each searchResults[`word-${index}`].items as track}
                            <button
                              class="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-left border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
                              onclick={() => selectTrack(index, track)}
                            >
                              {#if track.artworkUrl}
                                <img src={track.artworkUrl} alt="" class="w-9 h-9 rounded object-cover flex-shrink-0" />
                              {/if}
                              <div class="min-w-0">
                                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{track.title}</p>
                                <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{track.artist}</p>
                              </div>
                            </button>
                          {/each}
                        </div>
                      {:else if searchResults[`word-${index}`]?.error}
                        <div class="absolute left-0 right-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg px-3 py-2">
                          <p class="text-xs text-red-500">{searchResults[`word-${index}`].error}</p>
                        </div>
                      {/if}
                    </div>
                  {:else}
                    <!-- Empty / search state -->
                    <div class="relative">
                      <input
                        id="music-search-{index}"
                        type="text"
                        autocomplete="off"
                        autocapitalize="off"
                        placeholder="Search for a song or artist..."
                        class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200"
                        value={searchQueries[`word-${index}`] ?? ""}
                        oninput={(e) => {
                          searchQueries[`word-${index}`] = e.target.value;
                          debouncedSearch(e.target.value, index);
                        }}
                      />
                      {#if searchResults[`word-${index}`]?.loading}
                        <div class="absolute left-0 right-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg px-3 py-2">
                          <p class="text-xs text-gray-500 dark:text-gray-400">Searching...</p>
                        </div>
                      {:else if searchResults[`word-${index}`]?.items?.length}
                        <div class="absolute left-0 right-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden shadow-lg">
                          {#each searchResults[`word-${index}`].items as track}
                            <button
                              class="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-left border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
                              onclick={() => selectTrack(index, track)}
                            >
                              {#if track.artworkUrl}
                                <img src={track.artworkUrl} alt="" class="w-9 h-9 rounded object-cover flex-shrink-0" />
                              {/if}
                              <div class="min-w-0">
                                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{track.title}</p>
                                <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{track.artist}</p>
                              </div>
                            </button>
                          {/each}
                        </div>
                      {:else if searchResults[`word-${index}`]?.error}
                        <div class="absolute left-0 right-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg px-3 py-2">
                          <p class="text-xs text-red-500">{searchResults[`word-${index}`].error}</p>
                        </div>
                      {:else if searchQueries[`word-${index}`]?.length > 0}
                        <div class="absolute left-0 right-0 top-full mt-1 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg px-3 py-2">
                          <p class="text-xs text-gray-500 dark:text-gray-400">No results found.</p>
                        </div>
                      {/if}
                    </div>
                  {/if}

                  <!-- Audio Player & Timing Area -->
                  <div class="mt-4 max-w-lg mx-auto rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <!-- Panel header -->
                    <div class="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <span class="text-xs font-semibold uppercase tracking-wider text-gray-400">Preview & Set Timing</span>
                    </div>

                    <div
                      class="px-4 py-4 bg-white dark:bg-gray-900 space-y-4"
                      class:opacity-50={!soundcloudValidation[`word-${index}`]?.previewUrl}
                      class:pointer-events-none={!soundcloudValidation[`word-${index}`]?.previewUrl}
                    >
                      <!-- Audio player in intentional dark zone -->
                      <div class="rounded bg-gray-900 p-2" style="color-scheme: dark">
                        <audio
                          id="audio-{index}"
                          controls
                          controlsList="nodownload noplaybackrate"
                          class="w-full"
                          style="height: 36px;"
                          src={soundcloudValidation[`word-${index}`]?.previewUrl || ""}
                          preload="metadata"
                        ></audio>
                      </div>

                      <!-- Start / End row -->
                      <div class="grid grid-cols-2 gap-3">
                        <div class="space-y-1.5">
                          <span class="text-xs font-medium uppercase tracking-wider text-gray-400">Start</span>
                          <div class="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="0:00"
                              class="w-16 px-2 py-1.5 text-sm font-mono rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center focus:outline-none focus:border-green-500 dark:focus:border-green-500"
                              value={widgetTiming[`word-${index}`]?.startAt || "0:00"}
                              oninput={(event) => {
                                const widgetKey = `word-${index}`;
                                if (!widgetTiming[widgetKey]) {
                                  widgetTiming[widgetKey] = { startAt: "0:00", endAt: "0:06", audioDuration: 6 };
                                }
                                widgetTiming[widgetKey].startAt = event.target.value;
                                const startSeconds = parseTime(event.target.value);
                                widgetTiming[widgetKey].endAt = formatTime(startSeconds + widgetTiming[widgetKey].audioDuration);
                              }}
                            />
                            <button
                              class="px-3 py-1.5 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-green-500 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                              onclick={() => getCurrentTime(index)}
                            >Set</button>
                          </div>
                        </div>
                        <div class="space-y-1.5">
                          <span class="text-xs font-medium uppercase tracking-wider text-gray-400">End</span>
                          <div class="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="0:06"
                              class="w-16 px-2 py-1.5 text-sm font-mono rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 text-center"
                              value={widgetTiming[`word-${index}`]?.endAt || "0:06"}
                              readonly
                            />
                            <button
                              class="px-3 py-1.5 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-green-500 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                              onclick={() => setEndPoint(index)}
                            >Set</button>
                          </div>
                        </div>
                      </div>

                      <!-- Duration chips -->
                      <div class="space-y-1.5">
                        <span class="text-xs font-medium uppercase tracking-wider text-gray-400">Duration</span>
                        <div class="flex items-center gap-2 flex-wrap">
                          {#each [3, 6, 10, 15] as dur}
                            <button
                              class="px-3 py-1.5 text-xs rounded transition-colors"
                              class:bg-green-500={widgetTiming[`word-${index}`]?.audioDuration === dur}
                              class:text-white={widgetTiming[`word-${index}`]?.audioDuration === dur}
                              class:border-transparent={widgetTiming[`word-${index}`]?.audioDuration === dur}
                              class:bg-white={widgetTiming[`word-${index}`]?.audioDuration !== dur}
                              class:dark:bg-gray-800={widgetTiming[`word-${index}`]?.audioDuration !== dur}
                              class:border={widgetTiming[`word-${index}`]?.audioDuration !== dur}
                              class:border-gray-200={widgetTiming[`word-${index}`]?.audioDuration !== dur}
                              class:dark:border-gray-700={widgetTiming[`word-${index}`]?.audioDuration !== dur}
                              class:text-gray-600={widgetTiming[`word-${index}`]?.audioDuration !== dur}
                              class:dark:text-gray-300={widgetTiming[`word-${index}`]?.audioDuration !== dur}
                              onclick={() => setPresetDuration(index, dur)}
                            >{dur}s</button>
                          {/each}
                          <input
                            type="number"
                            min="0.1"
                            max="30"
                            step="0.1"
                            title="Custom duration"
                            class="w-14 px-2 py-1.5 text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center focus:outline-none focus:border-green-500"
                            value={widgetTiming[`word-${index}`]?.audioDuration || 6}
                            oninput={(event) => {
                              if (parseFloat(event.target.value) > 30) event.target.value = 30;
                              updateDuration(index, Math.min(parseFloat(event.target.value) || 6, 30));
                            }}
                          />
                        </div>
                      </div>

                      <!-- Preview action -->
                      <button
                        class="w-full py-2 text-sm font-medium rounded bg-green-500 hover:bg-green-600 text-white transition-colors"
                        onclick={() => previewSegment(index)}
                      >▶ Preview Segment</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>

        <!-- Title input moved to bottom of clues/songs page -->
        <div class="max-w-2xl mx-auto mt-10 space-y-8">
          <div>
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

          <!-- Credit Username Checkbox -->
          <div
            class="bg-gray-50 dark:bg-[#303030] p-4 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <label class="flex items-start cursor-pointer">
              <div class="flex items-center h-5">
                <input
                  type="checkbox"
                  bind:checked={finalDetails.creditUser}
                  class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div class="ml-2 text-sm">
                <span class="font-medium text-gray-900 dark:text-gray-100"
                  >Credit my username</span
                >
                <p class="text-gray-500 dark:text-gray-400 text-xs">
                  Uncheck this if you want this puzzle to be anonymous
                </p>
              </div>
            </label>
          </div>

          <!-- Submit for Feature Checkbox -->
          <div
            class="bg-gray-50 dark:bg-[#303030] p-4 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <label class="flex items-start cursor-pointer">
              <div class="flex items-center h-5">
                <input
                  type="checkbox"
                  bind:checked={finalDetails.submitForReview}
                  class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <div class="ml-2 text-sm">
                <span class="font-medium text-gray-900 dark:text-gray-100"
                  >Submit this puzzle to be featured</span
                >
                <p class="text-gray-500 dark:text-gray-400 text-xs mt-1">
                  By checking this box, you grant Crosstune permission to use
                  your puzzle in the daily, themed, or user sections. We may
                  edit songs or clues for clarity and consistency : )
                </p>
              </div>
            </label>
          </div>
        </div>

        <div
          class="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-6 mt-12 pt-8 pb-24 border-t border-gray-200 dark:border-gray-700"
        >
          {#if userPuzzles.length > 0 || editPuzzleId}
            <button
              class="w-full sm:w-auto px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors font-medium"
              onclick={handleBackToHub}
            >
              ← Back to your puzzles
            </button>
          {/if}
          <button
            class="w-full sm:w-auto px-8 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-[#404040] text-gray-700 dark:text-gray-300 font-semibold transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
            onclick={() => {
              showWordForms = false;
              scrollToTop();
            }}
          >
            ← Back to Grid
          </button>
          {#if isAdminMode}
            <button
              class="w-full sm:w-auto rounded-xs px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors relative"
              onclick={handleCreateJSON}
            >
              Create JSON
              {#if jsonCopied}
                <span
                  class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
                >
                  Copied to clipboard!
                </span>
              {/if}
            </button>
          {/if}
          <button
            class="w-full sm:w-auto rounded-xs px-8 py-3 bg-black dark:bg-white text-white dark:text-black font-bold hover:bg-gray-900 dark:hover:bg-gray-300 transition-colors"
            onclick={async (event) => {
              const user = getUser();

              if (!user) {
                // Save state is handled by effect, just redirect
                window.location.href = "/login?next=/create";
                return;
              }

              if (!(await validateWordForms())) return;
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
                    itunesId: validation.itunesId,
                    startAt: timing.startAt,
                    audioDuration: timing.audioDuration,
                  };
                });

                const apiUrl = editPuzzleId
                  ? `/api/puzzles/${editPuzzleId}`
                  : '/api/create-puzzle';
                const apiMethod = editPuzzleId ? 'PATCH' : 'POST';

                const response = await fetch(apiUrl, {
                  method: apiMethod,
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
                  localStorage.removeItem(STORAGE_KEY);
                  scrollToTop();
                } else {
                  wordCountWarning = editPuzzleId
                    ? "Failed to save changes. Please try again."
                    : "Failed to create puzzle. Please try again.";
                  showWarning = true;
                  button.disabled = false;
                  button.textContent = editPuzzleId ? "Save Changes" : "Create & Get Share Link";
                }
              } catch (error) {
                console.error("Create error:", error);
                wordCountWarning = editPuzzleId
                  ? "Error saving changes. Please check your connection and try again."
                  : "Error creating puzzle. Please check your connection and try again.";
                showWarning = true;
                button.disabled = false;
                button.textContent = editPuzzleId ? "Save Changes" : "Create & Get Share Link";
              }
            }}
          >
            {editPuzzleId ? "Save Changes" : (getUser() ? "Create & Get Share Link" : "Login to Create")}
          </button>
        </div>
      </div>
    {:else if showSuccessScreen}
      <!-- Post-Creation Share & Submit Screen -->
      <div class="max-w-3xl mx-auto">
        <div class="p-8 pb-6">
          <h2 class="text-2xl font-bold mb-4">{editPuzzleId ? 'Your puzzle has been updated.' : 'Voilà, here is your creation.'}</h2>
          <div class="max-w-2xl mx-auto">

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
        <div class="px-8 mt-6 pb-24 text-left">
          <p class="text-gray-600 dark:text-gray-400 mt-2">
            You can view your puzzle on your profile at anytime.
          </p>
          {#if finalDetails.submitForReview}
            <p class="text-gray-600 dark:text-gray-400 mt-2">
              We'll email you if your puzzle is featured!
            </p>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</main>

<ConfirmationDialog
  isOpen={deleteTargetId !== null}
  title="Delete puzzle?"
  message="This will permanently delete the puzzle. Anyone with the share link will no longer be able to play it."
  confirmText={deleting ? "Deleting…" : "Delete"}
  cancelText="Cancel"
  onConfirm={deletePuzzle}
  onCancel={() => (deleteTargetId = null)}
/>

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
