// src/lib/utils/storage.js
const STORAGE_KEYS = {
    SPLASH_SHOWN: 'crosstune_splash_shown',
    GRID_STATE: 'crosstune_grid_state',
    LAST_PUZZLE_DATE: 'crosstune_last_puzzle_date'
  };
  
  // Helper to get East Coast date in YYYY-MM-DD format
  function getEastCoastDate() {
    const date = new Date();
    return new Date(date.toLocaleString('en-US', {
      timeZone: 'America/New_York'
    })).toISOString().split('T')[0];
  }
  
  // Check if stored data is from today's puzzle
  function isStoredDataValid() {
    const lastPuzzleDate = localStorage.getItem(STORAGE_KEYS.LAST_PUZZLE_DATE);
    const currentDate = getEastCoastDate();
    return lastPuzzleDate === currentDate;
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
    localStorage.removeItem(STORAGE_KEYS.SPLASH_SHOWN);
    localStorage.removeItem(STORAGE_KEYS.GRID_STATE);
    localStorage.removeItem(STORAGE_KEYS.LAST_PUZZLE_DATE);
  }