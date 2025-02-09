<script>
    let count = $state(0);
  </script>
  
  <div class="min-h-screen flex items-center justify-center flex-col gap-8 bg-gray-900 text-white">
    <button 
      onclick={() => count++}
      class="text-4xl font-bold hover:text-blue-400 transition-colors duration-300"
    >
      CROSSFADE, CLICK HERE
    </button>
    
    <div class="text-6xl font-mono">
      {count}
    </div>
</div>
</script>