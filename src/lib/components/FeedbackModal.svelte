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
  class="overlay"
  role="dialog"
  aria-modal="true"
  tabindex="-1"
>
  <div class="modal">
    <div class="modal-header">
      <h2 class="modal-title">Feedback</h2>
      <button class="close-btn" onclick={handleClose} aria-label="Close">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div class="modal-body">
      {#if submitted}
        <div class="success">
          <p class="success-text">Thanks for the feedback!</p>
          <button class="btn-primary" onclick={handleClose}>Close</button>
        </div>
      {:else}
        <form onsubmit={handleSubmit}>
          <p class="helper-text">
            Have a suggestion, spotted a bug, or want to tell us something? We read every message!
          </p>

          <div class="field">
            <label for="feedback-comment" class="field-label">Your feedback</label>
            <textarea
              id="feedback-comment"
              bind:value={comment}
              placeholder="Tell us what you think..."
              rows="4"
              class="field-input textarea"
            ></textarea>
          </div>

          <div class="field">
            <label for="feedback-email" class="field-label">
              Email <span class="optional">(optional — so we can follow up)</span>
            </label>
            <input
              id="feedback-email"
              type="email"
              bind:value={email}
              placeholder="you@example.com"
              class="field-input"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !comment.trim()}
            class="btn-primary submit-btn {submitting || !comment.trim() ? 'disabled' : ''}"
          >
            {submitting ? 'Sending…' : 'Send Feedback'}
          </button>
        </form>
      {/if}
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    pointer-events: none;
  }

  .modal {
    pointer-events: all;
    background: #1e1e1e;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 16px;
    max-width: 440px;
    width: 100%;
    overflow: hidden;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
  }

  :global(.light) .modal,
  :global(html:not(.dark)) .modal {
    background: #f3f3f3;
    border-color: rgba(0, 0, 0, 0.12);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  :global(html:not(.dark)) .modal-header {
    border-bottom-color: rgba(0, 0, 0, 0.08);
  }

  .modal-title {
    color: white;
    font-size: 22px;
    font-weight: 700;
    margin: 0;
  }

  :global(html:not(.dark)) .modal-title {
    color: #111;
  }

  .close-btn {
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    padding: 4px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    transition: color 0.15s;
  }

  .close-btn:hover {
    color: white;
  }

  :global(html:not(.dark)) .close-btn:hover {
    color: #111;
  }

  .modal-body {
    padding: 20px;
  }

  .helper-text {
    color: #b5b5b5;
    font-size: 14px;
    line-height: 1.5;
    margin: 0 0 16px 0;
  }

  :global(html:not(.dark)) .helper-text {
    color: #555;
  }

  .field {
    margin-bottom: 16px;
  }

  .field-label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #b5b5b5;
    margin-bottom: 6px;
  }

  :global(html:not(.dark)) .field-label {
    color: #555;
  }

  .optional {
    text-transform: none;
    font-weight: 400;
    color: #666;
  }

  .field-input {
    width: 100%;
    background: #2a2a2a;
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: white;
    font-size: 14px;
    border-radius: 10px;
    padding: 10px 14px;
    font-family: inherit;
    box-sizing: border-box;
    transition: border-color 0.15s;
    outline: none;
  }

  :global(html:not(.dark)) .field-input {
    background: white;
    border-color: rgba(0, 0, 0, 0.15);
    color: #111;
  }

  .field-input:focus {
    border-color: #6b5fc9;
  }

  .field-input::placeholder {
    color: #555;
  }

  :global(html:not(.dark)) .field-input::placeholder {
    color: #aaa;
  }

  .textarea {
    resize: none;
  }

  .btn-primary {
    width: 100%;
    padding: 12px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    border: none;
    background: #6b5fc9;
    color: white;
    transition: opacity 0.15s;
    font-family: inherit;
    margin-top: 4px;
  }

  .btn-primary:hover:not(.disabled) {
    opacity: 0.9;
  }

  .btn-primary.disabled {
    background: #2a2a2a;
    color: #555;
    cursor: not-allowed;
  }

  :global(html:not(.dark)) .btn-primary.disabled {
    background: #ddd;
    color: #aaa;
  }

  .success {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 24px 0;
    text-align: center;
  }

  .success-text {
    color: white;
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }

  :global(html:not(.dark)) .success-text {
    color: #111;
  }
</style>
