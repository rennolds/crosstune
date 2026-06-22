<script>
  import { page } from "$app/stores";
  import { browser } from "$app/environment";

  // Props passed from +layout.svelte
  let { PUB_ID, WEBSITE_ID } = $props();

  let isMobileDevice = $state(false);
  let rampComponentLoaded = $state(false);
  let lastPathname = $state(undefined);

  $effect(() => {
    // Determine if mobile device initially and on resize
    if (browser) {
      isMobileDevice = window.matchMedia("(max-width: 768px)").matches;
      const mediaQuery = window.matchMedia("(max-width: 768px)");
      const handler = (e) => {
        isMobileDevice = e.matches;
      };
      mediaQuery.addEventListener("change", handler);

      // Cleanup listener on component destroy
      return () => mediaQuery.removeEventListener("change", handler);
    }
  });

  $effect(() => {
    // Ramp loading logic - runs on both mobile and desktop, but banner only shows on mobile.
    if (browser && PUB_ID && WEBSITE_ID && !rampComponentLoaded) {
      console.log("Loading Ramp ad...");
      window.ramp = window.ramp || {};
      window.ramp.que = window.ramp.que || [];
      window.ramp.passiveMode = true;

      const configScript = document.createElement("script");
      configScript.src = `https://cdn.intergient.com/${PUB_ID}/${WEBSITE_ID}/ramp.js`;
      document.body.appendChild(configScript);

      configScript.onload = () => {
        rampComponentLoaded = true;
        window.ramp.que.push(() => {
          window.ramp.spaNewPage();
          window.ramp.addTag("standard_iab_head1");
          lastPathname = $page.url.pathname;
        });
      };

      return () => {
        const existingScript = document.querySelector(
          `script[src="${configScript.src}"]`
        );
        if (existingScript) {
          document.body.removeChild(existingScript);
        }
      };
    }
  });

  // Effect for handling SPA navigation updates for Ramp
  $effect(() => {
    if (
      rampComponentLoaded &&
      isMobileDevice && // Ensure we only run this on mobile
      window.ramp &&
      window.ramp.spaNewPage &&
      $page.url.pathname !== lastPathname
    ) {
      lastPathname = $page.url.pathname;
      console.log("Ramp SPA Navigation: ", lastPathname);
      window.ramp.que.push(() => {
        // It's often better to refresh units or call spaNewPage based on ad provider docs
        window.ramp.refreshUnits();
        // window.ramp.spaNewPage(lastPathname); // Use if spaNewPage is the correct method
      });
    }
  });
</script>

<!-- Always render div for Ramp to find, visibility controlled by CSS -->
<div
  id="ad-container"
  class="bg-white dark:bg-black flex items-center justify-center"
>
  <!-- Ramp ad unit container -->
  <div data-pw-mobi="standard_iab_head1" id="standard_iab_head1"></div>
</div>

<style>
  /* Mobile: fixed banner at top */
  @media (max-width: 768px) {
    #ad-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      width: 100%;
      height: 50px;
      z-index: 100;
    }

    :global(body) {
      padding-top: 50px !important;
    }
  }

  /* Desktop: hide the banner, but keep element in DOM for Ramp */
  @media (min-width: 769px) {
    #ad-container {
      display: none;
    }
  }

  #standard_iab_head1 {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
  }
</style>
