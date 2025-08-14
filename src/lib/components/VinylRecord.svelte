<script>
  let { isPlaying = false, theme = "black" } = $props();
  let rotation = $state(0);
  let animationFrame;
  let speed = $state(0); // Start with speed at 0
  let lastTime = $state(performance.now());
  let isInitialized = $state(false);
  let screenWidth = $state(window.innerWidth);

  const NORMAL_SPEED = 0.2; // Normal playback speed
  const SLOWDOWN_FACTOR = 0.965; // Factor to gradually reduce speed (96.5% each frame)
  const SPEEDUP_FACTOR = 1.12; // Factor to gradually increase speed (112% each frame)
  const MIN_SPEED = 0.001; // Speed at which we consider the record "stopped"

  // Track screen size changes
  $effect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => {
        screenWidth = window.innerWidth;
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  });

  // Track the vinyl's rotation
  $effect(() => {
    // Start or continue animation
    const animate = (time) => {
      const delta = time - lastTime;

      // Update rotation based on current speed
      rotation = (rotation + delta * speed) % 360;
      lastTime = time;

      // Handle speed changes based on playing state
      if (isPlaying) {
        // Gradually ramp up to normal speed
        if (speed < NORMAL_SPEED) {
          speed = Math.min(NORMAL_SPEED, speed * SPEEDUP_FACTOR);
        }
      } else {
        // Gradually slow down
        speed = speed * SLOWDOWN_FACTOR;

        // Stop the animation once we're below the minimum speed
        if (speed < MIN_SPEED) {
          speed = 0;
          cancelAnimationFrame(animationFrame);
          animationFrame = null;
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

    // If we need to start or continue animation
    if (isPlaying || speed > 0) {
      // If no animation is running, start one
      if (!animationFrame) {
        // When starting to play, set a small initial speed for ramp-up
        if (speed === 0 && isPlaying) {
          speed = 0.01; // Small initial speed for smoother ramp up
        }

        lastTime = performance.now();
        animationFrame = requestAnimationFrame(animate);
      }
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

<div
  class="vinyl-container"
  style="transform: translate(-50%, -50%) rotate({rotation}deg);"
>
  <img src="/{theme}_vinyl.png" alt="Vinyl Record" />
</div>

<style>
  .vinyl-container {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 90%; /* Base size relative to container */
    height: 90%;
    z-index: 1;
    transition: none;
    pointer-events: none;
    aspect-ratio: 1; /* Maintain perfect circle */
  }

  /* Ensure vinyl image is responsive */
  .vinyl-container img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  /* Mobile adjustments */
  /* Smallest phones (< 375px) */
  @media (max-width: 374px) {
    .vinyl-container {
      width: 82%; /* Reduced from 83% */
      height: 82%; /* Reduced from 83% */
      opacity: 0.8;
    }
  }

  /* Small-Medium phones (375px - 388px) */
  @media (min-width: 375px) and (max-width: 388px) {
    .vinyl-container {
      width: 88%;
      height: 88%;
      opacity: 0.8;
    }
  }

  /* Medium-Large phones (389px - 767px, includes iPhone 14) */
  @media (min-width: 389px) and (max-width: 767px) {
    .vinyl-container {
      width: 90%;
      height: 90%;
      opacity: 0.8;
    }
  }

  /* Desktop (>= 768px) */
  @media (min-width: 768px) {
    .vinyl-container {
      width: 95%;
      height: 95%;
      opacity: 1; /* Restore full opacity on desktop */
    }
  }
</style>
