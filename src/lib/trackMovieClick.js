/**
 * Fire-and-forget tracker for Spotle Movies link clicks.
 * @param {'crosstune_splash' | string} source
 */
export function trackMovieClick(source) {
  fetch('/api/track-click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source })
  }).catch(() => {
    // Silently ignore — tracking must never break navigation
  });
}
