<script>
    let { isPlaying = false } = $props();
    let rotation = $state(0);
    let animationFrame;
    
    // Track the vinyl's rotation
    $effect(() => {
      if (isPlaying) {
        let lastTime = performance.now();
        const rotateVinyl = (time) => {
          const delta = time - lastTime;
          // Increase rotation speed to 0.25 degrees per millisecond
          rotation = (rotation + (delta * 0.25)) % 360;
          lastTime = time;
          animationFrame = requestAnimationFrame(rotateVinyl);
        };
        
        animationFrame = requestAnimationFrame(rotateVinyl);
        
        // Cleanup when not playing
        return () => {
          if (animationFrame) {
            cancelAnimationFrame(animationFrame);
          }
        };
      }
    });
</script>
  
<div class="vinyl-container" style="transform: translate(-50%, -50%) rotate({rotation}deg)">
  <img src="/vinyl.svg" alt="Vinyl Record" /> 
</div>
  
<style>
.vinyl-container {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 80%; /* Adjust the size as needed */
    max-width: 500px;
    z-index: -1;
    transition: none; /* Remove transition to prevent snap */
}
</style>