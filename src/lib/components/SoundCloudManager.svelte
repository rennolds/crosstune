<script>
  import { onMount } from "svelte";

  import {
    markWidgetAsReady,
    markWidgetAsUnavailable,
  } from "$lib/stores/game.svelte.js";

  let { words } = $props();

  onMount(() => {
    window.onSCWidgetApiReady = function () {
      console.log("SoundCloud Widget API is ready");

      words.forEach((word) => {
        const widgetId = `${word.startX}:${word.startY}:${word.direction}`;
        const iframe = document.getElementById(widgetId);

        if (iframe) {
          const widget = SC.Widget(iframe);

          widget.bind(SC.Widget.Events.READY, () => {
            console.log(`Widget ${widgetId} is ready`);
            markWidgetAsReady(widgetId);
          });

          // Add error handling
          widget.bind(SC.Widget.Events.ERROR, (error) => {
            console.warn(`Widget ${widgetId} failed to load:`, error);
            // Mark this widget as unavailable if an error occurs
            markWidgetAsUnavailable(widgetId);
          });
        }
      });
    };

    if (window.SC && window.SC.Widget) {
      window.onSCWidgetApiReady();
    }
  });
</script>

{#each words as word}
  <iframe
    id="{word.startX}:{word.startY}:{word.direction}"
    class="hidden"
    scrolling="no"
    frameborder="no"
    allow="autoplay"
    src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/{word.audioUrl}&amp;show_user=false&show_artwork=false&show_playcount=false&download=false&sharing=false&buying=false"
  >
  </iframe>
{/each}
