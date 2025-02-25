// src/lib/stores/game.svelte.js
let isCorrect = $state(false);
let seconds = $state(0);
let isTimerRunning = $state(true);

// Getter functions
export function getIsCorrect() {
  return isCorrect;
}

export function getSeconds() {
  return seconds;
}

export function getTimerRunning() {
  return isTimerRunning;
}

// Setter functions
export function setIsCorrect(value) {
  isCorrect = value;
}

export function setSeconds(value) {
  seconds = value;
}

export function incrementSeconds() {
  seconds++;
}

export function setTimerRunning(value) {
  isTimerRunning = value;
}

// Reset function for archive puzzles
export function resetTimer() {
  seconds = 0;
  isCorrect = false;
  isTimerRunning = true;
}