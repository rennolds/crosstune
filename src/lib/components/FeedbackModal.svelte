<script>
  import { supabase } from "$lib/supabaseClient";
  import { getUser } from "$lib/stores/auth.svelte.js";

  let { onClose = () => {} } = $props();

  let comment = $state('');
  let email = $state('');
  let submitted = $state(false);
  let submitting = $state(false);

  function handleKeydown(e) {
    if (e.key === 'Escape') handleClose();
  }

  function handleClose() {
    onClose();
    setTimeout(() => {
      comment = '';
      email = '';
      submitted = false;
    }, 300);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    submitting = true;

    const user = getUser();
    const { error } = await supabase.from('feedback').insert({
      session_id: user?.id ?? null,
      comment: comment.trim(),
      email: email.trim() || null,
      source: 'crosstune',
    });

    if (error) console.error('Failed to submit feedback:', error.message, error);

    submitting = false;
    submitted = true;
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div
  class="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none"
  role="dialog"
  aria-modal="true"
  tabindex="-1"
>
  <div class="pointer-events-auto bg-gray-200 dark:bg-[#303030] rounded-lg max-w-md w-full shadow-xl border border-gray-300 dark:border-gray-600">
    <!-- Header -->
    <div class="flex items-center justify-between px-5 py-4 border-b border-gray-300 dark:border-gray-600">
      <h2 class="text-black dark:text-white text-xl font-bold">Feedback</h2>
      <button
        onclick={handleClose}
        class="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors p-1"
        aria-label="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Body -->
    <div class="px-5 py-4">
      {#if submitted}
        <div class="flex flex-col items-center gap-3 py-6 text-center">
          <p class="text-black dark:text-white text-lg font-semibold">Thanks for the feedback!</p>
          <button
            onclick={handleClose}
            class="mt-1 px-6 py-2 rounded-xs bg-black dark:bg-white text-white dark:text-black font-bold text-sm hover:bg-gray-900 dark:hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      {:else}
        <form onsubmit={handleSubmit} class="flex flex-col gap-4">
          <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            Have a suggestion, spotted a bug, or want to tell us something? We read every message!
          </p>

          <div class="flex flex-col gap-1.5">
            <label for="feedback-comment" class="text-black dark:text-white text-xs font-semibold uppercase tracking-wider">
              Your feedback
            </label>
            <textarea
              id="feedback-comment"
              bind:value={comment}
              placeholder="Tell us what you think..."
              rows="4"
              class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none transition-all"
            ></textarea>
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="feedback-email" class="text-black dark:text-white text-xs font-semibold uppercase tracking-wider">
              Email <span class="normal-case font-normal text-gray-500 dark:text-gray-400">(optional)</span>
            </label>
            <input
              id="feedback-email"
              type="email"
              bind:value={email}
              placeholder="you@example.com"
              class="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !comment.trim()}
            class="w-full py-3 rounded-xs font-bold text-sm transition-colors
              {submitting || !comment.trim()
                ? 'bg-gray-300 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                : 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-900 dark:hover:bg-gray-200'}"
          >
            {submitting ? 'Sending…' : 'Send Feedback'}
          </button>
        </form>
      {/if}
    </div>
  </div>
</div>
