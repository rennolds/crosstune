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
                console.warn(
                  `Widget ${widgetId} error (may be just source maps):`,
                  error
                );
                // Don't mark as unavailable for source map errors
                // Check if widget is functional after a delay
                setTimeout(() => {
                  try {
                    widget.isPaused((paused) => {
                      if (paused !== undefined) {
                        // Widget is responding, mark as ready
                        console.log(
                          `Widget ${widgetId} is functional despite errors`
                        );
                        markWidgetAsReady(widgetId);
                      } else {
                        // Widget is not responding, mark as unavailable
                        markWidgetAsUnavailable(widgetId);
                      }
                    });
                  } catch (e) {
                    // If isPaused fails, try one more check
                    try {
                      widget.play(); // This will fail if widget is not functional
                      widget.pause(); // Immediately pause
                      markWidgetAsReady(widgetId);
                    } catch (e2) {
                      markWidgetAsUnavailable(widgetId);
                    }
                  }
                }, 3000); // Give it 3 seconds to settle
                widget.unbind(SC.Widget.Events.ERROR, onError);
              };

              widget.bind(SC.Widget.Events.READY, onReady);
              widget.bind(SC.Widget.Events.ERROR, onError);

              // Also set a fallback timer to mark as ready if no events fire
              setTimeout(() => {
                try {
                  widget.isPaused((paused) => {
                    if (paused !== undefined) {
                      console.log(
                        `Widget ${widgetId} marked as ready via fallback`
                      );
                      markWidgetAsReady(widgetId);
                    }
                  });
                } catch (e) {
                  // Final fallback - just mark as ready and see if it works
                  console.log(
                    `Widget ${widgetId} final fallback - marking as ready`
                  );
                  markWidgetAsReady(widgetId);
                }
              }, 5000);
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
    src="https://w.soundcloud.com/player/?visual=true&url=https%3A//api.soundcloud.com/tracks/{word.audioUrl}&show_artwork=false&show_user=false&show_playcount=false&download=false&sharing=false&buying=false&auto_play=false"
  >
  </iframe>
{/each}
