<script>
    import CrosswordGrid from '$lib/components/CrosswordGrid.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
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
  
<main class="">
    <Navbar />
    <CrosswordGrid />
</main>