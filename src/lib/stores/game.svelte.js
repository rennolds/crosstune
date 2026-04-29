// src/lib/stores/game.svelte.js
let isCorrect = $state(false);
let seconds = $state(0);
let isTimerRunning = $state(false);

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
  isTimerRunning = false;
}

export const readyWidgets = $state(new Set());
let unavailableWidgets = $state(new Set()); // Internal state for unavailable widgets

export function isWidgetReady(widgetId) {
  return readyWidgets.has(widgetId);
}

export function markWidgetAsReady(widgetId) {
  readyWidgets.add(widgetId);
}

// Functions for unavailable widgets
export function isWidgetUnavailable(widgetId) {
  return unavailableWidgets.has(widgetId);
}

export function markWidgetAsUnavailable(widgetId) {
  if (!unavailableWidgets.has(widgetId)) {
    // Reassign to trigger reactivity for internal $state
    unavailableWidgets = new Set([...unavailableWidgets, widgetId]);
  }
}

export function setUnavailableWidgets(widgetSet) {
  // Reassign to trigger reactivity for internal $state
  unavailableWidgets = widgetSet;
}

export function getUnavailableWidgets() {
  return unavailableWidgets;
}

// Add function to check if all widgets are ready
export function areAllWidgetsReady(words) {
  if (!words || words.length === 0) return false;
  return words.every(word => {
    const widgetId = `${word.startX}:${word.startY}:${word.direction}`;
    return isWidgetReady(widgetId);
  });
}