<script>
  import {
    markWidgetAsReady,
    markWidgetAsUnavailable,
  } from "$lib/stores/game.svelte.js";

  let { words } = $props();

  $effect(() => {
    function initializeWidgets() {
      console.log("Initializing SoundCloud Widgets for current words...");

      words.forEach((word) => {
        const widgetId = `${word.startX}:${word.startY}:${word.direction}`;
        requestAnimationFrame(() => {
          const iframe = document.getElementById(widgetId);

          if (iframe) {
            try {
              const widget = SC.Widget(iframe);

              const onReady = () => {
                console.log(`Widget ${widgetId} is ready`);
                markWidgetAsReady(widgetId);
                widget.unbind(SC.Widget.Events.READY, onReady);
              };

              const onError = (error) => {
                console.warn(`Widget ${widgetId} failed to load:`, error);
                markWidgetAsUnavailable(widgetId);
                widget.unbind(SC.Widget.Events.ERROR, onError);
              };

              widget.bind(SC.Widget.Events.READY, onReady);
              widget.bind(SC.Widget.Events.ERROR, onError);
            } catch (e) {
              console.error(`Error creating SC.Widget for ${widgetId}:`, e);
              markWidgetAsUnavailable(widgetId);
            }
          } else {
            // This might happen briefly during transitions, usually not an error
            // console.warn(`Iframe ${widgetId} not found during initialization.`);
          }
        });
      });
    }

    if (window.SC && window.SC.Widget) {
      initializeWidgets();
    } else {
      window.onSCWidgetApiReady = initializeWidgets;
    }

    return () => {
      if (window.onSCWidgetApiReady === initializeWidgets) {
        window.onSCWidgetApiReady = undefined;
      }
    };
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
