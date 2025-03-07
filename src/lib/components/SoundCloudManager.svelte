<script>
    import { onMount } from 'svelte';
    
    let { words } = $props();
    
    // Create a store to track loaded widgets
    let loadedWidgets = $state(new Set());
    
    // Export a function to check if a widget is ready
    export function isWidgetReady(wordId) {
        return loadedWidgets.has(wordId);
    }
    
    onMount(() => {
        // Initialize the SC Widget API after component mounts
        window.onSCWidgetApiReady = function() {
            console.log("SoundCloud Widget API is ready");
            
            // Initialize each widget
            words.forEach(word => {
                const widgetId = `${word.startX}:${word.startY}:${word.direction}`;
                const iframe = document.getElementById(widgetId);
                
                if (iframe) {
                    const widget = SC.Widget(iframe);
                    
                    // Listen for READY event
                    widget.bind(SC.Widget.Events.READY, () => {
                        console.log(`Widget ${widgetId} is ready`);
                        loadedWidgets.add(widgetId);
                    });
                }
            });
        };
        
        // Check if SC is already defined (which means the API is loaded)
        if (window.SC && window.SC.Widget) {
            window.onSCWidgetApiReady();
        }
    });
</script>

{#each words as word}
    <iframe id="{word.startX}:{word.startY}:{word.direction}" class="hidden" scrolling="no" frameborder="no" allow="autoplay"
        src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/{word.audioUrl}&amp;show_user=false&show_artwork=false&show_playcount=false&download=false&sharing=false&buying=false">
    </iframe>
{/each}