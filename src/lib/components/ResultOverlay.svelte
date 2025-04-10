<script>
  let {
    time,
    isCorrect,
    onClose,
    hideKeyboard,
    isArchiveMode = false,
  } = $props();

  // Add state for share message
  let showShareMessage = $state(false);

  // Check if device is mobile
  let isMobile = $state(false);

  $effect(() => {
    isMobile = window.matchMedia("(max-width: 768px)").matches;
  });

  // Convert time (in seconds) to MM:SS format
  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  // For countdown to midnight EST
  let timeUntilMidnight = $state("");
  let countdown;

  // Update countdown timer every second
  function startCountdown() {
    // Initial update
    updateCountdown();

    // Set interval for updates
    countdown = setInterval(updateCountdown, 1000);

    // Cleanup on component destroy
    return () => {
      if (countdown) clearInterval(countdown);
    };
  }

  function updateCountdown() {
    // Get current date in EST
    const now = new Date();
    const estTimeString = new Date().toLocaleString("en-US", {
      timeZone: "America/New_York",
    });
    const estTime = new Date(estTimeString);

    // Set target to next midnight EST
    const tomorrow = new Date(estTime);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // Calculate difference in hours, minutes and seconds
    const diff = tomorrow - estTime;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    timeUntilMidnight = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  // Copy results to clipboard
  function shareResults() {
    const shareText = isArchiveMode
      ? `I solved the Crosstune puzzle in ${formatTime(time)} 🎧. crosstune.io`
      : `I solved today's Crosstune in ${formatTime(time)} 🎧. crosstune.io`;

    if (isMobile && navigator.share) {
      navigator
        .share({
          title: "Crosstune Results",
          text: shareText,
        })
        .catch((err) => {
          copyToClipboard(shareText);
        });
    } else {
      copyToClipboard(shareText);
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showShareMessage = true;
        setTimeout(() => {
          showShareMessage = false;
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  }

  // Hide the keyboard when overlay is shown
  $effect(() => {
    if (hideKeyboard) hideKeyboard();
    const cleanup = startCountdown();
    return cleanup;
  });
</script>

<div
  class="fixed inset-0 z-50 flex items-start justify-center pt-16 text-white"
>
  {#if isCorrect}
    <!-- Background gradient -->
    <div
      class="absolute inset-0 backdrop-blur-[2px]"
      style="background: linear-gradient(180deg, rgba(74, 74, 74, 0.75) 0%, #4A4A4A 59.02%);"
    ></div>

    <!-- Content -->
    <div
      class="relative z-10 flex flex-col items-center text-center max-w-md w-full mx-4 space-y-6 p-8"
    >
      <!-- Exit button -->
      <button
        onclick={onClose}
        class="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        aria-label="Close"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="white"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <h2 class="text-3xl font-bold text-white">Congratulations!</h2>
      <p class="text-xl text-white">
        {#if isArchiveMode}
          You solved the puzzle in {formatTime(time)}!
        {:else}
          You solved today's puzzle in {formatTime(time)}!
        {/if}
      </p>

      <button
        onclick={shareResults}
        class="w-3/4 bg-[#202020] hover:bg-[#101010] text-white font-bold py-3 px-6 rounded-lg transition-colors"
      >
        SHARE RESULT
      </button>

      <div class="text-center">
        <p class="font-medium">Next puzzle in</p>
        <p class="text-xl font-bold">{timeUntilMidnight}</p>
      </div>

      <p class="text-sm text-white">
        Missed yesterday? Visit the <a
          href="/archives"
          class="text-blue-500 hover:underline">archive</a
        >.
      </p>

      <div class="flex flex-col gap-3 w-full text-white">
        <button
          class="w-3/4 mx-auto bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          <a
            href="https://spotle.io"
            target="_blank"
            rel="noopener noreferrer"
            class="w-full py-3 transition-colors text-center"
          >
            PLAY SPOTLE
          </a>
        </button>

        <button
          class="w-3/4 mx-auto bg-[#BA81C2] hover:bg-[#9966a3] text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          <a
            href="https://harmonies.io"
            target="_blank"
            rel="noopener noreferrer"
            class="w-full py-3 transition-colors text-center"
          >
            PLAY HARMONIES
          </a>
        </button>
      </div>
    </div>

    <!-- Footer attribution -->
    <div class="absolute left-4 bottom-4 text-xs text-gray-600">
      Audio provided by SoundCloud
    </div>

    <!-- Share message -->
    {#if showShareMessage}
      <div
        class="fixed bottom-4 right-4 bg-yellow-200 text-yellow-800 p-4 rounded shadow-lg z-50"
      >
        <p>Text copied to clipboard!</p>
        <button
          onclick={() => (showShareMessage = false)}
          class="mt-2 text-sm underline"
        >
          Dismiss
        </button>
      </div>
    {/if}
  {:else}
    <!-- Incorrect answer overlay -->
    <div class="absolute inset-0 bg-gray-500/50 backdrop-blur-[2px]"></div>

    <div
      class="bg-white rounded-lg p-6 max-w-sm relative shadow-lg border border-gray-200"
    >
      <button
        onclick={onClose}
        class="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        aria-label="Close"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <div class="text-center mt-4">
        <h2 class="text-xl font-bold text-red-600 mb-4">
          At least one square is wrong.
        </h2>
        <button
          onclick={onClose}
          class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          KEEP TRYING
        </button>
      </div>
    </div>
  {/if}
</div>
