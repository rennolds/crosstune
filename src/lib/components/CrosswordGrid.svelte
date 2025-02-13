<script>
  import crosswords from "$lib/data/crosswords.json";
  import MobileKeyboard from './MobileKeyboard.svelte';

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
  const puzzle = crosswords["2024-02-09"];
  const { size, words } = puzzle;

  // Create grid and message state
  let grid = $state(
    Array(size.height)
      .fill(null)
      .map(() => Array(size.width).fill(null))
  );
  let message = $state("");
  let isCorrect = $state(false);
  let highlightedWord = $state(null);

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

  // Replace the existing isCellHighlighted function with this
  function isCellHighlighted(x, y) {
    if (x === focusedX && y === focusedY) return 'focused';
    return isCellInActiveWord(x, y) ? 'active' : false;
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

  // Modify handleCellClick to detect if cell is start of a word
  function handleCellClick(x, y) {
    console.log('Clicked cell:', x, y);

    // Check if clicked cell is start of any words
    const isStartOfAcross = words.some(word => {
      const isStart = word.direction === 'across' && word.startX === x && word.startY === y;
      if (isStart) console.log('Found start of across word:', word);
      return isStart;
    });
    
    const isStartOfDown = words.some(word => {
      const isStart = word.direction === 'down' && word.startX === x && word.startY === y;
      if (isStart) console.log('Found start of down word:', word); 
      return isStart;
    });

    // Set direction if it's the start of a word
    if (isStartOfAcross) {
      console.log('Setting direction to across');
      currentDirection = 'across';
    } else if (isStartOfDown) {
      console.log('Setting direction to down');
      currentDirection = 'down';
    }

    console.log('Current direction:', currentDirection);

    focusedX = x;
    focusedY = y;
  }

  function findNextWordStart(currentX, currentY) {
    // Get all word starting positions sorted by position
    let startPositions = [...words].sort((a, b) => {
      if (a.startY === b.startY) {
        return a.startX - b.startX;
      }
      return a.startY - b.startY;
    });

    // Find the next word start position
    let nextWord = startPositions.find(word => {
      // If we're on the same row, find the next word to the right
      if (word.startY === currentY) {
        return word.startX > currentX;
      }
      // Otherwise, find the first word in the next row
      return word.startY > currentY;
    });

    // If no next word found, wrap around to the first word
    if (!nextWord) {
      nextWord = startPositions[0];
    }

    return {
      x: nextWord.startX,
      y: nextWord.startY,
      direction: nextWord.direction
    };
  }
  // Modify moveFocus to be more reliable
  function moveFocus(newX, newY) {
    // First check bounds
    if (newX < 0 || newY < 0 || newX >= size.width || newY >= size.height) {
      return;
    }

    // If we hit a space cell, skip to next cell in current direction
    if (grid[newY][newX] !== null && spaceCells.has(`${newX},${newY}`)) {
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

  // Modify handleKeydown to move in the current direction
// ... previous code ...

function handleKeydown(event, x, y) {
    console.log('Key pressed:', event.key);  // Debug log
    
    if (spaceCells.has(`${x},${y}`)) {
        event.preventDefault();
        return;
    }

    const input = event.target;

    switch (event.key) {
        case 'Tab':
            event.preventDefault();
            const nextWord = findNextWordStart(x, y);
            focusedX = nextWord.x;
            focusedY = nextWord.y;
            currentDirection = nextWord.direction;
            const nextInput = document.querySelector(
                `input[data-x="${nextWord.x}"][data-y="${nextWord.y}"]`
            );
            nextInput?.focus();
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
              // Clear current cell if it has a value
              if (grid[y][x]) {
                  grid[y][x] = '';
              }
              // Move to previous cell
              if (currentDirection === 'across') {
                  // Keep moving back until we find a non-space cell or hit the edge
                  let newX = x - 1;
                  while (newX >= 0 && spaceCells.has(`${newX},${y}`)) {
                      newX--;
                  }
                  if (newX >= 0) {
                      moveFocus(newX, y);
                  }
              } else {
                  // Keep moving up until we find a non-space cell or hit the edge
                  let newY = y - 1;
                  while (newY >= 0 && spaceCells.has(`${x},${newY}`)) {
                      newY--;
                  }
                  if (newY >= 0) {
                      moveFocus(x, newY);
                  }
              }
            break;
        default:
            // Changed this part to handle both upper and lowercase letters
            if (event.key.length === 1 && event.key.match(/[a-zA-Z]/i)) {
                // Set the value explicitly to uppercase
                input.value = event.key.toUpperCase();
                requestAnimationFrame(() => {
                    if (currentDirection === 'across') {
                        moveFocus(x + 1, y);
                    } else {
                        moveFocus(x, y + 1);
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
        // Clear current cell if it has a value
        if (grid[focusedY][focusedX]) {
            grid[focusedY][focusedX] = '';
        }
        
        // Move to previous cell
        if (currentDirection === 'across') {
            let newX = focusedX - 1;
            while (newX >= 0 && spaceCells.has(`${newX},${focusedY}`)) {
                newX--;
            }
            if (newX >= 0) {
                moveFocus(newX, focusedY);
            }
        } else {
            let newY = focusedY - 1;
            while (newY >= 0 && spaceCells.has(`${focusedX},${newY}`)) {
                newY--;
            }
            if (newY >= 0) {
                moveFocus(focusedX, newY);
            }
        }
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

  function submitGuess() {
    // Check if all non-space cells are filled
    const hasEmptyCells = grid.some((row, y) =>
      row.some((cell, x) => cell === "" && !spaceCells.has(`${x},${y}`))
    );

    if (hasEmptyCells) {
      message = "Please fill in all cells before submitting";
      isCorrect = false;
      return;
    }

    const allCorrect = words.every(checkWord);

    if (allCorrect) {
      message = "Congratulations! All words are correct!";
      isCorrect = true;
    } else {
      message = "Some words are incorrect. Try again!";
      isCorrect = false;
    }
  }

  async function playClue(clue) {
    try {
      console.log("Starting playback for URL:", clue.audioUrl);

      // Stop any currently playing audio
      if (currentAudio) {
        console.log("Stopping previous audio");
        currentAudio.pause();
        currentAudio = null;
      }
      isPlaying = false;

      // Highlight the word
      highlightedWord = clue;

      // Create and play new audio
      const audio = new Audio(clue.audioUrl);
      currentAudio = audio;

      console.log("Waiting for audio to load...");

      // Wait for audio to load
      await new Promise((resolve, reject) => {
        audio.addEventListener("loadedmetadata", () => {
          console.log("Audio metadata loaded");
          resolve();
        });
        audio.addEventListener("error", (e) => {
          console.log("Audio loading error:", e);
          reject(e);
        });
      });

      console.log("Starting playback...");
      await audio.play();
      console.log("Playback started");
      isPlaying = true;

      // Set timeout to stop after 2 seconds
      setTimeout(() => {
        if (currentAudio === audio) {
          console.log("Stopping audio after 1 seconds");
          audio.pause();
          isPlaying = false;
          currentAudio = null;
          highlightedWord = null;
        }
      }, 1500);

      // Still keep the ended event listener for cases where the audio might end before 2 seconds
      audio.addEventListener("ended", () => {
        console.log("Audio playback ended");
        isPlaying = false;
        currentAudio = null;
        highlightedWord = null;
      });
    } catch (error) {
      console.error("Error playing audio:", error);
      console.error("Audio element error:", currentAudio?.error);
      isPlaying = false;
      currentAudio = null;
      highlightedWord = null;
    }
  }
</script>

<div class="w-full max-w-lg mx-auto">
  <!-- This wrapper ensures the grid container has a fixed width -->
  <div class="aspect-square relative">
    <!-- The grid container is forced to be a square -->
    <div
      class="absolute inset-0 grid bg-black"
      style="grid-template-columns: repeat({size.width}, minmax(0, 1fr)); gap: 1px;"
    >
      {#each grid as row, y}
        {#each row as cell, x}
          <div
            class="aspect-square flex items-center justify-center relative transition-colors duration-200
              {cell === null
                  ? 'bg-black'
                  : isCellHighlighted(x, y) === 'focused'
                    ? 'bg-orange-300'
                    : isCellHighlighted(x, y) === 'active'
                      ? 'bg-blue-100'
                      : 'bg-white'}"
          >
            {#if cell !== null}
              {#if wordNumbers.has(`${x},${y}`)}
                <span class="absolute text-xs top-0 left-0.5">
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
                class="w-full h-full text-center uppercase font-bold text-lg focus:outline-none bg-transparent"
                class:cursor-text={!isMobileDevice}
                bind:value={grid[y][x]}
                onkeydown={(e) => handleKeydown(e, x, y)}
                onclick={() => handleCellClick(x, y)}
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


    <button
      onclick={submitGuess}
      class="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
    >
      Submit
    </button>

    {#if message}
      <div
        class="text-lg font-semibold {isCorrect
          ? 'text-green-600'
          : 'text-red-600'}"
      >
        {message}
      </div>
    {/if}
  </div>

  <MobileKeyboard onKeyPress={handleVirtualKeyPress} />
  <div class="flex flex-col gap-6 w-full md:w-64">
    <!-- Across Clues -->
    <div>
      <h2 class="text-xl font-bold mb-2">Across</h2>
      <div class="space-y-2">
        {#each acrossClues as clue}
          <div class="flex items-center gap-2">
            <span class="font-medium w-6">{clue.number}.</span>
            <span class="text-sm">{clue.length} letters</span>
            <button
              onclick={() => playClue(clue)}
              class="ml-auto px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isPlaying}
            >
              {isPlaying ? "Playing..." : "Play"}
            </button>
          </div>
        {/each}
      </div>
    </div>

    <!-- Down Clues -->
    <div>
      <h2 class="text-xl font-bold mb-2">Down</h2>
      <div class="space-y-2">
        {#each downClues as clue}
          <div class="flex items-center gap-2">
            <span class="font-medium w-6">{clue.number}.</span>
            <span class="text-sm">{clue.length} letters</span>
            <button
              onclick={() => playClue(clue)}
              class="ml-auto px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              Play
            </button>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  /* Add padding at the bottom to prevent the keyboard from covering the grid on mobile */
  @media (max-width: 768px) {
    :global(body) {
      padding-bottom: 220px;
    }
  }
  
  .cursor-text {
    cursor: text;
  }
</style>