<!-- src/lib/components/VinylRecord.svelte -->
<script>
    let { isPlaying = false } = $props();
  </script>
  
  <div class="vinyl-container" class:spinning={isPlaying}>
    <img src="/vinyl.svg" alt="Vinyl Record" /> 
  </div>
  
  <style>
    .vinyl-container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80%; /* Adjust the size as needed */
      max-width: 500px;
      z-index: -1;

    }
    
    .spinning {
      animation: spin 4s linear infinite;
    }
    
    @keyframes spin {
      0% {
        transform: translate(-50%, -50%) rotate(0deg);
      }
      100% {
        transform: translate(-50%, -50%) rotate(360deg);
      }
    }
  </style>