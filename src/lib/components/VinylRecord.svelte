<script>
    let { isPlaying = false } = $props();
    let rotation = $state(0);
    let animationFrame;
    let speed = $state(0); // Start with speed at 0
    let lastTime = $state(performance.now());
    let isInitialized = $state(false);
    
    const NORMAL_SPEED = 0.25; // Normal playback speed
    const SLOWDOWN_FACTOR = 0.975; // Factor to gradually reduce speed (95% each frame)
    const MIN_SPEED = 0.001; // Speed at which we consider the record "stopped"
    
    // Track the vinyl's rotation
    $effect(() => {
        // Start or continue animation
        const animate = (time) => {
            const delta = time - lastTime;
            
            // Update rotation based on current speed
            rotation = (rotation + (delta * speed)) % 360;
            lastTime = time;
            
            // If not playing anymore, gradually slow down
            if (!isPlaying) {
                speed = speed * SLOWDOWN_FACTOR;
                
                // Stop the animation once we're below the minimum speed
                if (speed < MIN_SPEED) {
                    speed = 0;
                    return;
                }
            }
            
            animationFrame = requestAnimationFrame(animate);
        };
        
        // Set initialization flag after first render
        if (!isInitialized) {
            isInitialized = true;
            
            // If we start with isPlaying=false, don't do any animation
            if (!isPlaying) {
                speed = 0;
                return;
            }
        }
        
        // If playback started or changed
        if (isPlaying) {
            // Set to normal speed immediately when playing
            speed = NORMAL_SPEED;
            
            // If no animation is running, start one
            if (!animationFrame) {
                lastTime = performance.now();
                animationFrame = requestAnimationFrame(animate);
            }
        } else if (speed === 0) {
            // If we're completely stopped, don't start animation
            return;
        } else if (!animationFrame) {
            // If we need to slow down and no animation is running, start one
            lastTime = performance.now();
            animationFrame = requestAnimationFrame(animate);
        }
        
        // Cleanup when component is destroyed
        return () => {
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
                animationFrame = null;
            }
        };
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