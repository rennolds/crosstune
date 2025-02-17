<script>
    import { generateCrossword } from '$lib/utils/crosswordGenerator';
    
    let backgroundImage = '';
    let words = [
      { word: '', textClue: '', audioUrl: '' },
      { word: '', textClue: '', audioUrl: '' },
      { word: '', textClue: '', audioUrl: '' },
      { word: '', textClue: '', audioUrl: '' },
      { word: '', textClue: '', audioUrl: '' },
      { word: '', textClue: '', audioUrl: '' },
      { word: '', textClue: '', audioUrl: '' },
      { word: '', textClue: '', audioUrl: '' }
    ];
    
    let result = null;
    let error = null;
    
    function generatePuzzle() {
      try {
        const validWords = words.filter(w => w.word.trim() !== '');
        if (validWords.length === 0) {
          error = 'Please enter at least one word';
          return;
        }
        const normalizedWords = validWords.map(w => ({
          ...w,
          word: w.word.toUpperCase().trim()
        }));
    
        const crosswordData = generateCrossword(normalizedWords);
        if (!crosswordData) {
          error = 'Could not generate a valid crossword with these words';
          return;
        }
        
        result = {
          size: { width: 12, height: 10 },
          backgroundImage: backgroundImage || undefined,
          ...crosswordData
        };
        error = null;
      } catch (e) {
        error = e.message;
      }
    }
    
    // When displaying the grid, show letters but render '#' as a block.
    function getDisplay(x, y) {
      if (!result || !result.grid) return '';
      const cell = result.grid[y][x];
      // If a blocked cell, you might show a filled square or leave it blank.
      return cell === '#' ? '' : cell || '';
    }
  </script>
  
  <div class="max-w-4xl mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">Crossword Generator</h1>
    
    <div class="mb-6">
      <label class="block mb-2">Background Image URL</label>
      <input
        type="text"
        bind:value={backgroundImage}
        class="w-full p-2 border rounded"
        placeholder="https://..."
      />
    </div>
    
    <div class="space-y-4">
      {#each words as wordObj}
        <div class="grid grid-cols-3 gap-4">
          <input type="text" bind:value={wordObj.word} placeholder="Word" class="p-2 border rounded" required />
          <input type="text" bind:value={wordObj.textClue} placeholder="Text Clue" class="p-2 border rounded" />
          <input type="text" bind:value={wordObj.audioUrl} placeholder="Audio Preview URL" class="p-2 border rounded" />
        </div>
      {/each}
    </div>
    
    <button on:click={generatePuzzle} class="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
      Generate Crossword
    </button>
    
    {#if error}
      <div class="mt-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>
    {/if}
    
    {#if result}
      <div class="mt-6">
        <h2 class="text-xl font-bold mb-4">Generated Crossword</h2>
        
        <!-- Visual Grid Preview -->
        <div class="mb-4 grid gap-px bg-gray-200" style="grid-template-columns: repeat(12, minmax(0, 1fr));">
          {#each Array(10) as _, y}
            {#each Array(12) as _, x}
              <div class="aspect-square flex items-center justify-center text-sm border">
                {getDisplay(x, y)}
              </div>
            {/each}
          {/each}
        </div>
    
        <!-- JSON Output -->
        <pre class="p-4 bg-gray-100 rounded overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
      </div>
    {/if}
  </div>
  