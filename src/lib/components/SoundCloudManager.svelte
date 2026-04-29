<script>
  import {
    markWidgetAsReady,
    markWidgetAsUnavailable,
  } from "$lib/stores/game.svelte.js";

  let { words } = $props();

  $effect(() => {
    if (typeof window === "undefined") return;

    let destroyed = false;
    const pendingRafs = [];
    const pendingTimeouts = [];

    function initializeWidgets() {
      console.log("Initializing SoundCloud Widgets for current words...");

      words.forEach((word) => {
        const widgetId = `${word.startX}:${word.startY}:${word.direction}`;
        const rafId = requestAnimationFrame(() => {
          if (destroyed) return;
          const iframe = document.getElementById(widgetId);

          if (iframe) {
            try {
              const widget = SC.Widget(iframe);

              const onReady = () => {
                if (!destroyed) {
                  console.log(`Widget ${widgetId} is ready`);
                  markWidgetAsReady(widgetId);
                }
                widget.unbind(SC.Widget.Events.READY, onReady);
              };

              const onError = (error) => {
                console.warn(
                  `Widget ${widgetId} error (may be just source maps):`,
                  error
                );
                widget.unbind(SC.Widget.Events.ERROR, onError);
                const t = setTimeout(() => {
                  if (destroyed) return;
                  try {
                    widget.isPaused((paused) => {
                      if (destroyed) return;
                      if (paused !== undefined) {
                        console.log(
                          `Widget ${widgetId} is functional despite errors`
                        );
                        markWidgetAsReady(widgetId);
                      } else {
                        markWidgetAsUnavailable(widgetId);
                      }
                    });
                  } catch (e) {
                    try {
                      widget.play();
                      widget.pause();
                      markWidgetAsReady(widgetId);
                    } catch (e2) {
                      markWidgetAsUnavailable(widgetId);
                    }
                  }
                }, 3000);
                pendingTimeouts.push(t);
              };

              widget.bind(SC.Widget.Events.READY, onReady);
              widget.bind(SC.Widget.Events.ERROR, onError);

              const t = setTimeout(() => {
                if (destroyed) return;
                try {
                  widget.isPaused((paused) => {
                    if (destroyed) return;
                    if (paused !== undefined) {
                      console.log(
                        `Widget ${widgetId} marked as ready via fallback`
                      );
                      markWidgetAsReady(widgetId);
                    }
                  });
                } catch (e) {
                  console.log(
                    `Widget ${widgetId} final fallback - marking as ready`
                  );
                  markWidgetAsReady(widgetId);
                }
              }, 5000);
              pendingTimeouts.push(t);
            } catch (e) {
              console.error(`Error creating SC.Widget for ${widgetId}:`, e);
              if (!destroyed) markWidgetAsUnavailable(widgetId);
            }
          }
        });
        pendingRafs.push(rafId);
      });
    }

    if (typeof window !== "undefined" && window.SC && window.SC.Widget) {
      initializeWidgets();
    } else {
      if (typeof window !== "undefined") {
        window.onSCWidgetApiReady = initializeWidgets;
      }
    }

    return () => {
      destroyed = true;
      pendingRafs.forEach((id) => cancelAnimationFrame(id));
      pendingTimeouts.forEach((id) => clearTimeout(id));
      if (typeof window !== "undefined") {
        if (window.onSCWidgetApiReady === initializeWidgets) {
          window.onSCWidgetApiReady = undefined;
        }
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
