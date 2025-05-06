<script>
  import { createEventDispatcher } from "svelte";
  import { fly } from "svelte/transition";
  import { browser } from "$app/environment";

  let { isOpen, onClose } = $props();
  let isMobileDevice = $state(false);

  const dispatch = createEventDispatcher();

  $effect(() => {
    isMobileDevice = window.matchMedia("(max-width: 768px)").matches;
  });

  // Modify the click handler to prevent event propagation issues
  function handleClickOutside(event) {
    // Only process clicks outside the menu AND outside the menu button
    if (!isMobileDevice && isOpen) {
      // Check for the menu-button class or data attribute to identify the button
      const menu = document.querySelector(".slide-menu");
      const menuButton = document.querySelector('[aria-label="Menu"]');
      if (
        menu &&
        !menu.contains(event.target) &&
        menuButton &&
        !menuButton.contains(event.target)
      ) {
        onClose();
      }
    }
  }

  $effect(() => {
    if (typeof document !== "undefined") {
      // Use mousedown instead of click for better mobile experience
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  });

  // Close the slide menu
  function handleClose() {
    onClose();
  }

  // Navigate to different sections
  function navigateToHome() {
    window.location.href = "/";
    if (isMobileDevice) {
      onClose();
    }
  }

  // Function to handle Archives navigation
  function navigateToArchives() {
    // Get the current path
    const currentPath = window.location.pathname;

    // If we're on the /archives route but viewing a specific puzzle
    if (currentPath.startsWith("/archives") && window.location.search !== "") {
      // Strip the search parameters to go back to archives list
      window.location.href = "/archives";
    } else if (currentPath !== "/archives") {
      // If we're on any other page (not archives at all)
      window.location.href = "/archives";
    }

    if (isMobileDevice) {
      onClose();
    }
  }

  // Function to handle Themed Puzzles navigation
  function navigateToThemed() {
    window.location.href = "/themed";
    if (isMobileDevice) {
      onClose();
    }
  }

  function handleFollowUs() {
    if (browser) {
      window.open("https://twitter.com/spotle_io", "_blank");
    }
  }

  function handlePrivacy() {
    if (browser) {
      window.open("./privacy", "_blank");
    }
  }

  function handleHarmonies() {
    if (browser) {
      window.open("https://harmonies.io", "_blank");
    }
  }

  function handleSpotle() {
    if (browser) {
      window.open("https://spotle.io", "_blank");
    }
  }
</script>

<div
  class="fixed inset-0 transition-all z-40"
  class:pointer-events-none={!isOpen}
  class:pointer-events-auto={isOpen}
>
  <div
    class="absolute inset-0 bg-opacity-70 transition-opacity"
    class:opacity-0={!isOpen}
    class:invisible={!isOpen}
    class:pointer-events-none={!isOpen}
    class:pointer-events-auto={isOpen}
    on:click={handleClose}
  ></div>

  {#if isOpen}
    <div
      class="slide-menu fixed top-0 md:mt-6 mt-14 md:pt-0 pt-[calc(10px)] bg-white dark:bg-[#303030] overflow-auto
            w-full shadow-lg h-full left-0"
      style="z-index: 50;"
    >
      <div
        class="p-5 flex flex-col h-full relative max-w-[400px] mx-auto"
        in:fly={{ x: -400, duration: 300 }}
        out:fly={{ x: -400, duration: 300 }}
      >
        <!-- <div
          class="menu-close absolute top-10 right-4 cursor-pointer"
          on:click={handleClose}
        >
          <svg
            width="20"
            height="18"
            viewBox="0 0 20 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19.2099 1.7625L17.3417 0L9.93491 6.9875L2.52816 0L0.659912 1.7625L8.06666 8.75L0.659912 15.7375L2.52816 17.5L9.93491 10.5125L17.3417 17.5L19.2099 15.7375L11.8032 8.75L19.2099 1.7625Z"
              fill="white"
            />
          </svg>
        </div> -->

        <div class="menu-content mt-10">
          <div class="menu-navigation">
            <div
              class="menu-item cursor-pointer text-black dark:text-white text-lg py-1 hover:text-gray-400"
              on:click={navigateToHome}
            >
              Home
            </div>
            <div
              class="menu-item cursor-pointer text-black dark:text-white text-lg py-1 hover:text-gray-400"
              on:click={navigateToArchives}
            >
              Archives
            </div>
            <div
              class="menu-item cursor-pointer text-black dark:text-white text-lg py-1 hover:text-gray-400"
              on:click={navigateToThemed}
            >
              Themed Puzzles
            </div>
            <div
              class="menu-item cursor-pointer text-black dark:text-white text-lg py-1 hover:text-gray-400"
              on:click={handleFollowUs}
            >
              Follow Us
            </div>
            <div
              class="menu-item cursor-pointer text-black dark:text-white text-lg py-1 hover:text-gray-400"
              on:click={handlePrivacy}
            >
              Privacy
            </div>
          </div>
          <div class="menu-section mt-8">
            <h3 class="text-black dark:text-white text-xl font-bold mb-4">
              Our Games
            </h3>

            <div
              class="game-card mb-4 ml-2 cursor-pointer hover:scale-105 transition-transform"
              on:click={handleSpotle}
            >
              <div
                class="game-image w-60 h-24 rounded bg-cover bg-center overflow-hidden"
              >
                <img
                  src="/spotle.png"
                  alt="Spotle Game"
                  class="w-full h-full object-cover"
                />
              </div>
              <div
                class="game-title text-black dark:text-white text-base font-semibold mt-2"
              >
                Spotle: Guess the Artist
              </div>
            </div>

            <div
              class="game-card mb-4 ml-2 cursor-pointer hover:scale-105 transition-transform"
              on:click={handleHarmonies}
            >
              <div
                class="game-image w-60 h-24 rounded bg-cover bg-center overflow-hidden"
              >
                <img
                  src="/harmonies.png"
                  alt="Harmonies Game"
                  class="w-full h-full object-cover"
                />
              </div>
              <div
                class="game-title text-black dark:text-white text-base font-semibold mt-2"
              >
                Harmonies: Music Connections
              </div>
            </div>
          </div>
        </div>

        <div class="menu-footer mt-auto pt-6 pb-[110px]">
          <div class="footer-text text-black dark:text-white text-sm">
            made by flatwhite studios
          </div>
          <div class="footer-email text-gray-500 text-xs mt-1">
            inquiries: company@flatwhite-studios.com
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .slide-menu {
    -webkit-overflow-scrolling: touch;
    touch-action: pan-y;
  }

  /* Pulse animation for the NEW badge */
  .new-badge {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }

  /* Make all interactive elements explicitly clickable */
  .slide-menu div[on\:click],
  .slide-menu button {
    position: relative;
    z-index: 51;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }

  /* Desktop animation for center slide menu */
  @media (min-width: 769px) {
    .slide-menu {
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
    }
  }

  @media (max-width: 768px) {
    .slide-menu {
      padding-bottom: 50px;
    }

    .menu-footer {
      margin-bottom: 25px;
    }
  }
</style>
