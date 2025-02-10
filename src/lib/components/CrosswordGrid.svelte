<script>
    import crosswords from '$lib/data/crosswords.json';
  
    // Get today's puzzle
    const puzzle = crosswords['2024-02-09'];
    const { size, words } = puzzle;
  
    // Create grid and message state
    let grid = $state(Array(size.height).fill(null).map(() => Array(size.width).fill(null)));
    let message = $state('');
    let isCorrect = $state(false);
    let highlightedWord = $state(null);
  
    // Track currently focused cell
    let focusedX = $state(0);
    let focusedY = $state(0);
  
    // Generate word numbers and organize clues
    let wordNumbers = $state(new Map());
    let currentNumber = 1;
    
    let acrossClues = $state([]);
    let downClues = $state([]);
    
    words.forEach(word => {
      const key = `${word.startX},${word.startY}`;
      let number;
      if (!wordNumbers.has(key)) {
        number = currentNumber++;
        wordNumbers.set(key, number);
      } else {
        number = wordNumbers.get(key);
      }
  
      const clue = {
        number,
        word: word.word,
        audioClip: word.audioClip,
        startX: word.startX,
        startY: word.startY,
        direction: word.direction,
        length: word.word.length
      };
  
      if (word.direction === 'across') {
        acrossClues.push(clue);
      } else {
        downClues.push(clue);
      }
    });
  
    // Sort clues by number
    acrossClues.sort((a, b) => a.number - b.number);
    downClues.sort((a, b) => a.number - b.number);
  
    // Helper to check if a cell should be an input cell
    function isInputCell(x, y) {
      return words.some(word => {
        if (word.direction === 'across') {
          return word.startY === y && x >= word.startX && x < word.startX + word.word.length;
        } else {
          return word.startX === x && y >= word.startY && y < word.startY + word.word.length;
        }
      });
    }
  
    // Initialize input cells
    for (let y = 0; y < size.height; y++) {
      for (let x = 0; x < size.width; x++) {
        if (isInputCell(x, y)) {
          grid[y][x] = '';
        }
      }
    }
  
    function handleKeydown(event, x, y) {
      const input = event.target;
  
      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          moveFocus(x + 1, y);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          moveFocus(x - 1, y);
          break;
        case 'ArrowUp':
          event.preventDefault();
          moveFocus(x, y - 1);
          break;
        case 'ArrowDown':
          event.preventDefault();
          moveFocus(x, y + 1);
          break;
        case 'Backspace':
          if (!input.value) {
            event.preventDefault();
            moveFocus(x - 1, y);
          }
          break;
        default:
          if (event.key.length === 1 && event.key.match(/[a-zA-Z]/)) {
            setTimeout(() => moveFocus(x + 1, y), 0);
          }
      }
    }
  
    function moveFocus(newX, newY) {
      while (newX < size.width && newY < size.height && newX >= 0 && newY >= 0) {
        if (grid[newY][newX] !== null) {
          focusedX = newX;
          focusedY = newY;
          const input = document.querySelector(`input[data-x="${newX}"][data-y="${newY}"]`);
          input?.focus();
          return;
        }
        newX += (newX > focusedX ? 1 : newX < focusedX ? -1 : 0);
        newY += (newY > focusedY ? 1 : newY < focusedY ? -1 : 0);
      }
    }
  
    function checkWord(word) {
      const letters = [];
      if (word.direction === 'across') {
        for (let x = word.startX; x < word.startX + word.word.length; x++) {
          letters.push(grid[word.startY][x]);
        }
      } else {
        for (let y = word.startY; y < word.startY + word.word.length; y++) {
          letters.push(grid[y][word.startX]);
        }
      }
      return letters.join('').toUpperCase() === word.word;
    }
  
    function submitGuess() {
      const hasEmptyCells = grid.some(row => 
        row.some(cell => cell === '')
      );
  
      if (hasEmptyCells) {
        message = 'Please fill in all cells before submitting';
        isCorrect = false;
        return;
      }
  
      const allCorrect = words.every(checkWord);
  
      if (allCorrect) {
        message = 'Congratulations! All words are correct!';
        isCorrect = true;
      } else {
        message = 'Some words are incorrect. Try again!';
        isCorrect = false;
      }
    }
  
    function playClue(clue) {
      // Reset any previous highlight
      highlightedWord = clue;
      
      // TODO: Play audio clip
      console.log('Playing audio for', clue.audioClip);
      
      // Automatically remove highlight after 2 seconds
      setTimeout(() => {
        if (highlightedWord === clue) {
          highlightedWord = null;
        }
      }, 2000);
    }
  
    function isCellHighlighted(x, y) {
      if (!highlightedWord) return false;
  
      if (highlightedWord.direction === 'across') {
        return y === highlightedWord.startY && 
               x >= highlightedWord.startX && 
               x < highlightedWord.startX + highlightedWord.length;
      } else {
        return x === highlightedWord.startX && 
               y >= highlightedWord.startY && 
               y < highlightedWord.startY + highlightedWord.length;
      }
    }
</script>
  
<div class="flex flex-col md:flex-row items-start gap-8 p-4">
    <!-- Crossword Grid -->
    <div class="flex flex-col items-center">
      <div 
        class="grid bg-black mb-6" 
        style="grid-template-columns: repeat({size.width}, minmax(0, 1fr)); gap: 1px;"
      >
        {#each grid as row, y}
          {#each row as cell, x}
            <div 
              class="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center relative 
                     {cell === null ? 'bg-black' : isCellHighlighted(x, y) ? 'bg-yellow-200' : 'bg-white'} 
                     transition-colors duration-200"
            >
              {#if cell !== null}
                {#if wordNumbers.has(`${x},${y}`)}
                  <span class="absolute text-xs top-0 left-0.5">
                    {wordNumbers.get(`${x},${y}`)}
                  </span>
                {/if}
                
                <input
                  type="text"
                  maxlength="1"
                  data-x={x}
                  data-y={y}
                  class="w-full h-full text-center uppercase font-bold text-lg focus:outline-none bg-transparent"
                  bind:value={grid[y][x]}
                  onkeydown={(e) => handleKeydown(e, x, y)}
                />
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
        <div class="text-lg font-semibold {isCorrect ? 'text-green-600' : 'text-red-600'}">
          {message}
        </div>
      {/if}
    </div>
  
    <!-- Clue Lists -->
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
                class="ml-auto px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
              >
                Play
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