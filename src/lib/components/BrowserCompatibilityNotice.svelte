<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  const STORAGE_KEY = 'crosstune_audio_notice_dismissed';

  let isOpen = $state(false);

  function isAffectedBrowser() {
    if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
    const ua = navigator.userAgent || '';
    if (/Android|iPhone|iPad|iPod|Mobi/i.test(ua)) return false;
    if (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) return false;
    const isChromium = /Chrome\/|Edg\//.test(ua);
    if (!isChromium) return false;
    if (/OPR\//.test(ua)) return true;
    return true;
  }

  function dismiss() {
    isOpen = false;
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {}
  }

  onMount(() => {
    if (!browser) return;
    let alreadyDismissed = false;
    try {
      alreadyDismissed = localStorage.getItem(STORAGE_KEY) === '1';
    } catch {}
    if (alreadyDismissed) return;
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
      class="bg-white dark:bg-[#202020] dark:text-white rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700"
    >
      <h2 id="audio-notice-title" class="text-lg font-semibold mb-3">
        Heads up about song playback
      </h2>
      <div class="text-sm text-gray-700 dark:text-gray-300 space-y-3 mb-5">
        <p>
          A recent change to how some songs are streamed has caused playback
          issues for certain clues on Chrome and Edge desktop. We're aware of
          it and looking into a fix.
        </p>
        <p>
          If a clue's audio won't play, the answer will reveal automatically so
          you can keep solving. For the full audio experience right now, Safari
          or your phone work great.
        </p>
        <p class="text-gray-500 dark:text-gray-400">Thanks for your patience!</p>
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
