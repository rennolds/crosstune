import moment from 'moment-timezone';

const STORAGE_KEYS = {
    SPLASH_SHOWN: 'crosstune_splash_shown',
    GRID_STATE: 'crosstune_grid_state',
    TIMER_STATE: 'crosstune_timer_state',
    LAST_PUZZLE_DATE: 'crosstune_last_puzzle_date',
    REVEALED_CELLS: 'crosstune_revealed_cells',
    SOLVED_PUZZLES: 'crosstune_solved_puzzles',
    PUZZLE_VERSION: 'crosstune_puzzle_version',
    UNAVAILABLE_WIDGETS: 'crosstune_unavailable_widgets'
};
// Helper to get East Coast date in YYYY-MM-DD format 
export function getEastCoastDate() {
  return moment().tz('America/New_York').format('YYYY-MM-DD');
}

// Check if stored data is from today's puzzle
function isStoredDataValid() {
  if (typeof window === 'undefined') return;

  const lastPuzzleDate = localStorage.getItem(STORAGE_KEYS.LAST_PUZZLE_DATE);
  const currentDate = getEastCoastDate();
  return lastPuzzleDate === currentDate;
}

export function saveGridState(grid, puzzleVersion) {
  if (typeof window === 'undefined') return;
  
  const currentDate = getEastCoastDate();
  localStorage.setItem(STORAGE_KEYS.GRID_STATE, JSON.stringify(grid));
  localStorage.setItem(STORAGE_KEYS.LAST_PUZZLE_DATE, currentDate);
  localStorage.setItem(STORAGE_KEYS.PUZZLE_VERSION, puzzleVersion);
}

export function loadGridState() {
  if (typeof window === 'undefined') return null;
  
  if (!isStoredDataValid()) {
    clearStoredData();
    return null;
  }

  const gridState = localStorage.getItem(STORAGE_KEYS.GRID_STATE);
  return gridState ? JSON.parse(gridState) : null;
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