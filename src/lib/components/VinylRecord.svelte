<script>
    let { isPlaying = false } = $props();
    let rotation = $state(0);
    let animationFrame;
    let speed = $state(0.25); // Current rotation speed in degrees per millisecond
    let lastPlaying = $state(false); // Track previous playing state for deceleration
    
    // Track the vinyl's rotation
    $effect(() => {
      if (isPlaying) {
        lastPlaying = true;
        speed = 0.25; // Normal playback speed
        
        let lastTime = performance.now();
        const rotateVinyl = (time) => {
          const delta = time - lastTime;
          rotation = (rotation + (delta * speed)) % 360;
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
      else if (lastPlaying) {
        // Start deceleration when transitioning from playing to stopped
        lastPlaying = false;
        
        let startTime = performance.now();
        let startSpeed = speed;
        const decelerationDuration = 1000; // 1 second deceleration
        
        let lastTime = startTime;
        const decelerateVinyl = (time) => {
          const delta = time - lastTime;
          const elapsedTime = time - startTime;
          
          if (elapsedTime < decelerationDuration) {
            // Linear deceleration from startSpeed to 0 over 1 second
            speed = startSpeed * (1 - elapsedTime / decelerationDuration);
            rotation = (rotation + (delta * speed)) % 360;
            lastTime = time;
            animationFrame = requestAnimationFrame(decelerateVinyl);
          } else {
            // Ensure we stop at exactly 0 speed
            speed = 0;
            if (animationFrame) {
              cancelAnimationFrame(animationFrame);
            }
          }
        };
        
        animationFrame = requestAnimationFrame(decelerateVinyl);
        
        return () => {
          if (animationFrame) {
            cancelAnimationFrame(animationFrame);
          }
        };
      }
    });
</script>
  
<div class="vinyl-container" style="transform: translate(-50%, -50%) rotate({rotation}deg)">
  <img src="/vinyl.png" alt="Vinyl Record" /> 
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