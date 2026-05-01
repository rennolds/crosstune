<script>
  import moment from "moment-timezone";
  import crosswords from "$lib/data/crosswords.json";

  // Simple function to convert title to URL slug
  function titleToSlug(title) {
    return title?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";
  }

  let {
    time,
    isCorrect,
    onClose,
    hideKeyboard,
    isArchiveMode = false,
    isThemedMode = false,
    isCustomMode = false,
    puzzleTitle = null,
    words = [], // Accept words prop, remove placeholder songs
    linkedPuzzles = [],
    selectedDate,
    totalLetterCount = null,
    foundLetterCount = null,
    revealedLetterCount = null,
    onNavigateBack = null,
  } = $props();

  // Build linked puzzle info from dates
  let linkedPuzzleInfo = $derived(
    linkedPuzzles
      .map((date) => {
        const puzzle = crosswords[date];
        if (!puzzle) return null;
        return {
          date,
          title: puzzle.title || "Untitled Puzzle",
        };
      })
      .filter(Boolean),
  );

  // Add state for track metadata
  let trackMetadata = $state({});

  // Derived flags for which sources are present in this puzzle
  let hasSoundCloudTracks = $derived(words.some((w) => !w.itunesId && w.audioUrl));
  let hasAppleMusicTracks = $derived(words.some((w) => w.itunesId));

  // Function to get track info from SoundCloud widget
  function getTrackInfoFromWidget(word) {
    const widgetId = `${word.startX}:${word.startY}:${word.direction}`;
    const iframe = document.getElementById(widgetId);

    if (!iframe) {
      trackMetadata[word.audioUrl] = { title: "Unknown Track", artist: "Unknown Artist" };
      return;
    }

    setTimeout(() => {
      try {
        const widget = SC.Widget(iframe);
        widget.bind(SC.Widget.Events.READY, () => {
          widget.getCurrentSound((sound) => {
            if (sound) {
              trackMetadata[word.audioUrl] = {
                title: sound.title,
                artist: sound.user.username,
              };
            } else {
              trackMetadata[word.audioUrl] = { title: "Unknown Track", artist: "Unknown Artist" };
            }
          });
        });
      } catch (error) {
        trackMetadata[word.audioUrl] = { title: "Unknown Track", artist: "Unknown Artist" };
      }
    }, 1000);
  }

  // Fetch Apple Music track metadata for a word with itunesId
  async function fetchAppleMusicMetadata(word) {
    try {
      const resp = await fetch(`/api/apple-music-preview?id=${word.itunesId}`);
      if (!resp.ok) throw new Error(`${resp.status}`);
      const data = await resp.json();
      trackMetadata[`itunes-${word.itunesId}`] = {
        title: data.title || "Unknown Track",
        artist: data.artist || "Unknown Artist",
        previewUrl: data.previewUrl || null,
        artworkUrl: data.artworkUrl || null,
      };
    } catch {
      trackMetadata[`itunes-${word.itunesId}`] = { title: "Unknown Track", artist: "Unknown Artist", previewUrl: null, artworkUrl: null };
    }
  }


  // Get track info for all words when component mounts
  $effect(() => {
    if (words.length > 0) {
      words.forEach((word) => {
        if (word.itunesId) {
          fetchAppleMusicMetadata(word);
        } else {
          getTrackInfoFromWidget(word);
        }
      });
    }
  });

  // Add state for share message
  let showShareMessage = $state(false);

  // Check if device is mobile
  let isMobile = $state(false);

  $effect(() => {
    isMobile = window.matchMedia("(max-width: 768px)").matches;
  });

  // Function to play a track preview
  function playTrackPreview(word) {
    const widgetId = `${word.startX}:${word.startY}:${word.direction}`;
    const iframe = document.getElementById(widgetId);
    if (iframe) {
      const widget = SC.Widget(iframe);
      widget.play();
    }
  }

  // Function to open track in SoundCloud
  function openTrackInSoundCloud(trackId) {
    window.open(
      `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${trackId}`,
      "_blank",
    );
  }

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

  // Function to get puzzle number based on date
  function getPuzzleNumber(date = null) {
    // April 29th, 2024 was the first puzzle (in Eastern Time)
    const firstPuzzleDate = moment.tz("2025-04-29", "America/New_York");
    const targetDate = date
      ? moment.tz(date, "America/New_York")
      : moment.tz("America/New_York");

    // Calculate difference in days
    const diffDays = targetDate.diff(firstPuzzleDate, "days");

    return diffDays + 1; // Add 1 since April 29th was #1
  }

  // Copy results to clipboard
  function shareResults() {
    const puzzleNumber = isArchiveMode
      ? getPuzzleNumber(selectedDate)
      : getPuzzleNumber();
    const today = moment.tz("America/New_York");
    const formattedDate = today.format("MMMM Do");

    let resultText;
    if (revealedLetterCount === 0) {
      resultText = `I solved the puzzle in ${formatTime(time)} flawlessly ✅.`;
    } else {
      resultText = `I solved the puzzle in ${formatTime(time)} and revealed ${revealedLetterCount} ${revealedLetterCount === 1 ? "letter" : "letters"}.`;
    }

    let shareText;
    if (isThemedMode && puzzleTitle) {
      let themedUrl = "crosstune.io/themed";
      if (puzzleTitle) {
        // Use clean slug-based URL
        const puzzleSlug = titleToSlug(puzzleTitle);
        themedUrl = `crosstune.io/themed/${puzzleSlug}`;
      }
      shareText = `Crosstune - ${puzzleTitle}\n\n${resultText}\n\n${themedUrl}`;
    } else if (isCustomMode) {
      // Custom/created puzzles: no archive/date text
      shareText = `Crosstune - ${puzzleTitle || "Custom Puzzle"}\n\n${resultText}\n\ncrosstune.io`;
    } else if (isArchiveMode) {
      shareText = `Crosstune #${puzzleNumber} - ${selectedDate ? moment(selectedDate).format("MMMM Do") : formattedDate} (Archive)\n\n${resultText}\n\ncrosstune.io`;
    } else {
      shareText = `Crosstune #${puzzleNumber} - ${formattedDate}\n\n${resultText}\n\ncrosstune.io`;
    }

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

  // Prevent body scroll when overlay is active
  $effect(() => {
    if (isCorrect) {
      document.body.style.overflow = "hidden";
    }

    // Cleanup function to restore scrolling when component unmounts or isCorrect becomes false
    return () => {
      document.body.style.overflow = ""; // Reset to default
    };
  });
</script>

<div
  class="fixed inset-0 z-50 flex items-start justify-center pt-16 pb-16 text-white"
>
  {#if isCorrect}
    <!-- Background gradient -->
    <div
      class="absolute inset-0 backdrop-blur-[2px]"
      style="background: linear-gradient(180deg, rgba(74, 74, 74, 0.75) 0%, #4A4A4A 59.02%);"
    ></div>

    <!-- Container: X button stays at top corner, content scrolls below -->
    <div class="relative z-10 max-w-md w-full mx-4 flex flex-col max-h-[calc(100vh-8rem)]">
      <!-- Exit button - anchored to top-right of container, never scrolls -->
      <button
        onclick={onClose}
        class="absolute top-3 right-3 z-10 text-white/60 hover:text-white transition-colors"
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

    <!-- Content -->
    <div
      class="flex flex-col items-center text-center w-full space-y-6 p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-700"
    >
      <h2 class="text-3xl font-bold text-white">Congratulations!</h2>
      <p class="text-xl text-white">
        {#if isArchiveMode}
          You solved the puzzle in {formatTime(time)}!
        {:else}
          You solved today's puzzle in {formatTime(time)}!
        {/if}
      </p>
      {#if totalLetterCount !== null && foundLetterCount !== null && revealedLetterCount !== null}
        <p class="text-lg text-white mt-2">
          {#if revealedLetterCount != 0}
            {foundLetterCount}/{totalLetterCount} letters found, {revealedLetterCount}
            revealed
          {:else}
            A flawless solve!
          {/if}
        </p>
      {/if}

      <button
        onclick={shareResults}
        class="w-3/4 bg-[#202020] hover:bg-[#101010] text-white font-bold py-3 px-6 rounded-lg transition-colors"
      >
        SHARE RESULT
      </button>

      {#if linkedPuzzleInfo.length > 0}
        <div class="w-full text-center">
          <p class="text-sm text-gray-300 mb-2">Play similar puzzles!</p>
          <div class="flex flex-col gap-2 items-center">
            {#each linkedPuzzleInfo as linked}
              <a
                href="/archives?date={linked.date}"
                data-sveltekit-reload
                class="text-blue-400 hover:text-blue-300 hover:underline text-sm font-medium transition-colors"
              >
                {linked.title}
              </a>
            {/each}
          </div>
        </div>
      {/if}

      {#if isThemedMode}
        <div class="text-center">
          <button
            onclick={onNavigateBack}
            class="text-blue-500 hover:underline text-md font-small bg-transparent border-none cursor-pointer"
          >
            Play another puzzle.
          </button>
        </div>
      {:else if isCustomMode}
        <div class="text-center">
          <a href="/" class="text-blue-500 hover:underline text-md font-small">
            Play today's puzzle.
          </a>
        </div>
      {:else if isArchiveMode}
        <div class="text-center">
          <a
            href="/archives"
            class="text-blue-500 hover:underline text-md font-small"
          >
            Go back to archive.
          </a>
        </div>
      {:else}
        <div class="text-center">
          <p class="font-medium">Next puzzle in</p>
          <p class="text-xl font-bold">{timeUntilMidnight}</p>
        </div>
      {/if}

      {#if !isArchiveMode}
        <p class="text-sm text-white">
          Missed yesterday? Visit the <a
            href="/archives"
            class="text-blue-500 hover:underline">archive</a
          >.
        </p>
      {/if}

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

      <!-- Song Credits Section -->
      <div class="w-full mt-4 pt-5 border-t border-white/20 text-left">
        <div class="flex items-baseline justify-between mb-4">
          <p class="text-[10px] tracking-[0.14em] uppercase text-white/40 font-medium">Songs in this puzzle</p>
          {#if hasAppleMusicTracks}
            <p class="text-[10px] text-white/30">Previews via <span style="color: #FC3C44">Apple Music</span></p>
          {/if}
        </div>

        <div>
          {#each words as word, i}
            {#if word.itunesId}
              {@const meta = trackMetadata[`itunes-${word.itunesId}`]}
              <a
                href="https://music.apple.com/us/song/{word.itunesId}"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-3 py-3 border-white/10 hover:bg-white/5 rounded transition-colors -mx-1 px-1"
                class:border-b={i < words.length - 1}
              >
                {#if meta?.artworkUrl}
                  <img
                    src={meta.artworkUrl}
                    alt="Album art"
                    width="60"
                    height="60"
                    class="block w-[60px] h-[60px] object-cover rounded-lg shrink-0"
                  />
                {:else}
                  <div class="w-[60px] h-[60px] bg-white/10 rounded-lg shrink-0"></div>
                {/if}

                <div class="flex-1 min-w-0">
                  <p class="text-white text-sm font-semibold leading-tight truncate">{meta?.title || word.song_title || ''}</p>
                  <p class="text-white/50 text-xs truncate mt-0.5">{meta?.artist || word.artist_name || ''}</p>
                </div>
                <p class="shrink-0 text-[12px] tracking-[0.12em] uppercase text-white/70 font-semibold text-right ml-2">{word.word}</p>
              </a>
            {:else}
              <!-- SoundCloud track row -->
              <button
                onclick={() => openTrackInSoundCloud(word.audioUrl)}
                class="flex items-center gap-3 py-3 border-white/10 hover:bg-white/5 rounded transition-colors -mx-1 px-1 w-full text-left"
                class:border-b={i < words.length - 1}
              >
                <div class="w-[60px] h-[60px] bg-white/10 rounded-lg shrink-0 flex items-center justify-center">
                  <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                    <path d="M10 0C8.02219 0 6.08879 0.58649 4.4443 1.6853C2.79981 2.78412 1.51809 4.3459 0.761209 6.17317C0.00433284 8.00043 -0.193701 10.0111 0.192152 11.9509C0.578004 13.8907 1.53041 15.6725 2.92894 17.0711C4.32746 18.4696 6.10929 19.422 8.0491 19.8079C9.98891 20.1937 11.9996 19.9957 13.8268 19.2388C15.6541 18.4819 17.2159 17.2002 18.3147 15.5557C19.4135 13.9112 20 11.9778 20 10C20 8.68678 19.7413 7.38642 19.2388 6.17317C18.7363 4.95991 17.9997 3.85752 17.0711 2.92893C16.1425 2.00035 15.0401 1.26375 13.8268 0.761205C12.6136 0.258658 11.3132 0 10 0ZM8 14.5V5.5L14 10L8 14.5Z" fill="#FF3F00"/>
                  </svg>
                </div>

                <div class="flex-1 min-w-0">
                  {#if trackMetadata[word.audioUrl]?.title}
                    <p class="text-white text-sm font-semibold leading-tight truncate">{trackMetadata[word.audioUrl].title}</p>
                    <p class="text-white/50 text-xs truncate mt-0.5">{trackMetadata[word.audioUrl].artist}</p>
                  {:else}
                    <p class="text-white/50 text-sm truncate">{word.song_title || ''}</p>
                  {/if}
                </div>
                <p class="shrink-0 text-[12px] tracking-[0.12em] uppercase text-white/70 font-semibold text-right ml-2">{word.word}</p>
              </button>
            {/if}
          {/each}
        </div>

        {#if hasSoundCloudTracks}
          <p class="text-[10px] text-white/25 mt-4">Audio by SoundCloud</p>
        {/if}
      </div>
      <!-- END: Song Credits Section -->
    </div>
    </div><!-- end container wrapper -->

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
