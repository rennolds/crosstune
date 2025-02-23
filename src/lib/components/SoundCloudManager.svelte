
<script>
    import { onMount } from 'svelte';
    let { words } = $props();
</script>

{#each words as word}
    <iframe id="{word.startX}:{word.startY}:{word.direction}" class="hidden" scrolling="no" frameborder="no" allow="autoplay"
        src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/{word.audioUrl}&amp;show_user=false&show_artwork=false&show_playcount=false&download=false&sharing=false&buying=false">
    </iframe>
{/each}