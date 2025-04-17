<script>
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { browser } from "$app/environment";

  let { PUB_ID = "", WEBSITE_ID = "" } = $props();

  let isMobileDevice = $state(false);
  let rampComponentLoaded = false;
  let lastPathname;

  $effect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(max-width: 768px)");

      // Set initial state
      isMobileDevice = mediaQuery.matches;

      // Update state on change
      const handler = (e) => {
        isMobileDevice = e.matches;
      };

      mediaQuery.addEventListener("change", handler);

      // Cleanup listener on component unmount
      return () => mediaQuery.removeEventListener("change", handler);
    }
  });

  // Effect to manage body class based on isMobileDevice
  $effect(() => {
    if (typeof document !== "undefined") {
      if (isMobileDevice) {
        document.body.classList.add("mobile-ad-padding");
      } else {
        document.body.classList.remove("mobile-ad-padding");
      }
      // Cleanup function to remove the class if the component unmounts
      return () => {
        document.body.classList.remove("mobile-ad-padding");
      };
    }
  });

  onMount(() => {
    // Only load Ramp script if on mobile and IDs are present
    if (isMobileDevice && PUB_ID && WEBSITE_ID) {
      window.ramp = window.ramp || {};
      window.ramp.que = window.ramp.que || [];
      window.ramp.passiveMode = true;

      const configScript = document.createElement("script");
      configScript.src = `https://cdn.intergient.com/${PUB_ID}/${WEBSITE_ID}/ramp.js`;
      configScript.async = true; // Load async to avoid blocking
      document.body.appendChild(configScript);

      configScript.onload = () => {
        rampComponentLoaded = true;
        window.ramp.que.push(() => {
          window.ramp.spaNewPage();
          window.ramp.addTag("standard_iab_head1");
        });
      };
    } else if (!PUB_ID || !WEBSITE_ID) {
      console.log("Missing Publisher Id and/or Website Id for Ramp ad.");
    }
  });

  // Effect for handling SPA navigation updates for Ramp
  $effect: if (
    rampComponentLoaded &&
    isMobileDevice && // Only trigger SPA updates if mobile and loaded
    window.ramp &&
    window.ramp.spaNewPage &&
    $page.url.pathname !== lastPathname
  ) {
    lastPathname = $page.url.pathname;
    window.ramp.que.push(() => {
      window.ramp.spaNewPage($page.url.pathname);
    });
  }
</script>

{#if isMobileDevice}
  <div
    data-pw-mobi="standard_iab_head1"
    id="standard_iab_head1"
    class="h-[50px] w-full fixed top-0 left-0 right-0 z-[100] bg-white dark:bg-gray-900"
  ></div>
{/if}

<style>
  /* Adjust global padding to account for the ad banner on mobile */
  :global(body.mobile-ad-padding) {
    padding-top: 50px !important;
  }

  /* #standard_iab_head1 {
    position: sticky;
    top: 0;
    width: 100%;
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #121212;
    z-index: 101;
    margin: 0 auto;
    padding: 0;
  } */

  /* Hide ads on desktop */
  /* @media (min-width: 768px) {
    #standard_iab_head1 {
      display: none;
    }
  } */
</style>
