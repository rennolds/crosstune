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
    // Ramp loading logic - only runs on mobile and when props are available
    if (
      browser &&
      isMobileDevice &&
      PUB_ID &&
      WEBSITE_ID &&
      !rampComponentLoaded
    ) {
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
          window.ramp.addTag("standard_iab_head1");
          window.ramp.displayUnits(); // Display ads immediately after loading and adding the tag
          lastPathname = $page.url.pathname; // Initialize lastPathname after first load
        });
      };

      // Optional: Add cleanup for the script tag if the component unmounts before loading finishes
      return () => {
        const existingScript = document.querySelector(
          `script[src="${configScript.src}"]`
        );
        if (existingScript) {
          document.body.removeChild(existingScript);
        }
        // Potentially clear Ramp queue or state if necessary
      };
    } else if (!isMobileDevice && rampComponentLoaded) {
      // Optional: Cleanup if switching from mobile to desktop after ad loaded
      console.log("Device is no longer mobile, potentially unload Ramp.");
      // Add any necessary Ramp cleanup logic here if needed
      rampComponentLoaded = false; // Reset state
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

{#if isMobileDevice}
  <div
    class="h-[50px] w-full bg-gray-200 fixed top-0 left-0 right-0 z-[100] flex items-center justify-center"
  >
    <!-- Ramp ad unit container -->
    <div data-pw-mobi="standard_iab_head1" id="standard_iab_head1"></div>
  </div>
{/if}

<style>
  /* Adjust global padding to account for the ad banner on mobile */
  :global(body) {
    @media (max-width: 768px) {
      padding-top: 50px !important;
    }
  }

  /* Ensure the ad container itself doesn't add extra spacing */
  #standard_iab_head1 {
    display: flex; /* Use flex to help center content if needed */
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%; /* Fill the parent container */
  }
</style>
