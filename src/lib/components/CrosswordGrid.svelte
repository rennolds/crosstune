<script>
  import crosswords from "$lib/data/crosswords.json";
  import MobileKeyboard from './MobileKeyboard.svelte';
  import MobileClue from './MobileClue.svelte';
  import ResultOverlay from './ResultOverlay.svelte';

  import { 
    getIsCorrect,
    setIsCorrect,
    getSeconds,
    setSeconds
  } from '$lib/stores/game.svelte.js';

  import { 
    loadGridState, 
    saveGridState,
    loadTimerState,
    saveTimerState 
  } from '$lib/utils/storage';

  let isMobileDevice = $state(false);

  $effect(() => {
    isMobileDevice = window.matchMedia('(max-width: 768px)').matches;
    
    // Listen for changes in screen size
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handler = (e) => isMobileDevice = e.matches;
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  });

  // Get today's puzzle

  // Function to get current East Coast date in YYYY-MM-DD format
  function getEastCoastDate() {
    const date = new Date();
    // Convert to Eastern Time (GMT-5)
    const eastCoastDate = new Date(date.toLocaleString('en-US', {
      timeZone: 'America/New_York'
    }));
    
    return eastCoastDate.toISOString().split('T')[0];
  }

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

  // Get puzzle using new function instead of hardcoding date
  const puzzle = getTodaysPuzzle();
  const { size, words } = puzzle;


  // Create grid and message state
  let grid = $state(
    Array(size.height)
      .fill(null)
      .map(() => Array(size.width).fill(null))
  );

  // Load saved state on mount
  $effect(() => {
    const savedGrid = loadGridState();
    if (savedGrid) {
      grid = savedGrid;
    }

    const savedTimer = loadTimerState();
    if (savedTimer) {
      setSeconds(savedTimer);
    }
  });

  // Save grid state whenever it changes
  $effect(() => {
    saveGridState(grid);
  });

  // Save timer state whenever it changes
  $effect(() => {
    saveTimerState(getSeconds());
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

  words.forEach((word) => {
    const key = `${word.startX},${word.startY}`;
    let number;
    if (!wordNumbers.has(key)) {
      number = currentNumber++;
      wordNumbers.set(key, number);
    } else {
      number = wordNumbers.get(key);
    }

    // Mark spaces in the word
    [...word.word].forEach((char, index) => {
      if (char === " ") {
        const x =
          word.direction === "across" ? word.startX + index : word.startX;
        const y =
          word.direction === "across" ? word.startY : word.startY + index;
        spaceCells.set(`${x},${y}`, true);
      }
    });

    const clue = {
      number,
      word: word.word,
      audioUrl: word.audioUrl,
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
    return words.find(word => {
      const isCorrectWord = word.direction === currentDirection;
      const isInWordRange = 
        word.direction === "across" 
          ? (focusedY === word.startY && 
             focusedX >= word.startX && 
             focusedX < word.startX + word.word.length)
          : (focusedX === word.startX && 
             focusedY >= word.startY && 
             focusedY < word.startY + word.word.length);
      
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
    const word = words.find(word => {
      if (word.direction === 'across') {
        return y === word.startY && 
               x >= word.startX && 
               x < word.startX + word.word.length;
      } else {
        return x === word.startX && 
               y >= word.startY && 
               y < word.startY + word.word.length;
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
      return { type: 'focused', color: getActiveWordColor() };
    }
    return isCellInActiveWord(x, y) ? { type: 'active', color: getActiveWordColor() } : false;
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
    if (typeof document !== 'undefined') {
      const handleNavigation = (event) => {
        const { startX, startY, direction } = event.detail;
        focusedX = startX;
        focusedY = startY;
        currentDirection = direction;
      };

      document.addEventListener('navigationrequest', handleNavigation);
      return () => {
        document.removeEventListener('navigationrequest', handleNavigation);
      };
    }
  });

  function handleCellClick(x, y) {
    // If clicking the currently focused cell, toggle direction
    if (x === focusedX && y === focusedY) {
      currentDirection = currentDirection === 'across' ? 'down' : 'across';
      return;
    }

    // Find any words that contain this cell
    let acrossWord = words.find(word => 
      word.direction === 'across' &&
      y === word.startY &&
      x >= word.startX &&
      x < word.startX + word.word.length
    );

    let downWord = words.find(word => 
      word.direction === 'down' &&
      x === word.startX &&
      y >= word.startY &&
      y < word.startY + word.word.length
    );

    if (acrossWord && downWord) {
      if (currentDirection === 'across' && downWord) {
        currentDirection = 'down';
      } else if (currentDirection === 'down' && acrossWord) {
        currentDirection = 'across';
      }
    } 
    else if (acrossWord) {
      currentDirection = 'across';
    }
    else if (downWord) {
      currentDirection = 'down';
    }

    focusedX = x;
    focusedY = y;
  }

  function findNextWordStart(currentX, currentY) {
    let startPositions = [...words].sort((a, b) => {
      if (a.startY === b.startY) {
        return a.startX - b.startX;
      }
      return a.startY - b.startY;
    });

    let nextWord = startPositions.find(word => {
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
      direction: nextWord.direction
    };
  }
    function moveFocus(newX, newY) {
    if (newX < 0 || newY < 0 || newX >= size.width || newY >= size.height) {
      return;
    }

    if (grid[newY][newX] !== null && (spaceCells.has(`${newX},${newY}`) || grid[newY][newX] !== '')) {
      if (currentDirection === 'across') {
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
      const input = document.querySelector(`input[data-x="${newX}"][data-y="${newY}"]`);
      input?.focus();
    }
  }

  // Function to find the clue for the current position
  function findActiveClue() {
    // If we don't have a current direction, default to across
    if (!currentDirection) currentDirection = 'across';
    
    // Find the word at current position
    const word = words.find(word => {
      if (word.direction !== currentDirection) return false;
      
      if (word.direction === 'across') {
        return focusedY === word.startY && 
               focusedX >= word.startX && 
               focusedX < word.startX + word.word.length;
      } else {
        return focusedX === word.startX && 
               focusedY >= word.startY && 
               focusedY < word.startY + word.word.length;
      }
    });

    if (!word) return null;

    const number = wordNumbers.get(`${word.startX},${word.startY}`);
    
    return {
      ...word,
      number
    };
  }

  $effect(() => {
    activeClue = findActiveClue();
  });

  // Initialize with first clue
  $effect(() => {
    if (!activeClue) {
      // Get first across clue
      const firstClue = acrossClues[0];
      if (firstClue) {
        focusedX = firstClue.startX;
        focusedY = firstClue.startY;
        currentDirection = 'across';
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
    const currentIndex = allWords.findIndex(word => 
      word.startX === currentWord.startX && 
      word.startY === currentWord.startY && 
      word.direction === currentWord.direction
    );

  // Get the next word, or wrap around to the first word
    const nextWord = allWords[(currentIndex + 1) % allWords.length];
  
    return nextWord;
}

// Add this function to check if we're at the end of a word
function isEndOfWord(x, y) {
  const activeWord = findActiveWord();
  if (!activeWord) return false;

  if (activeWord.direction === 'across') {
    return x === activeWord.startX + activeWord.word.length - 1 && y === activeWord.startY;
  } else {
    return x === activeWord.startX && y === activeWord.startY + activeWord.word.length - 1;
  }
}

function findNextUnfilledWord(currentX, currentY, currentDirection) {
  // First look through all words to evaluate their fill state
  const wordStates = words.map(word => {
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
      isFilled: letters.every(letter => letter !== '' && letter !== null)
    };
  });

  // Find current word index
  const currentWordIndex = wordStates.findIndex(word => {
    const isInWordRange = word.direction === currentDirection &&
      (word.direction === "across" 
        ? (currentY === word.startY && 
           currentX >= word.startX && 
           currentX < word.startX + word.word.length)
        : (currentX === word.startX && 
           currentY >= word.startY && 
           currentY < word.startY + word.word.length));
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
  return letters.every(letter => letter !== '' && letter !== null);
}

function handleKeydown(event, x, y) {
    if (spaceCells.has(`${x},${y}`)) {
      event.preventDefault();
      return;
    }

    const input = event.target;
    const key = event.key || event; // Handle both Event objects and direct key strings

    // Create a function to update grid state that works for both input methods
    function updateGridCell(x, y, value) {
      grid[y][x] = value;
      saveGridState(grid);
    }

    let nextWord = findNextUnfilledWord(x, y, currentDirection);

    switch (event.key) {
      case 'Enter':
      case 'Tab':
        event.preventDefault();
        if (nextWord) {
          focusedX = nextWord.startX;
          focusedY = nextWord.startY;
          currentDirection = nextWord.direction;
          const nextInput = document.querySelector(
            `input[data-x="${nextWord.startX}"][data-y="${nextWord.startY}"]`
          );
          nextInput?.focus();
        }
        break;
      case 'ArrowRight':
        event.preventDefault();
        currentDirection = 'across';
        moveFocus(x + 1, y);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        currentDirection = 'across';
        moveFocus(x - 1, y);
        break;
      case 'ArrowUp':
        event.preventDefault();
        currentDirection = 'down';
        moveFocus(x, y - 1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        currentDirection = 'down';
        moveFocus(x, y + 1);
        break;
      case ' ':
      case 'Space':
        event.preventDefault();
        if (currentDirection === 'across') {
          moveFocus(x + 1, y);
        } else {
          moveFocus(x, y + 1);
        }
        break;
      case 'Backspace':
        event.preventDefault();
        // If current cell has content, clear it and stay there
        if (grid[y][x]) {
          grid[y][x] = '';
        } 
        // Otherwise move back and clear that cell
        else {
          if (currentDirection === 'across') {
            let newX = x - 1;
            while (newX >= 0) {
              // Find the first non-space input cell going backwards
              if (grid[y][newX] !== null && !spaceCells.has(`${newX},${y}`)) {
                grid[y][newX] = '';
                moveFocus(newX, y);
                break;
              }
              newX--;
            }
          } else {
            let newY = y - 1;
            while (newY >= 0) {
              // Find the first non-space input cell going up
              if (grid[newY][x] !== null && !spaceCells.has(`${x},${newY}`)) {
                grid[newY][x] = '';
                moveFocus(x, newY);
                break;
              }
              newY--;
            }
          }
        }
        saveGridState(grid);
        break;
      default:
        if (event.key.length === 1 && event.key.match(/[a-zA-Z]/i)) {
          const letter = event.key.toUpperCase();
          updateGridCell(x, y, letter);
          if (input?.value !== undefined) {
            input.value = letter;
          }
          grid[y][x] = letter;
          input.value = letter;

          requestAnimationFrame(() => {
            // Get the current word
            const currentWord = findActiveWord();

            // Helper function to check if word is complete
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
              return letters.every(letter => letter !== '' && letter !== null);
            }
            
            // Check if the current word is now complete
            if (currentWord && isWordComplete(currentWord)) {
              // Find and move to the next word
              const nextWord = findNextWord(currentWord);
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
              if (currentDirection === 'across') {
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
    // For backspace, we need to handle it specially since it's an action rather than a character input
    if (key === 'Backspace') {
        // If current cell has content, clear it
        if (grid[focusedY][focusedX]) {
            grid[focusedY][focusedX] = '';
        } 
        // Otherwise move back and clear that cell
        else {
            if (currentDirection === 'across') {
                let newX = focusedX - 1;
                while (newX >= 0) {
                    // Find the first non-space input cell going backwards
                    if (grid[focusedY][newX] !== null && !spaceCells.has(`${newX},${focusedY}`)) {
                        grid[focusedY][newX] = '';
                        moveFocus(newX, focusedY);
                        break;
                    }
                    newX--;
                }
            } else {
                let newY = focusedY - 1;
                while (newY >= 0) {
                    // Find the first non-space input cell going up
                    if (grid[newY][focusedX] !== null && !spaceCells.has(`${focusedX},${newY}`)) {
                        grid[newY][focusedX] = '';
                        moveFocus(focusedX, newY);
                        break;
                    }
                    newY--;
                }
            }
        }
        saveGridState(grid);
        return;
    }

    // Create a synthetic event for other keys
    const syntheticEvent = {
        key,
        preventDefault: () => {},
        target: document.querySelector(`input[data-x="${focusedX}"][data-y="${focusedY}"]`)
    };
    handleKeydown(syntheticEvent, focusedX, focusedY);
  }

  let playingClue = $state(null);
  
  async function playClue(clue) {
    try {
      // First, highlight the word by setting direction and focus
      currentDirection = clue.direction;
      focusedX = clue.startX;
      focusedY = clue.startY;

      // If this clue is already playing, pause it
      if (playingClue === clue && isPlaying && currentAudio) {
        currentAudio.pause();
        isPlaying = false;
        playingClue = null;
        return;
      }

      // Stop any currently playing audio
      if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
      }
      isPlaying = false;
      playingClue = null;

      // Create and play new audio
      const audio = new Audio(clue.audioUrl);
      currentAudio = audio;

      // Wait for audio to load
      await new Promise((resolve, reject) => {
        audio.addEventListener("loadedmetadata", () => {
          resolve();
        });
        audio.addEventListener("error", (e) => {
          reject(e);
        });
      });

      await audio.play();
      isPlaying = true;
      playingClue = clue;

      setTimeout(() => {
        audio.pause();
        isPlaying = false;
        playingClue = null;
        currentAudio = null;
      }, 10000);

      audio.addEventListener("ended", () => {
        isPlaying = false;
        playingClue = null;
        currentAudio = null;
      });
    } catch (error) {
      console.error("Error playing audio:", error);
      console.error("Audio element error:", currentAudio?.error);
      isPlaying = false;
      playingClue = null;
      currentAudio = null;
    }
  }

  let showOverlay = $state(false);
  let finalTime = $state(0);

  function handleCloseOverlay() {
    showOverlay = false;
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
      } else {
        setIsCorrect(false);
        showOverlay = true;
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
</script>

<div class="flex flex-col md:flex-row gap-4 w-full md:max-w-5xl mx-auto pb-2 pr-2 pl-2 pt-0 mb-1 mt-0 h-[calc(100vh-48px-50px-165px)] md:h-auto">
  <!-- Crossword grid container -->
  <div class="flex-1 h-full">
    <!-- Grid container -->
    <div class="w-full relative +++h-full+++"  style="aspect-ratio: {size.width}/{size.height};">
      <div 
      class="absolute inset-0 bg-black"
      style="
        {puzzle.backgroundImage && !backgroundImageError 
          ? `
            background-image: url('${puzzle.backgroundImage}');
            background-size: cover;
            background-position: center;
            background-color: rgba(0, 0, 0, 0.1);
            background-blend-mode: multiply;
          ` 
          : ''
        }
      "
      > </div>
      <div
      class="absolute inset-0 grid p-2"
      style="grid-template-columns: repeat({size.width}, minmax(0, 1fr)); gap: 0px;"
      >
        {#each grid as row, y}
          {#each row as cell, x}
              <div
                class="aspect-square flex items-center justify-center relative transition-colors duration-200"
                style="
                {cell === null 
                    ? 'background-color: transparent;' 
                    : isCellHighlighted(x, y)?.type === 'focused'
                      ? `background-color: ${isCellHighlighted(x, y).color};;`
                      : isCellHighlighted(x, y)?.type === 'active'
                        ? `background-color: ${addAlpha(isCellHighlighted(x, y).color, .75)};`
                        : 'background-color: white;'
                  }
                "
              >
              {#if cell !== null}
                {#if wordNumbers.has(`${x},${y}`)}
                  <span class="absolute text-xs top-0 left-0.5">
                    {wordNumbers.get(`${x},${y}`)}
                  </span>
                {/if}
                {#if spaceCells.has(`${x},${y}`)}
                  <div class="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 border-[.25px] border-black">
                    ␣
                  </div>
                {:else}
                <input
                  type="text"
                  maxlength="1"
                  data-x={x}
                  data-y={y}
                  class="w-full h-full text-center uppercase font-bold text-lg focus:outline-none bg-transparent touch-none border-[.25px] border-black"
                  class:cursor-text={!isMobileDevice}
                  bind:value={grid[y][x]}
                  onkeydown={(e) => handleKeydown(e, x, y)}
                  onclick={() => handleCellClick(x, y)}
                  autocomplete="off"
                  autocorrect="off"
                  autocapitalize="off"
                  spellcheck="false"
                  {...(isMobileDevice ? {
                    readonly: true,
                    inputmode: "none",
                    tabindex: "-1"
                  } : {})}
                />
                {/if}
              {/if}
            </div>
          {/each}
        {/each}
      </div>

    </div>
    <MobileKeyboard onKeyPress={handleVirtualKeyPress} />
  </div>

  

  {#if isMobileDevice}
    <MobileClue clue={activeClue} onPlay={playClue} {isPlaying} playingClue={playingClue}/>
  {:else}
    <!-- Clue list container -->
    <div class="w-full md:w-64">
      <!-- Across Clues -->
      <div>
        <h2 class="text-xl font-bold mb-2">Across</h2>
        <div class="space-y-2">
          {#each acrossClues as clue}
            <div 
              class="flex items-center gap-2 px-2 py-1 rounded"
              style="background-color: {clue.color};"
            >
              <span class="font-medium text-sm">{clue.number}A</span>
              <span class="text-black font-bold ml-2.5">•</span>
              <span class="text-sm flex-1">{clue.textClue}</span>
              <button
                onclick={() => playClue(clue)}
                disabled={isPlaying && playingClue !== clue}
              >
                {#if isPlaying && playingClue === clue}
                  <svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 20 20" height="40px" viewBox="0 0 20 20" width="40px" fill="#000000"><g><rect fill="none" height="20" width="20"/></g><g><path d="M10,2c-4.42,0-8,3.58-8,8s3.58,8,8,8s8-3.58,8-8S14.42,2,10,2z M8.25,13L8.25,13c-0.41,0-0.75-0.34-0.75-0.75v-4.5 C7.5,7.34,7.84,7,8.25,7h0C8.66,7,9,7.34,9,7.75v4.5C9,12.66,8.66,13,8.25,13z M11.75,13L11.75,13C11.34,13,11,12.66,11,12.25v-4.5 C11,7.34,11.34,7,11.75,7h0c0.41,0,0.75,0.34,0.75,0.75v4.5C12.5,12.66,12.16,13,11.75,13z"/></g></svg>  
                {:else}
                  <svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 20 20" height="40px" viewBox="0 0 20 20" width="40px" fill="#000000"><g><rect fill="none" height="20" width="20"/></g><g><path d="M10,2c-4.42,0-8,3.58-8,8s3.58,8,8,8s8-3.58,8-8S14.42,2,10,2z M8,12.59V7.41c0-0.39,0.44-0.63,0.77-0.42l4.07,2.59 c0.31,0.2,0.31,0.65,0,0.84l-4.07,2.59C8.44,13.22,8,12.98,8,12.59z"/></g></svg>
                {/if}
              </button>
            </div>
          {/each}
        </div>
      </div>

      <!-- Down Clues -->
      <div class="mt-4">
        <h2 class="text-xl font-bold mb-2">Down</h2>
        <div class="space-y-2">
          {#each downClues as clue}
            <div 
              class="flex items-center gap-2 px-2 py-1 rounded"
              style="background-color: {clue.color};"
            >
              <span class="font-medium text-sm">{clue.number}D</span>
              <span class="text-black font-bold">•</span>
              <span class="text-sm flex-1">{clue.textClue}</span>
              <button
                onclick={() => playClue(clue)}
                disabled={isPlaying && playingClue !== clue}
              >
                {#if isPlaying && playingClue === clue}
                  <svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 20 20" height="40px" viewBox="0 0 20 20" width="40px" fill="#000000"><g><rect fill="none" height="20" width="20"/></g><g><path d="M10,2c-4.42,0-8,3.58-8,8s3.58,8,8,8s8-3.58,8-8S14.42,2,10,2z M8.25,13L8.25,13c-0.41,0-0.75-0.34-0.75-0.75v-4.5 C7.5,7.34,7.84,7,8.25,7h0C8.66,7,9,7.34,9,7.75v4.5C9,12.66,8.66,13,8.25,13z M11.75,13L11.75,13C11.34,13,11,12.66,11,12.25v-4.5 C11,7.34,11.34,7,11.75,7h0c0.41,0,0.75,0.34,0.75,0.75v4.5C12.5,12.66,12.16,13,11.75,13z"/></g></svg>  
                {:else}
                  <svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 20 20" height="40px" viewBox="0 0 20 20" width="40px" fill="#000000"><g><rect fill="none" height="20" width="20"/></g><g><path d="M10,2c-4.42,0-8,3.58-8,8s3.58,8,8,8s8-3.58,8-8S14.42,2,10,2z M8,12.59V7.41c0-0.39,0.44-0.63,0.77-0.42l4.07,2.59 c0.31,0.2,0.31,0.65,0,0.84l-4.07,2.59C8.44,13.22,8,12.98,8,12.59z"/></g></svg>
                {/if}
              </button>
            </div>
          {/each}
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
  />
{/if}


<style>
  /* Add padding at the bottom to prevent the keyboard from covering the grid on mobile */
  @media (max-width: 768px) {
    :global(body) {
      overflow: hidden;
      position: fixed;
      width: 100%;
      height: 100%;
    }

    :global(.slide-menu-open) .crossword-grid {
      pointer-events: none;
    }
  }
  
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
</style>