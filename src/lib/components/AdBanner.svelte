<script>
  import { page } from "$app/stores";
  import { browser } from "$app/environment";
  import { onMount } from "svelte";

  // Props passed from +layout.svelte
  let { PUB_ID, WEBSITE_ID } = $props();

  let isMobileDevice = $state(false);
  let rampComponentLoaded = $state(false);
  let lastPathname = $state(undefined);

  if (browser) {  
        let rampComponentLoaded = false;
        let lastPathname;
        onMount(() => {
          if (!PUB_ID || !WEBSITE_ID) {
            console.log('Missing Publisher Id and Website Id');
            return;
          }
          window.ramp = window.ramp || {};
          window.ramp.que = window.ramp.que || [];
          window.ramp.passiveMode = true;
          // Load the Ramp configuration script
          const configScript = document.createElement("script");
          configScript.src = `https://cdn.intergient.com/${PUB_ID}/${WEBSITE_ID}/ramp.js`;
          document.body.appendChild(configScript); // Insert before closing</body> tag
          configScript.onload = () => {
            rampComponentLoaded = true;
            window.ramp.que.push(() => {
                window.ramp.spaNewPage();
                window.ramp.addTag("standard_iab_head1");
            });
          };
        });
    
        $effect(() => { if (
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
    }
</script>

{#if isMobileDevice}
  <div
    class="h-[50px] w-full bg-white dark:bg-[#202020] fixed top-0 left-0 right-0 z-[100] flex items-center justify-center"
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
