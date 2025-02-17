/**
 * Generates a crossword using a multi-attempt, scoring algorithm.
 * 
 * Algorithm:
 *  1. Create an empty grid and copy the list of words.
 *  2. Shuffle the word list and then sort by longest to shortest.
 *  3. Place the first (longest) word at (1,1) in a random orientation (vertical or horizontal)
 *     that fits.
 *  4. For each subsequent word:
 *       a. For every letter in the word, scan every grid cell for a letter match.
 *       b. For each match, try placing the word in both orientations (with the matching letter aligned).
 *       c. Validate each candidate placement and “score” it (score = number of crossing letters).
 *       d. Only accept candidates with a score > 0.
 *       e. Choose the candidate with the highest score (ties may be broken randomly).
 *  5. Repeat the entire process for a fixed time (or number of attempts), buffering the crossword
 *     that placed the most words.
 *
 * Each placement object in the returned crossword has:
 *   - word: string
 *   - textClue: string
 *   - audioUrl: string
 *   - direction: "across" or "down"
 *   - startX: x-coordinate (0-indexed)
 *   - startY: y-coordinate (0-indexed)
 */
export function generateCrossword(wordObjs) {
    // Set grid dimensions (you can change these as needed)
    const WIDTH = 12;
    const HEIGHT = 10;
    // How long (in ms) we try to improve our crossword
    const TIME_LIMIT_MS = 5000;
  
    let bestSolution = null;
    let bestPlacedCount = 0;
    const startTime = Date.now();
  
    // We work on a copy of the words (and normalize letters to uppercase, trimming whitespace)
    const cleanWords = wordObjs
      .map(w => ({ ...w, word: w.word.toUpperCase().trim() }))
      .filter(w => w.word.length > 0);
  
    if (cleanWords.length === 0) return null;
  
    // Try generating a crossword repeatedly (time limited) to buffer the best result.
    while (Date.now() - startTime < TIME_LIMIT_MS) {
      // --- Step 1: Prepare the word list ---
      const words = [...cleanWords];
      shuffleArray(words);
      // Sort by descending length
      words.sort((a, b) => b.word.length - a.word.length);
  
      // Create an empty grid (2D array filled with null)
      const grid = createEmptyGrid(WIDTH, HEIGHT);
      const placements = [];
  
      // --- Step 2: Place the first (longest) word at (1,1) ---
      const first = words[0];
      let orientation = Math.random() < 0.5 ? 'across' : 'down';
      // Ensure the word fits in the chosen orientation starting at (1,1)
      if (orientation === 'across' && first.word.length > (WIDTH - 1)) {
        orientation = 'down';
      } else if (orientation === 'down' && first.word.length > (HEIGHT - 1)) {
        orientation = 'across';
      }
      if (!isWithinBounds(1, 1, first.word.length, orientation, WIDTH, HEIGHT)) {
        // Should not happen if grid is large enough.
        continue;
      }
      placeWord(grid, first.word, 1, 1, orientation);
      placements.push({ ...first, direction: orientation, startX: 1, startY: 1 });
  
      // --- Step 3: Try to place each remaining word ---
      for (let w = 1; w < words.length; w++) {
        const current = words[w];
        const candidatePlacements = [];
  
        // For each letter in the current word
        for (let letterIdx = 0; letterIdx < current.word.length; letterIdx++) {
          const letter = current.word[letterIdx];
          // Loop over every cell in the grid
          for (let y = 0; y < HEIGHT; y++) {
            for (let x = 0; x < WIDTH; x++) {
              if (grid[y][x] === letter) {
                // For each orientation, calculate the starting cell if we align the letter.
                for (const orient of ['across', 'down']) {
                  const startX = orient === 'across' ? x - letterIdx : x;
                  const startY = orient === 'across' ? y : y - letterIdx;
                  if (!isWithinBounds(startX, startY, current.word.length, orient, WIDTH, HEIGHT)) {
                    continue;
                  }
                  // Score this candidate: score > 0 means it touches an existing letter.
                  const score = scorePlacement(grid, current.word, startX, startY, orient, WIDTH, HEIGHT);
                  if (score > 0) {
                    candidatePlacements.push({ startX, startY, orientation: orient, score });
                  }
                }
              }
            }
          }
        }
  
        // If we found candidate placements, choose the best-scoring one.
        if (candidatePlacements.length > 0) {
          candidatePlacements.sort((a, b) => b.score - a.score);
          // (Optional: randomize tie-breaks)
          const bestCandidate = candidatePlacements[0];
          placeWord(grid, current.word, bestCandidate.startX, bestCandidate.startY, bestCandidate.orientation);
          placements.push({
            ...current,
            direction: bestCandidate.orientation,
            startX: bestCandidate.startX,
            startY: bestCandidate.startY
          });
        }
        // If no valid candidate was found, we simply skip this word.
      }
  
      // Buffer the solution if we placed more words than before.
      if (placements.length > bestPlacedCount) {
        bestPlacedCount = placements.length;
        bestSolution = { grid, words: placements };
      }
    }
  
    return bestSolution;
  }
  
  /* Helper: Shuffles an array in place (Fisher–Yates) */
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  
  /* Helper: Creates an empty grid of given width and height */
  function createEmptyGrid(width, height) {
    const grid = [];
    for (let y = 0; y < height; y++) {
      grid[y] = [];
      for (let x = 0; x < width; x++) {
        grid[y][x] = null;
      }
    }
    return grid;
  }
  
  /**
   * Helper: Returns true if a word of length `len` in the given orientation
   * starting at (startX, startY) fits within the grid.
   */
  function isWithinBounds(startX, startY, len, orientation, width, height) {
    if (orientation === 'across') {
      return startX >= 0 && startY >= 0 && (startX + len) <= width && startY < height;
    } else {
      return startX >= 0 && startY >= 0 && (startY + len) <= height && startX < width;
    }
  }
  
  /**
   * Helper: Checks if a candidate word placement is valid and returns a score.
   * The score is the number of intersections (cells where the grid already has a letter).
   * A score of 0 means either the candidate does not cross any existing word or it
   * violates adjacent placement rules.
   */
/**
 * Helper: Checks if a candidate word placement is valid and returns a score.
 * The score is the number of intersections (cells where the grid already has a letter).
 * A score of 0 means either the candidate does not cross any existing word or it
 * violates placement rules.
 */
function scorePlacement(grid, word, startX, startY, orientation, width, height) {
    let intersections = 0;
    for (let i = 0; i < word.length; i++) {
      const letter = word[i];
      const x = orientation === 'across' ? startX + i : startX;
      const y = orientation === 'down' ? startY + i : startY;
      
      // If cell is not empty, it must match the letter (an intended intersection)
      if (grid[y][x] !== null) {
        if (grid[y][x] !== letter) return 0;
        intersections++;
        // For an intersection cell, skip the adjacent check.
      } else {
        // For an empty cell, ensure no adjacent cell (perpendicular) is already occupied.
        if (orientation === 'across') {
          if (y - 1 >= 0 && grid[y - 1][x] !== null) return 0;
          if (y + 1 < height && grid[y + 1][x] !== null) return 0;
        } else { // orientation === 'down'
          if (x - 1 >= 0 && grid[y][x - 1] !== null) return 0;
          if (x + 1 < width && grid[y][x + 1] !== null) return 0;
        }
      }
    }
    
    // Check the cells immediately before and after the word.
    if (orientation === 'across') {
      if (startX - 1 >= 0 && grid[startY][startX - 1] !== null) return 0;
      if (startX + word.length < width && grid[startY][startX + word.length] !== null) return 0;
    } else {
      if (startY - 1 >= 0 && grid[startY - 1][startX] !== null) return 0;
      if (startY + word.length < height && grid[startY + word.length][startX] !== null) return 0;
    }
    
    // Only accept placements that cross at least one existing letter.
    return intersections;
  }
  
  
  /**
   * Helper: Places the given word on the grid at (startX, startY) in the given orientation.
   * Assumes that the placement is valid.
   */
  function placeWord(grid, word, startX, startY, orientation) {
    for (let i = 0; i < word.length; i++) {
      const x = orientation === 'across' ? startX + i : startX;
      const y = orientation === 'down' ? startY + i : startY;
      grid[y][x] = word[i];
    }
  }
  