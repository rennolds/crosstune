// src/lib/stores/theme.svelte.js
let isDarkMode = $state(false);

// Initialize the theme from localStorage
if (typeof window !== 'undefined') {
  // Check system preference first if no stored preference
  const storedTheme = localStorage.getItem('crosstune_dark_mode');
  
  if (storedTheme !== null) {
    isDarkMode = storedTheme === 'true';
  } else {
    // Use system preference as default if available
    isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  
  // Apply the theme immediately
  if (typeof document !== 'undefined') {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
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
    
    // Log for debugging
    console.log('Dark mode:', dark);
  }
}