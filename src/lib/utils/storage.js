import moment from 'moment-timezone';

const STORAGE_KEYS = {
    SPLASH_SHOWN: 'crosstune_splash_shown',
    GRID_STATE: 'crosstune_grid_state',
    TIMER_STATE: 'crosstune_timer_state',
    LAST_PUZZLE_DATE: 'crosstune_last_puzzle_date',
    REVEALED_CELLS: 'crosstune_revealed_cells',
    SOLVED_PUZZLES: 'crosstune_solved_puzzles',
    PUZZLE_VERSION: 'crosstune_puzzle_version',
    UNAVAILABLE_WIDGETS: 'crosstune_unavailable_widgets',
    THEMED_SOLVED_PUZZLES: 'crosstune_themed_solved_puzzles',
    PUZZLE_HASH: 'crosstune_puzzle_hash'
};

// Helper to get East Coast date in YYYY-MM-DD format 
export function getEastCoastDate() {
  return moment().tz('America/New_York').format('YYYY-MM-DD');
}

// Generate a simple hash from puzzle words to uniquely identify puzzle content
export function generatePuzzleHash(words) {
  if (!words || words.length === 0) return '';
  
  // Create a string from the first 3 words' answers and positions
  // This is enough to uniquely identify a puzzle without being too expensive
  const signature = words.slice(0, 3).map(w => 
    `${w.word}:${w.startX}:${w.startY}:${w.direction}`
  ).join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < signature.length; i++) {
    const char = signature.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

// Check if stored data is from today's puzzle
function isStoredDataValid(currentPuzzleHash) {
  if (typeof window === 'undefined') return;

  const lastPuzzleDate = localStorage.getItem(STORAGE_KEYS.LAST_PUZZLE_DATE);
  const currentDate = getEastCoastDate();
  
  // Date must match
  if (lastPuzzleDate !== currentDate) return false;
  
  // If puzzle hash is provided, it must also match
  if (currentPuzzleHash) {
    const storedHash = localStorage.getItem(STORAGE_KEYS.PUZZLE_HASH);
    if (storedHash !== currentPuzzleHash) {
      console.warn('Puzzle content has changed, clearing stored data');
      return false;
    }
  }
  
  return true;
}

export function saveGridState(grid, puzzleVersion, gridDimensions, puzzleHash) {
  if (typeof window === 'undefined') return;
  
  const currentDate = getEastCoastDate();
  const stateToSave = {
    grid: grid,
    dimensions: gridDimensions || { width: grid[0]?.length || 0, height: grid.length || 0 }
  };
  localStorage.setItem(STORAGE_KEYS.GRID_STATE, JSON.stringify(stateToSave));
  localStorage.setItem(STORAGE_KEYS.LAST_PUZZLE_DATE, currentDate);
  localStorage.setItem(STORAGE_KEYS.PUZZLE_VERSION, puzzleVersion);
  if (puzzleHash) {
    localStorage.setItem(STORAGE_KEYS.PUZZLE_HASH, puzzleHash);
  }
}

export function loadGridState(expectedDimensions, puzzleHash) {
  if (typeof window === 'undefined') return null;
  
  if (!isStoredDataValid(puzzleHash)) {
    clearStoredData();
    return null;
  }

  const gridState = localStorage.getItem(STORAGE_KEYS.GRID_STATE);
  if (!gridState) return null;
  
  try {
    const parsed = JSON.parse(gridState);
    
    // Handle old format (just array) for backward compatibility
    if (Array.isArray(parsed)) {
      // Old format - validate dimensions if provided
      if (expectedDimensions) {
        const actualHeight = parsed.length;
        const actualWidth = parsed[0]?.length || 0;
        if (actualHeight !== expectedDimensions.height || actualWidth !== expectedDimensions.width) {
          console.warn('Grid dimensions mismatch, clearing stored data');
          clearStoredData();
          return null;
        }
      }
      return parsed;
    }
    
    // New format with dimensions
    if (parsed.grid && parsed.dimensions) {
      // Validate dimensions match if expected dimensions provided
      if (expectedDimensions) {
        if (parsed.dimensions.height !== expectedDimensions.height || 
            parsed.dimensions.width !== expectedDimensions.width) {
          console.warn('Grid dimensions mismatch, clearing stored data');
          clearStoredData();
          return null;
        }
      }
      return parsed.grid;
    }
    
    // Invalid format
    clearStoredData();
    return null;
  } catch (e) {
    console.error('Error parsing grid state:', e);
    clearStoredData();
    return null;
  }
}

export function saveTimerState(seconds) {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(STORAGE_KEYS.TIMER_STATE, seconds.toString());
}

export function loadTimerState() {
  if (typeof window === 'undefined') return 0;
  
  if (!isStoredDataValid()) {
    return 0;
  }

  const timerState = localStorage.getItem(STORAGE_KEYS.TIMER_STATE);
  return timerState ? parseInt(timerState, 10) : 0;
}

// Storage functions
export function saveSplashShown() {
  const currentDate = getEastCoastDate();
  localStorage.setItem(STORAGE_KEYS.SPLASH_SHOWN, 'true');
  localStorage.setItem(STORAGE_KEYS.LAST_PUZZLE_DATE, currentDate);
}

export function shouldShowSplash() {
  if (!isStoredDataValid()) {
    clearStoredData();
    return true;
  }
  return localStorage.getItem(STORAGE_KEYS.SPLASH_SHOWN) !== 'true';
}

export function clearStoredData() {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(STORAGE_KEYS.SPLASH_SHOWN);
  localStorage.removeItem(STORAGE_KEYS.GRID_STATE);
  localStorage.removeItem(STORAGE_KEYS.LAST_PUZZLE_DATE);
  localStorage.removeItem(STORAGE_KEYS.TIMER_STATE);
  localStorage.removeItem(STORAGE_KEYS.REVEALED_CELLS);
  localStorage.removeItem(STORAGE_KEYS.PUZZLE_VERSION);
  localStorage.removeItem(STORAGE_KEYS.UNAVAILABLE_WIDGETS);
  localStorage.removeItem(STORAGE_KEYS.PUZZLE_HASH);
  // Note: We don't clear SOLVED_PUZZLES and THEMED_SOLVED_PUZZLES as they should persist
}

export function saveRevealedCells(revealedCells) {
  if (typeof window === 'undefined') return;

  localStorage.setItem(STORAGE_KEYS.REVEALED_CELLS, JSON.stringify([...revealedCells]))
} 

export function loadRevealedCells() {
  if (typeof window === 'undefined') return new Set();
  
  if (!isStoredDataValid()) {
    clearStoredData();
    return new Set();
  }

  const revealedCells = localStorage.getItem(STORAGE_KEYS.REVEALED_CELLS);
  if (!revealedCells) return new Set();
  
  // Convert the parsed array back to a Set
  return new Set(JSON.parse(revealedCells));
}

export function markPuzzleAsSolved(date) {
  if (typeof window === 'undefined') return;
  
  const solvedPuzzles = getSolvedPuzzles();
  if (!solvedPuzzles.includes(date)) {
    solvedPuzzles.push(date);
    localStorage.setItem(STORAGE_KEYS.SOLVED_PUZZLES, JSON.stringify(solvedPuzzles));
  }
}

/**
 * Gets all solved puzzles
 * @returns {string[]} Array of dates in YYYY-MM-DD format
 */
export function getSolvedPuzzles() {
  if (typeof window === 'undefined') return [];
  
  const storedPuzzles = localStorage.getItem(STORAGE_KEYS.SOLVED_PUZZLES);
  return storedPuzzles ? JSON.parse(storedPuzzles) : [];
}

/**
 * Checks if a specific puzzle is solved
 * @param {string} date - The puzzle date in YYYY-MM-DD format
 * @returns {boolean} True if the puzzle is solved
 */
export function isPuzzleSolved(date) {
  return getSolvedPuzzles().includes(date);
}

// Add new function to check puzzle version
export function isPuzzleVersionValid(currentVersion) {
  if (typeof window === 'undefined') return true;
  
  const storedVersion = localStorage.getItem(STORAGE_KEYS.PUZZLE_VERSION);
  return storedVersion === currentVersion;
}

// Add functions for unavailable widgets
export function saveUnavailableWidgets(unavailableWidgets) {
  if (typeof window === 'undefined') return;

  localStorage.setItem(STORAGE_KEYS.UNAVAILABLE_WIDGETS, JSON.stringify([...unavailableWidgets]));
}

export function loadUnavailableWidgets() {
  if (typeof window === 'undefined') return new Set();
  
  if (!isStoredDataValid()) {
    clearStoredData();
    return new Set();
  }

  const unavailableWidgets = localStorage.getItem(STORAGE_KEYS.UNAVAILABLE_WIDGETS);
  if (!unavailableWidgets) return new Set();
  
  // Convert the parsed array back to a Set
  return new Set(JSON.parse(unavailableWidgets));
}

// Functions for themed puzzle completion tracking
export function markThemedPuzzleAsSolved(puzzleId) {
  if (typeof window === 'undefined') return;
  
  // Convert puzzleId to string for consistent storage
  const puzzleIdStr = String(puzzleId);
  const solvedThemedPuzzles = getThemedSolvedPuzzles();
  if (!solvedThemedPuzzles.includes(puzzleIdStr)) {
    solvedThemedPuzzles.push(puzzleIdStr);
    localStorage.setItem(STORAGE_KEYS.THEMED_SOLVED_PUZZLES, JSON.stringify(solvedThemedPuzzles));
  }
}

/**
 * Gets all solved themed puzzles
 * @returns {string[]} Array of puzzle IDs as strings
 */
export function getThemedSolvedPuzzles() {
  if (typeof window === 'undefined') return [];
  
  const storedPuzzles = localStorage.getItem(STORAGE_KEYS.THEMED_SOLVED_PUZZLES);
  return storedPuzzles ? JSON.parse(storedPuzzles) : [];
}

/**
 * Checks if a specific themed puzzle is solved
 * @param {string|number} puzzleId - The puzzle ID
 * @returns {boolean} True if the themed puzzle is solved
 */
export function isThemedPuzzleSolved(puzzleId) {
  // Convert puzzleId to string for consistent comparison
  const puzzleIdStr = String(puzzleId);
  return getThemedSolvedPuzzles().includes(puzzleIdStr);
}