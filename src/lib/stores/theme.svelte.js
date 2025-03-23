// src/lib/stores/theme.svelte.js
let isDarkMode = $state(false);

// Initialize the theme from localStorage
if (typeof window !== 'undefined') {
  const storedTheme = localStorage.getItem('crosstune_dark_mode');
  if (storedTheme) {
    isDarkMode = storedTheme === 'true';
    applyTheme(isDarkMode);
  }
}

// Function to toggle dark mode
export function toggleDarkMode() {
  isDarkMode = !isDarkMode;
  
  // Save to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('crosstune_dark_mode', isDarkMode.toString());
  }
  
  // Apply theme
  applyTheme(isDarkMode);
  
  return isDarkMode;
}

// Function to get current theme state
export function getIsDarkMode() {
  return isDarkMode;
}

// Apply theme to document
function applyTheme(dark) {
  if (typeof document !== 'undefined') {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}