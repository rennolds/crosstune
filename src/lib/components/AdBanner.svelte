<script>
  import { page } from "$app/stores";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";

  // Props passed from +layout.svelte
  let { PUB_ID, WEBSITE_ID } = $props();

  let rampComponentLoaded = $state(false);
  let lastPathname = $state(undefined);

  // Watchdog: detect and remove rogue full-screen ad overlays injected onto <body>.
  // Performance note: This only fires on DOM node additions (not every frame).
  // We do a cheap tag/attribute pre-check before the expensive getComputedStyle call,
  // so the cost is negligible for normal DOM operations.
  onMount(() => {
    // Set of our own app element IDs to whitelist
    const appElementIds = new Set([
      "ad-container",
      "standard_iab_head1",
      "svelte",
    ]);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          // Only inspect element nodes
          if (node.nodeType !== 1) continue;

          // Skip known app elements
          if (appElementIds.has(node.id)) continue;
          if (
            node.tagName === "NAV" ||
            node.tagName === "SCRIPT" ||
            node.tagName === "LINK" ||
            node.tagName === "STYLE" ||
            node.tagName === "META"
          )
            continue;

          // Cheap inline style pre-check: only proceed if the element has
          // fixed/absolute positioning set inline (which rogue ad overlays typically do)
          const inlinePos = node.style?.position;
          if (inlinePos !== "fixed" && inlinePos !== "absolute") continue;

          // Now do the more expensive computed style check
          try {
            const style = window.getComputedStyle(node);
            const w = parseFloat(style.width) || 0;
            const h = parseFloat(style.height) || 0;
            const z = parseInt(style.zIndex) || 0;

            const isFullScreen =
              w > window.innerWidth * 0.7 && h > window.innerHeight * 0.4;
            const isHighZ = z >= 900;

            if (isFullScreen && isHighZ) {
              console.warn("[AdGuard] Blocked rogue ad overlay:", {
                tag: node.tagName,
                id: node.id,
                class: node.className,
                size: `${w}x${h}`,
                zIndex: z,
              });
              node.remove();
            }
          } catch (e) {
            // Ignore errors from cross-origin iframes etc.
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  });

  $effect(() => {
    if (browser) {
      if (!rampComponentLoaded) {
        if (!PUB_ID || !WEBSITE_ID) {
          console.log("Missing Publisher Id and Website Id");
          return;
        }
        window.ramp = window.ramp || {};
        window.ramp.que = window.ramp.que || [];
        window.ramp.passiveMode = true;

        // Load the Ramp configuration script
        const configScript = document.createElement("script");
        configScript.src = `https://cdn.intergient.com/${PUB_ID}/${WEBSITE_ID}/ramp.js`;
        document.body.appendChild(configScript);
        configScript.onload = () => {
          rampComponentLoaded = true;
          window.ramp.que.push(() => {
            window.ramp.spaNewPage();
            window.ramp.addTag("standard_iab_head1");
          });
        };
      }
    }
  });

  $effect(() => {
    if (
      browser &&
      rampComponentLoaded &&
      window.ramp &&
      window.ramp.spaNewPage &&
      $page.url.pathname !== lastPathname
    ) {
      lastPathname = $page.url.pathname;
      window.ramp.que.push(() => {
        window.ramp.spaNewPage($page.url.pathname);
      });
    }
  });
</script>

<div
  id="ad-container"
  class="w-full bg-white dark:bg-black fixed top-0 left-0 right-0 z-1000 flex items-center justify-center"
>
  <!-- Ramp ad unit container -->
  <div data-pw-mobi="standard_iab_head1" id="standard_iab_head1"></div>
</div>

<style>
  /* Adjust global padding to account for the ad banner on mobile */
  :global(body) {
    @media (max-width: 768px) {
      padding-top: 50px !important;
    }
  }

  /* Hard-contain the ad container — prevent any child from overflowing */
  #ad-container {
    height: 50px !important;
    max-height: 50px !important;
    overflow: hidden !important;
    contain: strict;
  }

  /* Constrain the ad slot itself so rogue creatives can't break out */
  #standard_iab_head1 {
    width: 350px;
    height: 50px;
    max-height: 50px !important;
    margin: 0 auto;
    padding: 0;
    overflow: hidden !important;
    position: relative;
  }

  /* Catch any iframes or divs Ramp injects inside the ad slot and constrain them */
  :global(#standard_iab_head1 iframe),
  :global(#standard_iab_head1 div),
  :global(#ad-container iframe) {
    max-height: 50px !important;
    max-width: 350px !important;
    overflow: hidden !important;
  }

  /* Hide ads on desktop — mobile-only format */
  @media (min-width: 768px) {
    #ad-container {
      display: none;
    }
  }

</style>
