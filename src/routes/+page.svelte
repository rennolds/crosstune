<script>
    import CrosswordGrid from '$lib/components/CrosswordGrid.svelte';
    import { browser } from "$app/environment";

    if (browser) {
        var iframeElement   = document.querySelector('iframe');
        // var iframeElementID = iframeElement.id;
        var widget1         = SC.Widget(iframeElement);
        // var widget2         = SC.Widget(iframeElementID);
        widget1.seekTo(500);

        if (widget1.isPaused()) {
            widget1.seekTo(500);
            widget1.play();
        }
    }

    function handleWidgetClick() {
        widget1.play();
        widget1.seekTo(90000);
    }

</script>
  
<main class="container mx-auto px-4 py-8">
    <button onclick={handleWidgetClick()}>click me!</button>
    <iframe class="hidden" id="soundcloud" width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay"
        src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/293&amp;show_user=false&show_artwork=false&show_playcount=false&download=false&sharing=false&buying=false">
    </iframe>
    <h1 class="text-4xl font-bold text-center mb-8">Crosstune</h1>
    <CrosswordGrid />
</main>