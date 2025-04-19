<script>
  import crosswords from "$lib/data/crosswords.json";
  import ResultOverlay from "./ResultOverlay.svelte";
  import SoundCloudManager from "./SoundCloudManager.svelte";
  import VinylRecord from "./VinylRecord.svelte";
  import MobileControls from "./MobileControls.svelte";

  import {
    getIsCorrect,
    setIsCorrect,
    getSeconds,
    setSeconds,
    resetTimer,
    isWidgetReady,
    markWidgetAsUnavailable,
    isWidgetUnavailable,
    setUnavailableWidgets,
    getUnavailableWidgets,
  } from "$lib/stores/game.svelte.js";

  import { getIsDarkMode } from "$lib/stores/theme.svelte.js";

  import {
    getEastCoastDate,
    loadGridState,
    saveGridState,
    loadTimerState,
    saveTimerState,
    saveRevealedCells,
    loadRevealedCells,
    saveUnavailableWidgets,
    loadUnavailableWidgets,
    markPuzzleAsSolved,
    isPuzzleVersionValid,
  } from "$lib/utils/storage";

  // New props for archive mode
  let {
    puzzle: customPuzzle = null,
    isArchiveMode = false,
    selectedDate = null,
    onSetRevealFunctions = null,
  } = $props();

  let isMobileDevice = $state(false);
  let isDark = $derived(getIsDarkMode());
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();

  let widgetReadyStatus = $state({});

  // State for unavailable widgets notification
  let showUnavailableMessage = $state(false);
  let hasShownUnavailableMessage = $state(false);

  // Update widget status continuously to check for readiness changes
  $effect(() => {
    // Set up an interval to check widget status every 500ms
    const checkInterval = setInterval(() => {
      let changesDetected = false;

      // Check all clues
      [...acrossClues, ...downClues].forEach((clue) => {
        const widgetId = `${clue.startX}:${clue.startY}:${clue.direction}`;
        const isReady = isWidgetReady(widgetId);

        // Only update if there's a change to avoid unnecessary rerenders
        if (widgetReadyStatus[widgetId] !== isReady) {
          widgetReadyStatus[widgetId] = isReady;
          changesDetected = true;
        }
      });

      // If we detect that all widgets are ready, we can clear the interval
      if (
        changesDetected &&
        Object.values(widgetReadyStatus).every((status) => status === true)
      ) {
        clearInterval(checkInterval);
      }
    }, 150);

    // Clean up interval on component destroy
    return () => clearInterval(checkInterval);
  });

  $effect(() => {
    isMobileDevice = window.matchMedia("(max-width: 768px)").matches;

    // Listen for changes in screen size
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const handler = (e) => (isMobileDevice = e.matches);
    mediaQuery.addEventListener("change", handler);

    return () => mediaQuery.removeEventListener("change", handler);
  });

  // Get today's puzzle or fall back to the first available puzzle
  function getTodaysPuzzle() {
    const todayDate = getEastCoastDate();
    const puzzleDates = Object.keys(crosswords);

    // Try to get today's puzzle
    if (crosswords[todayDate]) {
      return crosswords[todayDate];
    }

    // Fall back to first available puzzle
    const firstAvailableDate = puzzleDates.sort()[0];
    return crosswords[firstAvailableDate];
  }

  // Get puzzle - prioritize customPuzzle if provided (for archive mode)
  const puzzle = customPuzzle || getTodaysPuzzle();
  const { size, words } = puzzle;

  let revealedCells = $state(new Set());
  // Create grid and message state
  let grid = $state(
    Array(size.height)
      .fill(null)
      .map(() => Array(size.width).fill(null))
  );

  $effect(() => {
    if (isArchiveMode) {
      // For archive mode, always reset the timer
      resetTimer();
    } else {
      // For daily mode, check if it's a new day or if the puzzle version has changed
      const currentDate = getEastCoastDate();
      const lastPuzzleDateFromStorage = localStorage.getItem(
        "crosstune_last_puzzle_date"
      );

      // If it's a new day or no previous date exists, or if the puzzle version has changed
      if (
        lastPuzzleDateFromStorage !== currentDate ||
        !isPuzzleVersionValid(puzzle.version)
      ) {
        resetTimer();
        saveTimerState(0);
        localStorage.setItem("crosstune_last_puzzle_date", currentDate);

        // Reset grid and revealed cells for a new day
        grid = Array(size.height)
          .fill(null)
          .map(() => Array(size.width).fill(null));

        // Initialize input cells
        for (let y = 0; y < size.height; y++) {
          for (let x = 0; x < size.width; x++) {
            if (isInputCell(x, y)) {
              // If it's a space cell, pre-fill it with a space
              if (spaceCells.has(`${x},${y}`)) {
                grid[y][x] = " ";
              } else {
                grid[y][x] = "";
              }
            }
          }
        }

        // Reset revealed cells
        revealedCells = new Set();

        // Reset unavailable widgets
        setUnavailableWidgets(new Set());

        // Save empty grid state with current version
        saveGridState(grid, puzzle.version);
        saveRevealedCells(revealedCells);
        saveUnavailableWidgets(getUnavailableWidgets());
      } else {
        // Load saved state for the same day
        const savedTimer = loadTimerState();
        if (savedTimer !== null) {
          setSeconds(savedTimer);
        }

        const savedGrid = loadGridState();
        const savedRevealedCells = loadRevealedCells();

        if (savedGrid) {
          grid = savedGrid;
          revealedCells = new Set(savedRevealedCells);
          setUnavailableWidgets(loadUnavailableWidgets());
        }
      }
    }
  });

  $effect(() => {
    if (!isArchiveMode) {
      saveTimerState(getSeconds());
    }
  });

  $effect(() => {
    if (isArchiveMode && selectedDate) {
      resetTimer();
    }
  });
  // Track currently focused cell
  let focusedX = $state(0);
  let focusedY = $state(0);

  // Audio player state
  let currentAudio = $state(null);
  let isPlaying = $state(false);

  // Generate word numbers and organize clues
  let wordNumbers = $state(new Map());
  let currentNumber = 1;

  let acrossClues = $state([]);
  let downClues = $state([]);

  let activeClue = $state(null);
  // Map to track which cells should be spaces
  let spaceCells = $state(new Map());

  // First mark spaces in all words
  words.forEach((word) => {
    [...word.word].forEach((char, index) => {
      if (char === " ") {
        const x =
          word.direction === "across" ? word.startX + index : word.startX;
        const y =
          word.direction === "across" ? word.startY : word.startY + index;
        spaceCells.set(`${x},${y}`, true);
      }
    });
  });

  // Find all starting positions and sort them
  const startPositions = words.map((word) => ({
    x: word.startX,
    y: word.startY,
  }));

  // Remove duplicates and sort by position (top-to-bottom, left-to-right)
  const uniquePositions = Array.from(
    new Set(startPositions.map((pos) => `${pos.x},${pos.y}`))
  )
    .map((pos) => {
      const [x, y] = pos.split(",").map(Number);
      return { x, y };
    })
    .sort((a, b) => {
      if (a.y === b.y) {
        return a.x - b.x;
      }
      return a.y - b.y;
    });

  // Assign numbers to positions
  uniquePositions.forEach((pos) => {
    wordNumbers.set(`${pos.x},${pos.y}`, currentNumber++);
  });

  function convertTimestampToMs(timestamp) {
    console.log("in here", timestamp);
    const [minutes, seconds] = timestamp.split(":").map(Number);
    console.log("output", (minutes * 60 + seconds) * 1000);
    return (minutes * 60 + seconds) * 1000;
  }

  // Now process the words with the new numbering
  words.forEach((word) => {
    const key = `${word.startX},${word.startY}`;
    const number = wordNumbers.get(key);

    const clue = {
      number,
      word: word.word,
      audioUrl: word.audioUrl,
      startAt: word.startAt,
      textClue: word.textClue,
      color: word.color,
      startX: word.startX,
      startY: word.startY,
      direction: word.direction,
      length: word.word.length,
    };

    if (word.direction === "across") {
      acrossClues.push(clue);
    } else {
      downClues.push(clue);
    }
  });

  // Sort clues by number
  acrossClues.sort((a, b) => a.number - b.number);
  downClues.sort((a, b) => a.number - b.number);

  function findActiveWord() {
    return words.find((word) => {
      const isCorrectWord = word.direction === currentDirection;
      const isInWordRange =
        word.direction === "across"
          ? focusedY === word.startY &&
            focusedX >= word.startX &&
            focusedX < word.startX + word.word.length
          : focusedX === word.startX &&
            focusedY >= word.startY &&
            focusedY < word.startY + word.word.length;

      return isCorrectWord && isInWordRange;
    });
  }

  function isCellInActiveWord(x, y) {
    const activeWord = findActiveWord();
    if (!activeWord) return false;

    if (activeWord.direction === "across") {
      return (
        y === activeWord.startY &&
        x >= activeWord.startX &&
        x < activeWord.startX + activeWord.word.length
      );
    } else {
      return (
        x === activeWord.startX &&
        y >= activeWord.startY &&
        y < activeWord.startY + activeWord.word.length
      );
    }
  }

  function getWordColorAtCell(x, y) {
    const word = words.find((word) => {
      if (word.direction === "across") {
        return (
          y === word.startY &&
          x >= word.startX &&
          x < word.startX + word.word.length
        );
      } else {
        return (
          x === word.startX &&
          y >= word.startY &&
          y < word.startY + word.word.length
        );
      }
    });
    return word?.color;
  }

  // Function to get the active word's color
  function getActiveWordColor() {
    const activeWord = findActiveWord();
    return activeWord?.color;
  }

  function addAlpha(hexColor, alpha) {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Modified isCellHighlighted function to include color information
  function isCellHighlighted(x, y) {
    if (x === focusedX && y === focusedY) {
      return { type: "focused", color: getActiveWordColor() };
    }
    return isCellInActiveWord(x, y)
      ? { type: "active", color: getActiveWordColor() }
      : false;
  }

  // Helper to check if a cell should be an input cell
  function isInputCell(x, y) {
    return words.some((word) => {
      if (word.direction === "across") {
        return (
          word.startY === y &&
          x >= word.startX &&
          x < word.startX + word.word.length
        );
      } else {
        return (
          word.startX === x &&
          y >= word.startY &&
          y < word.startY + word.word.length
        );
      }
    });
  }

  // Initialize grid cells
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      if (isInputCell(x, y)) {
        // If it's a space cell, pre-fill it with a space
        if (spaceCells.has(`${x},${y}`)) {
          grid[y][x] = " ";
        } else {
          grid[y][x] = "";
        }
      }
    }
  }

  // Add state for direction
  let currentDirection = $state("across");

  $effect(() => {
    if (typeof document !== "undefined") {
      const handleNavigation = (event) => {
        const { startX, startY, direction } = event.detail;
        focusedX = startX;
        focusedY = startY;
        currentDirection = direction;
      };

      document.addEventListener("navigationrequest", handleNavigation);
      return () => {
        document.removeEventListener("navigationrequest", handleNavigation);
      };
    }
  });

  function handleCellClick(x, y) {
    // If clicking the currently focused cell, only toggle direction if it's an intersection
    if (x === focusedX && y === focusedY) {
      // Find words containing this cell
      let acrossWord = words.find(
        (word) =>
          word.direction === "across" &&
          y === word.startY &&
          x >= word.startX &&
          x < word.startX + word.word.length
      );

      let downWord = words.find(
        (word) =>
          word.direction === "down" &&
          x === word.startX &&
          y >= word.startY &&
          y < word.startY + word.word.length
      );

      // Only toggle direction if this is an intersection point
      if (acrossWord && downWord) {
        if (isPlaying) {
          stopAudio();
        }
        currentDirection = currentDirection === "across" ? "down" : "across";
      }
      return;
    }

    const isInCurrentWord = isCellInActiveWord(x, y);

    // Find any words that contain this cell
    let acrossWord = words.find(
      (word) =>
        word.direction === "across" &&
        y === word.startY &&
        x >= word.startX &&
        x < word.startX + word.word.length
    );

    let downWord = words.find(
      (word) =>
        word.direction === "down" &&
        x === word.startX &&
        y >= word.startY &&
        y < word.startY + word.word.length
    );

    if (acrossWord && downWord) {
      if (currentDirection === "across" && downWord) {
        currentDirection = "down";
      } else if (currentDirection === "down" && acrossWord) {
        currentDirection = "across";
      }
    } else if (acrossWord) {
      currentDirection = "across";
    } else if (downWord) {
      currentDirection = "down";
    }

    focusedX = x;
    focusedY = y;

    if (!isInCurrentWord && isPlaying) {
      stopAudio();
    }
  }

  function findNextWordStart(currentX, currentY) {
    let startPositions = [...words].sort((a, b) => {
      if (a.startY === b.startY) {
        return a.startX - b.startX;
      }
      return a.startY - b.startY;
    });

    let nextWord = startPositions.find((word) => {
      if (word.startY === currentY) {
        return word.startX > currentX;
      }
      return word.startY > currentY;
    });

    if (!nextWord) {
      nextWord = startPositions[0];
    }

    return {
      x: nextWord.startX,
      y: nextWord.startY,
      direction: nextWord.direction,
    };
  }
  function moveFocus(newX, newY) {
    if (newX < 0 || newY < 0 || newX >= size.width || newY >= size.height) {
      return;
    }

    if (
      grid[newY][newX] !== null &&
      (spaceCells.has(`${newX},${newY}`) || grid[newY][newX] !== "")
    ) {
      if (currentDirection === "across") {
        moveFocus(newX + 1, newY);
      } else {
        moveFocus(newX, newY + 1);
      }
      return;
    }

    // If it's a valid cell, focus it
    if (grid[newY][newX] !== null && !spaceCells.has(`${newX},${newY}`)) {
      focusedX = newX;
      focusedY = newY;
      const input = document.querySelector(
        `input[data-x="${newX}"][data-y="${newY}"]`
      );
      input?.focus();
    }
  }

  // Function to find the clue for the current position
  function findActiveClue() {
    // If we don't have a current direction, default to across
    if (!currentDirection) currentDirection = "across";

    // Find the word at current position
    const word = words.find((word) => {
      if (word.direction !== currentDirection) return false;

      if (word.direction === "across") {
        return (
          focusedY === word.startY &&
          focusedX >= word.startX &&
          focusedX < word.startX + word.word.length
        );
      } else {
        return (
          focusedX === word.startX &&
          focusedY >= word.startY &&
          focusedY < word.startY + word.word.length
        );
      }
    });

    if (!word) return null;

    const number = wordNumbers.get(`${word.startX},${word.startY}`);

    return {
      ...word,
      number,
    };
  }

  $effect(() => {
    activeClue = findActiveClue();
  });

  $effect(() => {
    if (!activeClue) {
      // Find clue #1 (will be in either across or down clues)
      const firstClue = [...acrossClues, ...downClues].find(
        (clue) => clue.number === 1
      );
      if (firstClue) {
        focusedX = firstClue.startX;
        focusedY = firstClue.startY;
        currentDirection = firstClue.direction;
      }
    }
  });

  function findNextWord(currentWord) {
    // Combine all words and sort them by position
    const allWords = [...words].sort((a, b) => {
      if (a.startY === b.startY) {
        return a.startX - b.startX;
      }
      return a.startY - b.startY;
    });

    // Find the index of the current word
    const currentWordIndex = allWords.findIndex(
      (word) =>
        word.startX === currentWord.startX &&
        word.startY === currentWord.startY &&
        word.direction === currentWord.direction
    );

    // Get the next word, or wrap around to the first word
    const nextWord = allWords[(currentWordIndex + 1) % allWords.length];

    return nextWord;
  }

  // Add this function to check if we're at the end of a word
  function isEndOfWord(x, y) {
    const activeWord = findActiveWord();
    if (!activeWord) return false;

    if (activeWord.direction === "across") {
      return (
        x === activeWord.startX + activeWord.word.length - 1 &&
        y === activeWord.startY
      );
    } else {
      return (
        x === activeWord.startX &&
        y === activeWord.startY + activeWord.word.length - 1
      );
    }
  }

  function findNextUnfilledWord(currentX, currentY, currentDirection) {
    // First look through all words to evaluate their fill state
    const wordStates = words.map((word) => {
      const letters = [];
      if (word.direction === "across") {
        for (let x = word.startX; x < word.startX + word.word.length; x++) {
          letters.push(grid[word.startY][x]);
        }
      } else {
        for (let y = word.startY; y < word.startY + word.word.length; y++) {
          letters.push(grid[y][word.startX]);
        }
      }
      return {
        ...word,
        isFilled: letters.every((letter) => letter !== "" && letter !== null),
      };
    });

    // Find current word index
    const currentWordIndex = wordStates.findIndex((word) => {
      const isInWordRange =
        word.direction === currentDirection &&
        (word.direction === "across"
          ? currentY === word.startY &&
            currentX >= word.startX &&
            currentX < word.startX + word.word.length
          : currentX === word.startX &&
            currentY >= word.startY &&
            currentY < word.startY + word.word.length);
      return isInWordRange;
    });

    // Look for next unfilled word, starting after current word
    for (let i = 1; i <= wordStates.length; i++) {
      const index = (currentWordIndex + i) % wordStates.length;
      if (!wordStates[index].isFilled) {
        return wordStates[index];
      }
    }

    // If no unfilled word found, return null
    return null;
  }

  function isWordComplete(word) {
    const letters = [];
    if (word.direction === "across") {
      for (let x = word.startX; x < word.startX + word.word.length; x++) {
        letters.push(grid[word.startY][x]);
      }
    } else {
      for (let y = word.startY; y < word.startY + word.word.length; y++) {
        letters.push(grid[y][word.startX]);
      }
    }
    return letters.every((letter) => letter !== "" && letter !== null);
  }

  // Notify parent component about the reveal functions
  $effect(() => {
    if (onSetRevealFunctions) {
      onSetRevealFunctions({
        revealSquare,
        revealWord,
        revealPuzzle,
      });
    }
  });

  // Function to reveal the currently focused cell
  function revealSquare() {
    if (!getIsCorrect()) {
      const x = focusedX;
      const y = focusedY;
      const cellKey = `${x},${y}`;

      // Get the correct letter from the current word
      const activeWord = findActiveWord();
      if (activeWord) {
        const letterIndex =
          activeWord.direction === "across"
            ? x - activeWord.startX
            : y - activeWord.startY;

        // Only proceed if we have a valid letter index
        if (letterIndex >= 0 && letterIndex < activeWord.word.length) {
          const correctLetter = activeWord.word[letterIndex];

          // Update the grid with the correct letter
          grid[y][x] = correctLetter;

          // Mark this cell as revealed (prevent editing)
          revealedCells = new Set([...revealedCells, cellKey]);
          console.log("Revealed cells:", [...revealedCells]);

          // Save grid state if not in archive mode
          if (!isArchiveMode) {
            saveRevealedCells(revealedCells);
            saveGridState(grid, puzzle.version);
          }
        }
      }
    }
  }

  // Function to reveal the entire current word
  function revealWord() {
    if (!getIsCorrect()) {
      const activeWord = findActiveWord();
      if (activeWord) {
        for (let i = 0; i < activeWord.word.length; i++) {
          const x =
            activeWord.direction === "across"
              ? activeWord.startX + i
              : activeWord.startX;
          const y =
            activeWord.direction === "down"
              ? activeWord.startY + i
              : activeWord.startY;

          // Skip spaces
          if (activeWord.word[i] === " ") continue;

          // Update grid with correct letter
          grid[y][x] = activeWord.word[i];

          // Mark as revealed
          revealedCells = new Set([...revealedCells, `${x},${y}`]);
        }

        // Save grid state if not in archive mode
        if (!isArchiveMode) {
          saveRevealedCells(revealedCells);
          saveGridState(grid, puzzle.version);
        }
      }
    }
  }

  // Function to reveal the entire puzzle
  function revealPuzzle() {
    if (!getIsCorrect()) {
      // Loop through all words and fill in the correct letters
      for (const word of words) {
        for (let i = 0; i < word.word.length; i++) {
          const x = word.direction === "across" ? word.startX + i : word.startX;
          const y = word.direction === "down" ? word.startY + i : word.startY;

          // Skip spaces
          if (word.word[i] === " ") continue;

          // Update grid with correct letter
          grid[y][x] = word.word[i];

          // Mark as revealed
          revealedCells = new Set([...revealedCells, `${x},${y}`]);
        }
      }

      // Save grid state if not in archive mode
      if (!isArchiveMode) {
        saveRevealedCells(revealedCells);
        saveGridState(grid, puzzle.version);
      }

      // Show the win screen since the puzzle is complete
      setIsCorrect(true);
      finalTime = getSeconds();
      showOverlay = true;
    }
  }

  function handleKeydown(event, x, y) {
    if (revealedCells.has(`${x},${y}`)) {
      // Only allow navigation keys for revealed cells
      console.log("It has the item!");
      if (
        ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Tab"].includes(
          event.key
        )
      ) {
        // Handle navigation as normal
        console.log("continue as normal");
      } else {
        // Prevent modification of revealed cells
        console.log("abandon ship");
        event.preventDefault();
        return;
      }
    }
    if (spaceCells.has(`${x},${y}`)) {
      event.preventDefault();
      return;
    }

    const input = event.target;
    const key = event.key || event; // Handle both Event objects and direct key strings

    // Create a function to update grid state that works for both input methods
    function updateGridCell(x, y, value) {
      grid[y][x] = value;
      // Only save grid state if not in archive mode
      if (!isArchiveMode) {
        saveRevealedCells(revealedCells);
        saveGridState(grid, puzzle.version);
      }
    }

    let nextWord = findNextUnfilledWord(x, y, currentDirection);

    switch (event.key) {
      case "Enter":
      case "Tab":
        event.preventDefault();
        if (nextWord) {
          if (isPlaying) {
            stopAudio();
          }
          focusedX = nextWord.startX;
          focusedY = nextWord.startY;
          currentDirection = nextWord.direction;
          const nextInput = document.querySelector(
            `input[data-x="${nextWord.startX}"][data-y="${nextWord.startY}"]`
          );
          nextInput?.focus();
        }
        break;
      case "ArrowRight":
        event.preventDefault();
        currentDirection = "across";
        moveFocus(x + 1, y);
        break;
      case "ArrowLeft":
        event.preventDefault();
        currentDirection = "across";
        moveFocus(x - 1, y);
        break;
      case "ArrowUp":
        event.preventDefault();
        currentDirection = "down";
        moveFocus(x, y - 1);
        break;
      case "ArrowDown":
        event.preventDefault();
        currentDirection = "down";
        moveFocus(x, y + 1);
        break;
      case " ":
      case "Space":
        event.preventDefault();
        if (activeClue) {
          playClue(activeClue);
        }
        break;
      case "Backspace":
        event.preventDefault();
        // If current cell has content, clear it and stay there
        if (grid[y][x]) {
          grid[y][x] = "";
        }
        // Otherwise move back and clear that cell
        else {
          if (currentDirection === "across") {
            let newX = x - 1;
            while (newX >= 0) {
              // Find the first non-space, non-revealed input cell going backwards
              if (
                grid[y][newX] !== null &&
                !spaceCells.has(`${newX},${y}`) &&
                !revealedCells.has(`${newX},${y}`)
              ) {
                grid[y][newX] = "";
                moveFocus(newX, y);
                break;
              } else if (
                grid[y][newX] !== null &&
                !spaceCells.has(`${newX},${y}`) &&
                revealedCells.has(`${newX},${y}`)
              ) {
                // Skip revealed cells but keep moving backwards
                newX--;
                continue;
              }
              newX--;
            }
          } else {
            let newY = y - 1;
            while (newY >= 0) {
              // Find the first non-space, non-revealed input cell going up
              if (
                grid[newY][x] !== null &&
                !spaceCells.has(`${x},${newY}`) &&
                !revealedCells.has(`${x},${newY}`)
              ) {
                grid[newY][x] = "";
                moveFocus(x, newY);
                break;
              } else if (
                grid[newY][x] !== null &&
                !spaceCells.has(`${x},${newY}`) &&
                revealedCells.has(`${x},${newY}`)
              ) {
                // Skip revealed cells but keep moving upwards
                newY--;
                continue;
              }
              newY--;
            }
          }
        }
        if (!isArchiveMode) {
          saveRevealedCells(revealedCells);
          saveGridState(grid, puzzle.version);
        }
        break;
      default:
        // Accept letters, numbers, and special characters that fit in one grid cell
        if (event.key.length === 1) {
          const char = event.key.toUpperCase();
          updateGridCell(x, y, char);
          if (input?.value !== undefined) {
            input.value = char;
          }
          grid[y][x] = char;
          input.value = char;

          requestAnimationFrame(() => {
            // Get the current word
            const currentWord = findActiveWord();

            // Helper function to check if word is complete
            function isWordComplete(word) {
              const letters = [];
              if (word.direction === "across") {
                for (
                  let x = word.startX;
                  x < word.startX + word.word.length;
                  x++
                ) {
                  letters.push(grid[word.startY][x]);
                }
              } else {
                for (
                  let y = word.startY;
                  y < word.startY + word.word.length;
                  y++
                ) {
                  letters.push(grid[y][word.startX]);
                }
              }
              return letters.every(
                (letter) => letter !== "" && letter !== null
              );
            }

            // Check if the current word is now complete
            if (currentWord && isWordComplete(currentWord)) {
              // Find and move to the next word
              const nextWord = findNextWord(currentWord);
              if (isPlaying) {
                stopAudio();
              }
              focusedX = nextWord.startX;
              focusedY = nextWord.startY;
              currentDirection = nextWord.direction;

              // Focus the input at the new position
              const nextInput = document.querySelector(
                `input[data-x="${nextWord.startX}"][data-y="${nextWord.startY}"]`
              );
              nextInput?.focus();
            } else {
              // Regular movement within the word
              if (currentDirection === "across") {
                moveFocus(x + 1, y);
              } else {
                moveFocus(x, y + 1);
              }
            }
          });
        }
    }
  }

  function checkWord(word) {
    const letters = [];
    if (word.direction === "across") {
      for (let x = word.startX; x < word.startX + word.word.length; x++) {
        letters.push(grid[word.startY][x]);
      }
    } else {
      for (let y = word.startY; y < word.startY + word.word.length; y++) {
        letters.push(grid[y][word.startX]);
      }
    }
    return letters.join("").toUpperCase() === word.word;
  }

  // Add new function to handle virtual keyboard input
  function handleVirtualKeyPress(key) {
    // Check if current cell is revealed
    if (revealedCells.has(`${focusedX},${focusedY}`)) {
      // Only allow navigation keys
      if (
        ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Tab"].includes(key)
      ) {
        // Handle navigation as normal
      } else {
        // Prevent modification of revealed cells
        return;
      }
    }
    // For backspace, we need to handle it specially since it's an action rather than a character input
    if (key === "Backspace") {
      // If current cell has content, clear it
      if (grid[focusedY][focusedX]) {
        grid[focusedY][focusedX] = "";
      }
      // Otherwise move back and clear that cell
      else {
        if (currentDirection === "across") {
          let newX = focusedX - 1;
          while (newX >= 0) {
            // Find the first non-space input cell going backwards
            if (
              grid[focusedY][newX] !== null &&
              !spaceCells.has(`${newX},${focusedY}`)
            ) {
              grid[focusedY][newX] = "";
              moveFocus(newX, focusedY);
              break;
            }
            newX--;
          }
        } else {
          let newY = focusedY - 1;
          while (newY >= 0) {
            // Find the first non-space input cell going up
            if (
              grid[newY][focusedX] !== null &&
              !spaceCells.has(`${focusedX},${newY}`)
            ) {
              grid[newY][focusedX] = "";
              moveFocus(focusedX, newY);
              break;
            }
            newY--;
          }
        }
      }
      saveGridState(grid, puzzle.version);
      saveRevealedCells(revealedCells);
      return;
    }

    // Create a synthetic event for other keys
    const syntheticEvent = {
      key,
      preventDefault: () => {},
      target: document.querySelector(
        `input[data-x="${focusedX}"][data-y="${focusedY}"]`
      ),
    };
    handleKeydown(syntheticEvent, focusedX, focusedY);
  }

  let playingClue = $state(null);

  async function playClue(clue) {
    try {
      console.log("made it into this function");
      // First, highlight the word by setting direction and focus
      currentDirection = clue.direction;
      focusedX = clue.startX;
      focusedY = clue.startY;

      const widgetId = `${clue.startX}:${clue.startY}:${clue.direction}`;

      // Prevent playing if the widget is unavailable
      if (isWidgetUnavailable(widgetId)) {
        console.warn(`Attempted to play unavailable widget: ${widgetId}`);
        // Optionally provide user feedback here
        return;
      }

      // Find the iframe for this specific word
      const iframe = document.getElementById(widgetId);

      if (!iframe) {
        console.error(`No SoundCloud widget found for coordinates ${widgetId}`);
        return;
      }
      console.log("got widget");

      // If this clue is already playing, pause it and exit
      if (playingClue === clue && isPlaying && currentAudio) {
        currentAudio.pause();
        isPlaying = false;
        playingClue = null;
        currentAudio = null;
        return;
      }

      // Always stop any currently playing audio before starting a new one
      if (currentAudio) {
        currentAudio.pause();
        // Reset these immediately so UI updates right away
        isPlaying = false;
        playingClue = null;
        currentAudio = null;
      }

      // Set these states for the new audio
      isPlaying = true;
      playingClue = clue;

      const audio = SC.Widget(iframe);
      currentAudio = audio;

      // Create a unique identifier for this play session
      const playSessionId = Date.now();
      audio._playSessionId = playSessionId;

      audio.seekTo(convertTimestampToMs(clue.startAt));
      await audio.play();

      // Detect Safari browser
      const isSafari = /^((?!chrome|android).)*safari/i.test(
        navigator.userAgent
      );

      // Set timeout duration based on browser - 7 seconds for Safari, 6 seconds for others
      const timeoutDuration = isSafari ? 7500 : 6500;
      console.log(
        `Using ${timeoutDuration}ms timeout for audio (${isSafari ? "Safari" : "non-Safari"})`
      );

      setTimeout(() => {
        // Only pause if this is still the current audio AND from the same play session
        if (audio === currentAudio && audio._playSessionId === playSessionId) {
          audio.pause();
          isPlaying = false;
          playingClue = null;
          currentAudio = null;
        }
      }, timeoutDuration);
    } catch (error) {
      console.error("Error playing audio:", error);
      console.error("Audio element error:", currentAudio?.error);
      isPlaying = false;
      playingClue = null;
      currentAudio = null;
    }
  }

  function stopAudio() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    isPlaying = false;
    playingClue = null;
  }

  let showOverlay = $state(false);
  let finalTime = $state(0);
  let hasShownIncorrectMessage = $state(false);

  function handleCloseOverlay() {
    showOverlay = false;
    if (!getIsCorrect()) {
      hasShownIncorrectMessage = true;
    }
  }

  $effect(() => {
    if (!grid) return;

    const hasEmptyCells = grid.some((row, y) =>
      row.some((cell, x) => cell === "" && !spaceCells.has(`${x},${y}`))
    );

    if (!hasEmptyCells) {
      const allCorrect = words.every(checkWord);

      if (allCorrect) {
        setIsCorrect(true);
        finalTime = getSeconds();
        showOverlay = true;
        if (isArchiveMode && selectedDate) {
          markPuzzleAsSolved(selectedDate);
        } else {
          markPuzzleAsSolved(getEastCoastDate());
        }
      } else if (!hasShownIncorrectMessage) {
        setIsCorrect(false);
        showOverlay = true;
      } else {
        setIsCorrect(false);
        showOverlay = false;
      }
    } else {
      setIsCorrect(false);
      showOverlay = false;
    }
  });

  let backgroundImageError = $state(false);

  function handleBackgroundImageError() {
    backgroundImageError = true;
  }

  $effect(() => {
    if (puzzle.backgroundImage) {
      const img = new Image();
      img.onerror = handleBackgroundImageError;
      img.src = puzzle.backgroundImage;
    }
  });

  // Add this function to format the date
  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(`${dateString}T12:00:00-04:00`);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: isArchiveMode ? "numeric" : undefined,
      timeZone: "America/New_York",
    });
  }

  // Get the current date to display
  const displayDate = selectedDate || getEastCoastDate();

  // Effect to handle unavailable widgets
  $effect(() => {
    const unavailable = getUnavailableWidgets();
    if (unavailable.size > 0) {
      let changed = false;
      let newlyRevealedCells = new Set(revealedCells);

      unavailable.forEach((widgetId) => {
        const [startX, startY, direction] = widgetId.split(":");
        const wordToReveal = words.find(
          (w) =>
            w.startX == startX &&
            w.startY == startY &&
            w.direction === direction
        );

        if (wordToReveal) {
          for (let i = 0; i < wordToReveal.word.length; i++) {
            const x =
              direction === "across"
                ? wordToReveal.startX + i
                : parseInt(startX);
            const y =
              direction === "down" ? wordToReveal.startY + i : parseInt(startY);
            const cellKey = `${x},${y}`;

            // Skip spaces and already revealed cells
            if (wordToReveal.word[i] === " " || revealedCells.has(cellKey))
              continue;

            // Update grid with correct letter
            grid[y][x] = wordToReveal.word[i];
            newlyRevealedCells.add(cellKey);
            changed = true;
          }
        }
      });

      if (changed) {
        revealedCells = newlyRevealedCells;
        if (!isArchiveMode) {
          saveRevealedCells(revealedCells);
          saveGridState(grid, puzzle.version);
          saveUnavailableWidgets(unavailable);
        }
        // Show message only once per session if there are unavailable widgets
        if (!hasShownUnavailableMessage) {
          showUnavailableMessage = true;
          hasShownUnavailableMessage = true;
        }
      }
    }
  });
</script>

<SoundCloudManager {words} />

<div class="w-full md:max-w-3xl mx-auto mt-2">
  <!-- Date/title container aligned with crossword -->
  <div
    class="hidden md:block text-left mb-4"
    style="color: {isDark ? 'white' : 'black'}"
  >
    <h1 class="text-xl">
      <span class="font-bold">{formatDate(displayDate)}</span>
      {#if puzzle.title}
        <span> - </span>
        <span class="italic">{puzzle.title}</span>
      {/if}
    </h1>
  </div>

  <div
    class="dark flex flex-col md:flex-row w-full pb-2 pr-2 pl-2 pt-0 mb-1 mt-0"
    style="background-color: {isDark ? '#202020' : '#F3F4F6'}"
  >
    <!-- Crossword grid container -->
    <div class="flex-1 w-full">
      <!-- Grid container -->
      <div
        class="w-full relative"
        style="aspect-ratio: {size.width}/{size.height};"
      >
        <VinylRecord {isPlaying} />

        <!-- Remove the background image and instead use a transparent background -->
        <div
          class="absolute inset-0 grid"
          style="grid-template-columns: repeat({size.width}, minmax(0, 1fr)); gap: 0px;"
        ></div>

        <div
          class="absolute inset-0 grid p-2"
          style="grid-template-columns: repeat({size.width}, minmax(0, 1fr)); gap: 0px;"
        >
          {#each grid as row, y}
            {#each row as cell, x}
              <div
                class="aspect-square flex items-center justify-center relative transition-colors duration-200 z-10"
                style="
                {cell === null
                  ? 'background-color: transparent;'
                  : isCellHighlighted(x, y)?.type === 'focused'
                    ? `background-color: #FFFF00; border: 0.6px solid black;`
                    : isCellHighlighted(x, y)?.type === 'active'
                      ? `background-color: ${isCellHighlighted(x, y).color}; border: 0.6px solid black;`
                      : 'background-color: #FFF; border: 0.6px solid black;'}"
              >
                {#if cell !== null}
                  {#if wordNumbers.has(`${x},${y}`)}
                    <span
                      class="absolute text-[12px] top-0 left-0.5 font-bold z-20 select-none"
                      style="color: {isDark ? 'black' : 'black'};"
                    >
                      {wordNumbers.get(`${x},${y}`)}
                    </span>
                  {/if}
                  {#if spaceCells.has(`${x},${y}`)}
                    <div
                      class="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400"
                    >
                      ␣
                    </div>
                  {:else}
                    <input
                      type="text"
                      maxlength="1"
                      data-x={x}
                      data-y={y}
                      class="w-full h-full text-center uppercase font-bold text-xl focus:outline-none bg-transparent touch-none relative"
                      class:cursor-text={!isMobileDevice}
                      class:revealed={revealedCells.has(`${x},${y}`)}
                      style=""
                      bind:value={grid[y][x]}
                      onkeydown={(e) => handleKeydown(e, x, y)}
                      onclick={() => handleCellClick(x, y)}
                      autocomplete="off"
                      autocorrect="off"
                      autocapitalize="off"
                      spellcheck="false"
                      {...isMobileDevice
                        ? {
                            readonly: true,
                            inputmode: "none",
                            tabindex: "-1",
                          }
                        : {}}
                    />
                    {#if revealedCells.has(`${x},${y}`)}
                      <div class="absolute top-0 right-0 w-3 h-0 md:w-5">
                        <div
                          class="w-0 h-0 border-t-[6px] md:border-t-[10px] border-t-red-500 border-l-[4px] md:border-l-[6px] border-l-red-500 border-b-[4px] md:border-b-[6px] border-b-transparent border-r-[6px] md:border-r-[10px] border-r-transparent transform rotate-90 translate-x-[2px] md:translate-x-[4px] -translate-y-[0px]"
                        ></div>
                      </div>
                    {/if}
                  {/if}
                {/if}
              </div>
            {/each}
          {/each}
        </div>
      </div>
    </div>

    {#if isMobileDevice}
      {#if activeClue}
        <MobileControls
          clue={activeClue}
          onPlay={playClue}
          {isPlaying}
          {playingClue}
          onStopAudio={stopAudio}
          {words}
          onKeyPress={handleVirtualKeyPress}
        />
      {/if}
    {/if}
    {#if !isMobileDevice}
      <!-- Clue list container -->
      <div class="w-full md:w-64 md:mt-0 mt-4">
        <!-- Across Clues -->
        <div>
          <h2
            class="text-xl font-bold mb-2"
            style="color: {isDark ? 'white' : 'black'}"
          >
            Across
          </h2>
          <div class="space-y-1">
            {#each acrossClues as clue}
              <div
                class="flex items-center gap-2 rounded py-1 px-2 transition-colors duration-200 cursor-pointer hover:bg-white/10"
                style="background-color: {activeClue &&
                activeClue.startX === clue.startX &&
                activeClue.startY === clue.startY &&
                activeClue.direction === clue.direction
                  ? isDark
                    ? '#f3f3f3'
                    : 'white'
                  : 'transparent'}"
                onclick={() => {
                  if (isPlaying) stopAudio();
                  const event = new CustomEvent("navigationrequest", {
                    detail: {
                      startX: clue.startX,
                      startY: clue.startY,
                      direction: "across",
                    },
                  });
                  document.dispatchEvent(event);
                }}
              >
                <div
                  class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded"
                  style="background-color: {clue.color};"
                >
                  <span class="font-semibold text-lg">{clue.number}A</span>
                </div>
                <span
                  class="text-md flex-1 ml-2 truncate"
                  style="color: {activeClue &&
                  activeClue.startX === clue.startX &&
                  activeClue.startY === clue.startY &&
                  activeClue.direction === clue.direction
                    ? 'black'
                    : isDark
                      ? 'white'
                      : 'black'}"
                >
                  {clue.textClue}
                </span>
              </div>
            {/each}
          </div>
        </div>

        <!-- Down Clues -->
        <div class="mt-4">
          <h3
            class="text-xl font-bold mb-2"
            style="color: {isDark ? 'white' : 'black'}"
          >
            Down
          </h3>
          <div class="space-y-1">
            {#each downClues as clue}
              <div
                class="flex items-center gap-2 rounded py-1 px-2 transition-colors duration-200 cursor-pointer hover:bg-white/10"
                style="background-color: {activeClue &&
                activeClue.startX === clue.startX &&
                activeClue.startY === clue.startY &&
                activeClue.direction === clue.direction
                  ? isDark
                    ? '#f3f3f3'
                    : 'white'
                  : 'transparent'}"
                onclick={() => {
                  if (isPlaying) stopAudio();
                  const event = new CustomEvent("navigationrequest", {
                    detail: {
                      startX: clue.startX,
                      startY: clue.startY,
                      direction: "down",
                    },
                  });
                  document.dispatchEvent(event);
                }}
              >
                <div
                  class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded"
                  style="background-color: {clue.color};"
                >
                  <span class="font-semibold text-lg">{clue.number}D</span>
                </div>
                <span
                  class="text-md flex-1 ml-2 truncate"
                  style="color: {activeClue &&
                  activeClue.startX === clue.startX &&
                  activeClue.startY === clue.startY &&
                  activeClue.direction === clue.direction
                    ? 'black'
                    : isDark
                      ? 'white'
                      : 'black'}"
                >
                  {clue.textClue}
                </span>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}
  </div>
  {#if !isMobileDevice && activeClue}
    <div class="hidden md:block w-full mx-auto mt-4">
      <div
        class="flex items-center justify-between h-13 rounded-md shadow-lg"
        style="background-color: {isDark ? '#f3f3f3' || 'white' : 'white'}"
      >
        <!-- Left Section with clue info -->
        <div class="flex items-center flex-1 pl-4">
          <div
            class="flex items-center justify-center rounded px-3 py-1"
            style="background-color: {activeClue.color};"
          >
            <span class="text-xl font-semibold">
              {activeClue.number}{activeClue.direction.charAt(0).toUpperCase()}
            </span>
          </div>
          <span class="text-xl text-black ml-3">{activeClue.textClue}</span>
        </div>

        <!-- Right Section with controls -->
        <div class="flex items-center gap-4 pr-4">
          <!-- Skip Previous Button -->
          <button
            class="p-2"
            onclick={() => {
              if (isPlaying) stopAudio();
              const prevClue = findNextWord(activeClue);
              const event = new CustomEvent("navigationrequest", {
                detail: {
                  startX: prevClue.startX,
                  startY: prevClue.startY,
                  direction: prevClue.direction,
                },
              });
              document.dispatchEvent(event);
            }}
            aria-label="Previous clue"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-12 w-12"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M20.24 7.24V16.76L13.41 12L20.24 7.24Z" />
              <rect x="12" y="7.24" width="2" height="9.52" />
            </svg>
          </button>

          <!-- Play/Pause Button -->
          <button
            onclick={() => playClue(activeClue)}
            class="flex items-center justify-center"
            disabled={!widgetReadyStatus[
              `${activeClue.startX}:${activeClue.startY}:${activeClue.direction}`
            ] ||
              isWidgetUnavailable(
                `${activeClue.startX}:${activeClue.startY}:${activeClue.direction}`
              )}
          >
            {#if isPlaying && playingClue === activeClue}
              <!-- Pause icon -->
              <svg
                xmlns="http://www.w3.org/2000/svg"
                enable-background="new 0 0 20 20"
                height="48px"
                viewBox="0 0 20 20"
                width="48px"
                fill="black"
              >
                <g><rect fill="none" height="20" width="20" /></g>
                <g>
                  <path
                    d="M10,2c-4.42,0-8,3.58-8,8s3.58,8,8,8s8-3.58,8-8S14.42,2,10,2z M8.25,13L8.25,13c-0.41,0-0.75-0.34-0.75-0.75v-4.5 C7.5,7.34,7.84,7,8.25,7h0C8.66,7,9,7.34,9,7.75v4.5C9,12.66,8.66,13,8.25,13z M11.75,13L11.75,13C11.34,13,11,12.66,11,12.25v-4.5 C11,7.34,11.34,7,11.75,7h0c0.41,0,0.75,0.34,0.75,0.75v4.5C12.5,12.66,12.16,13,11.75,13z"
                  />
                </g>
              </svg>
            {:else if !widgetReadyStatus[`${activeClue.startX}:${activeClue.startY}:${activeClue.direction}`]}
              <!-- Loading spinner (also shown if unavailable but not ready yet) -->
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48px"
                height="48px"
                viewBox="0 0 24 24"
                fill="none"
                stroke="black"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="animate-spin"
              >
                <circle cx="12" cy="12" r="10" stroke-opacity="0.25" />
                <path
                  d="M12 2C6.47715 2 2 6.47715 2 12C2 12.6343 2.06115 13.2554 2.17856 13.8577"
                />
              </svg>
            {:else if isWidgetUnavailable(`${activeClue.startX}:${activeClue.startY}:${activeClue.direction}`)}
              <!-- Unavailable Icon (e.g., a muted speaker or cross) -->
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="48px"
                viewBox="0 0 24 24"
                width="48px"
                fill="#cccccc"
              >
                <path d="M0 0h24v24H0V0z" fill="none" />
                <path
                  d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"
                />
              </svg>
            {:else}
              <!-- Play icon -->
              <svg
                xmlns="http://www.w3.org/2000/svg"
                enable-background="new 0 0 20 20"
                height="48px"
                viewBox="0 0 20 20"
                width="48px"
                fill="black"
              >
                <g><rect fill="none" height="20" width="20" /></g>
                <g>
                  <path
                    d="M10,2c-4.42,0-8,3.58-8,8s3.58,8,8,8s8-3.58,8-8S14.42,2,10,2z M8,12.59V7.41c0-0.39,0.44-0.63,0.77-0.42l4.07,2.59 c0.31,0.2,0.31,0.65,0,0.84l-4.07,2.59C8.44,13.22,8,12.98,8,12.59z"
                  />
                </g>
              </svg>
            {/if}
          </button>

          <!-- Skip Next Button -->
          <button
            class="p-2"
            onclick={() => {
              if (isPlaying) stopAudio();
              const nextClue = findNextWord(activeClue);
              const event = new CustomEvent("navigationrequest", {
                detail: {
                  startX: nextClue.startX,
                  startY: nextClue.startY,
                  direction: nextClue.direction,
                },
              });
              document.dispatchEvent(event);
            }}
            aria-label="Next clue"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-12 w-12"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M3.76 7.24V16.76L10.59 12L3.76 7.24Z" />
              <rect x="10" y="7.24" width="2" height="9.52" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

{#if showOverlay}
  <ResultOverlay
    time={finalTime}
    isCorrect={getIsCorrect()}
    onClose={handleCloseOverlay}
    {isArchiveMode}
  />
{/if}

{#if showUnavailableMessage}
  <div
    class="fixed bottom-4 right-4 bg-yellow-200 text-yellow-800 p-4 rounded shadow-lg z-50"
  >
    <p>
      Some songs in this puzzle are not available in your region. We've revealed
      these words for you!
    </p>
    <button
      onclick={() => (showUnavailableMessage = false)}
      class="mt-2 text-sm underline">Dismiss</button
    >
  </div>
{/if}

<style>
  /* Add padding at the bottom to prevent the keyboard from covering the grid on mobile */
  @media (max-width: 768px) {
    /* Remove fixed body positioning that might interfere */
    /* :global(body) {
      overflow: hidden;
      position: fixed;
      width: 100%;
      height: 100%;
      /* top: 50px; /* Removed */

    /* Main component wrapper on mobile */
    .dark.flex.flex-col {
      height: 100%; /* Fill parent provided by +page.svelte's flex-1 div */
      display: flex;
      flex-direction: column;
    }

    /* The flex container holding the grid */
    .flex-1.w-full {
      flex: 1 1 auto; /* Grow and shrink to fill available vertical space */
      min-height: 0; /* Allow shrinking within flex column */
      display: flex; /* Center the grid inside */
      align-items: flex-start; /* Align grid to top instead of center */
      justify-content: center;
      overflow: hidden; /* Prevent the grid overflowing this container */
    }

    /* Add constraints for the grid's aspect-ratio wrapper */
    .w-full.relative[style*="aspect-ratio"] {
      max-width: 100%;
      max-height: 100%;
      /* The inline aspect-ratio style combined with max constraints will size it */
    }

    /* Specific adjustments for very small screens */
    @media (max-width: 400px) {
      .w-full.relative[style*="aspect-ratio"] {
        /* Reduce size slightly on smallest screens */
        max-width: 92%; /* Further reduced from 95% */
        max-height: 92%; /* Further reduced from 95% */
      }
    }

    :global(.slide-menu-open) {
      pointer-events: none;
    }
  } /* End of media query */

  .cursor-text {
    cursor: text;
  }

  :global(*) {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }

  :global(input) {
    -webkit-user-select: text;
    user-select: text;
  }

  @supports (-webkit-touch-callout: none) {
    :global(body) {
      touch-action: pan-x pan-y;
    }
  }

  /* Remove the old revealed styles since we're using the triangle flag now */
  input.revealed {
    color: inherit !important;
    font-weight: bold !important;
    font-size: 21px !important;
    font-family: inherit !important;
  }

  .revealed {
    color: inherit !important;
    font-weight: bold !important;
    font-size: inherit !important;
    font-family: inherit !important;
  }
</style>
