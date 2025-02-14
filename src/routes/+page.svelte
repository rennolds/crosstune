<script>
    import CrosswordGrid from '$lib/components/CrosswordGrid.svelte';
    import { browser } from "$app/environment";

    // if (browser) {
    //     var iframeElement   = document.querySelector('iframe');
    //     // var iframeElementID = iframeElement.id;
    //     var widget1         = SC.Widget(iframeElement);
    //     // var widget2         = SC.Widget(iframeElementID);
    //     widget1.seekTo(500);

    //     if (widget1.isPaused()) {
    //         widget1.seekTo(500);
    //         widget1.play();
    //     }
    // }

    function handleWidgetClick() {
        widget1.play();
        widget1.seekTo(90000);
    }

</script>
  
<main class="md:container md:mx-auto md:px-4 md:py-8">
    <h1 class="text-4xl font-bold text-center mb-8 hidden md:block">Crosstune</h1>
    <CrosswordGrid />
</main>