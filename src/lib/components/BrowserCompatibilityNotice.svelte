<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  let isOpen = $state(false);

  function isAffectedBrowser() {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    // Conservative suppression: only confirmed-working iPhones skip the
    // notice. Everyone else (Android, iPad, Mac Safari/Firefox, Chromium
    // desktop, etc.) sees it while the issue is active.
    if (/iPhone/.test(ua)) return false;
    return true;
  }

  function dismiss() {
    isOpen = false;
  }

  onMount(() => {
    if (!browser) return;
    if (!isAffectedBrowser()) return;
    isOpen = true;
  });
</script>

{#if isOpen}
  <div
    class="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50"
    role="dialog"
    aria-modal="true"
    aria-labelledby="audio-notice-title"
  >
    <div
      class="bg-white dark:bg-[#202020] dark:text-white rounded-lg shadow-xl max-w-lg w-full p-6 border border-gray-200 dark:border-gray-700"
    >
      <h2 id="audio-notice-title" class="text-lg font-semibold mb-3">
        Heads up
      </h2>
      <div class="text-sm text-gray-700 dark:text-gray-300 space-y-3 mb-5">
        <p>
          A recent change to audio streaming in web browsers has made most
          audio clues unavailable unless playing on iPhone, Safari on Mac, or
          Firefox on Mac. We're aware of it and hope to find a fix that
          restores all audio for all devices and browsers.
        </p>
        <p>
          If a clue's audio can't play, the answer will be automatically
          revealed. Please use a mobile device for best experience. Sorry for
          the inconvenience, we hope to get your favorite (and the only) music
          crossword back asap.
        </p>
        <p class="text-gray-500 dark:text-gray-400">
          Thanks for your patience and for playing crosstunes!<br />
          — fw games (a.k.a. tommy &amp; paul)
        </p>
      </div>
      <div class="flex justify-end">
        <button
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded"
          onclick={dismiss}
        >
          Got it
        </button>
      </div>
    </div>
  </div>
{/if}
