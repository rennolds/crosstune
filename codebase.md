# .gitignore

```
node_modules

# Output
.output
.vercel
.netlify
.wrangler
/.svelte-kit
/build

# OS
.DS_Store
Thumbs.db

# Env
.env
.env.*
!.env.example
!.env.test

# Vite
vite.config.js.timestamp-*
vite.config.ts.timestamp-*

```

# .npmrc

```
engine-strict=true

```

# jsconfig.json

```json
{
	"extends": "./.svelte-kit/tsconfig.json",
	"compilerOptions": {
		"allowJs": true,
		"checkJs": false,
		"moduleResolution": "bundler"
	}
	// Path aliases are handled by https://svelte.dev/docs/kit/configuration#alias
	// except $lib which is handled by https://svelte.dev/docs/kit/configuration#files
	//
	// If you want to overwrite includes/excludes, make sure to copy over the relevant includes/excludes
	// from the referenced tsconfig.json - TypeScript does not merge them in
}

```

# package.json

```json
{
	"name": "crosstune",
	"private": true,
	"version": "0.0.1",
	"type": "module",
	"scripts": {
		"dev": "vite dev",
		"build": "vite build",
		"preview": "vite preview",
		"prepare": "svelte-kit sync || echo ''"
	},
	"devDependencies": {
		"@sveltejs/adapter-cloudflare": "^5.0.1",
		"@sveltejs/kit": "^2.16.0",
		"@sveltejs/vite-plugin-svelte": "^5.0.0",
		"@tailwindcss/vite": "^4.0.0",
		"svelte": "^5.0.0",
		"tailwindcss": "^4.0.0",
		"vite": "^6.0.0"
	}
}

```

# README.md

```md
# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

\`\`\`bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
\`\`\`

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

\`\`\`bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
\`\`\`

## Building

To create a production version of your app:

\`\`\`bash
npm run build
\`\`\`

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

```

# src/app.css

```css
@import 'tailwindcss'

```

# src/app.html

```html
<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<link rel="icon" href="%sveltekit.assets%/favicon.png" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		%sveltekit.head%
	</head>
	<body data-sveltekit-preload-data="hover">
		<div style="display: contents">%sveltekit.body%</div>
	</body>
</html>
<script>

	var SC="object"==typeof SC?SC:{};SC.Widget=function(e){var t={};function n(r){if(t[r])return t[r].exports;var o=t[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}return n.m=e,n.c=t,n.d=function(e,t,r){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)n.d(r,o,function(t){return e[t]}.bind(null,o));return r},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=0)}([function(e,t,n){var r,o,i,u=n(1),a=n(2),c=n(3),s=u.api,l=u.bridge,d=[],f=[],p=/^http(?:s?)/;function E(e){var t,n;for(t=0,n=f.length;t<n&&!1!==e(f[t]);t++);}function v(e){return e.contentWindow?e.contentWindow:e.contentDocument&&"parentWindow"in e.contentDocument?e.contentDocument.parentWindow:null}function _(e){var t,n=[];for(t in e)e.hasOwnProperty(t)&&n.push(e[t]);return n}function S(e,t,n){n.callbacks[e]=n.callbacks[e]||[],n.callbacks[e].push(t)}function h(e,t){var n=!0;return t.callbacks[e]=[],E((function(t){if((t.callbacks[e]||[]).length)return n=!1,!1})),n}function y(e,t,n){var r,o,i=v(n);if(!i.postMessage)return!1;r=n.getAttribute("src").split("?")[0],o=JSON.stringify({method:e,value:t}),"//"===r.substr(0,2)&&(r=window.location.protocol+r),r=r.replace(/http:\/\/(w|wt).soundcloud.com/,"https://$1.soundcloud.com"),i.postMessage(o,r)}function b(e){var t;return E((function(n){if(n.instance===e)return t=n,!1})),t}function g(e){var t;return E((function(n){if(v(n.element)===e)return t=n,!1})),t}function m(e,t){return function(n){var r,o=!!((r=n)&&r.constructor&&r.call&&r.apply),i=b(this),u=!o&&t?n:null,a=o&&!t?n:null;return a&&S(e,a,i),y(e,u,i.element),this}}function R(e,t,n){var r,o,i;for(r=0,o=t.length;r<o;r++)e[i=t[r]]=m(i,n)}function O(e,t,n){return e+"?url="+t+"&"+function(e){var t,n,r=[];for(t in e)e.hasOwnProperty(t)&&(n=e[t],r.push(t+"="+("start_track"===t?parseInt(n,10):n?"true":"false")));return r.join("&")}(n)}function w(e,t,n){var r,o,i=e.callbacks[t]||[];for(r=0,o=i.length;r<o;r++)i[r].apply(e.instance,n);(function(e){var t,n=!1;for(t in a)if(a.hasOwnProperty(t)&&a[t]===e){n=!0;break}return n}(t)||t===s.READY)&&(e.callbacks[t]=[])}function A(e){var t,n,r,o,i;try{n=JSON.parse(e.data)}catch(e){return!1}return t=g(e.source),r=n.method,o=n.value,(!t||P(e.origin)===P(t.domain))&&(t?(r===s.READY&&(t.isReady=!0,w(t,"__LATE_BINDING__"),h("__LATE_BINDING__",t)),r!==s.PLAY||t.playEventFired||(t.playEventFired=!0),r!==s.PLAY_PROGRESS||t.playEventFired||(t.playEventFired=!0,w(t,s.PLAY,[o])),i=[],void 0!==o&&i.push(o),void w(t,r,i)):(r===s.READY&&d.push(e.source),!1))}function P(e){return e.replace(p,"")}window.addEventListener?window.addEventListener("message",A,!1):window.attachEvent("onmessage",A),e.exports=i=function(e,t,n){var i;if((""===(i=e)||i&&i.charCodeAt&&i.substr)&&(e=document.getElementById(e)),!function(e){return!(!e||1!==e.nodeType||"IFRAME"!==e.nodeName.toUpperCase())}(e))throw new Error("SC.Widget function should be given either iframe element or a string specifying id attribute of iframe element.");t&&(n=n||{},e.src=O("https://wt.soundcloud.test:9200/",t,n));var u,a,c=g(v(e));return c&&c.instance?c.instance:(u=d.indexOf(v(e))>-1,a=new r(e),f.push(new o(a,e,u)),a)},i.Events=s,window.SC=window.SC||{},window.SC.Widget=i,o=function(e,t,n){this.instance=e,this.element=t,this.domain=function(e){var t,n,r,o="";"//"===e.substr(0,2)&&(e=window.location.protocol+e);for(r=e.split("/"),t=0,n=r.length;t<n&&t<3;t++)o+=r[t],t<2&&(o+="/");return o}(t.getAttribute("src")),this.isReady=!!n,this.callbacks={}},(r=function(){}).prototype={constructor:r,load:function(e,t){if(e){t=t||{};var n=this,r=b(this),o=r.element,i=o.src,u=i.substr(0,i.indexOf("?"));r.isReady=!1,r.playEventFired=!1,o.onload=function(){n.bind(s.READY,(function(){var e,n=r.callbacks;for(e in n)n.hasOwnProperty(e)&&e!==s.READY&&y(l.ADD_LISTENER,e,r.element);t.callback&&t.callback()}))},o.src=O(u,e,t)}},bind:function(e,t){var n=this,r=b(this);return r&&r.element&&(e===s.READY&&r.isReady?setTimeout(t,1):r.isReady?(S(e,t,r),y(l.ADD_LISTENER,e,r.element)):S("__LATE_BINDING__",(function(){n.bind(e,t)}),r)),this},unbind:function(e){var t,n=b(this);n&&n.element&&(t=h(e,n),e!==s.READY&&t&&y(l.REMOVE_LISTENER,e,n.element))}},R(r.prototype,_(a)),R(r.prototype,_(c),!0)},function(e,t){t.api={LOAD_PROGRESS:"loadProgress",PLAY_PROGRESS:"playProgress",PLAY:"play",PAUSE:"pause",FINISH:"finish",SEEK:"seek",READY:"ready",OPEN_SHARE_PANEL:"sharePanelOpened",CLICK_DOWNLOAD:"downloadClicked",CLICK_BUY:"buyClicked",ERROR:"error"},t.bridge={REMOVE_LISTENER:"removeEventListener",ADD_LISTENER:"addEventListener"}},function(e,t){e.exports={GET_VOLUME:"getVolume",GET_DURATION:"getDuration",GET_POSITION:"getPosition",GET_SOUNDS:"getSounds",GET_CURRENT_SOUND:"getCurrentSound",GET_CURRENT_SOUND_INDEX:"getCurrentSoundIndex",IS_PAUSED:"isPaused"}},function(e,t){e.exports={PLAY:"play",PAUSE:"pause",TOGGLE:"toggle",SEEK_TO:"seekTo",SET_VOLUME:"setVolume",NEXT:"next",PREV:"prev",SKIP:"skip"}}]);
//# sourceMappingURL=http://ent/web-sourcemaps/api.js-4950e94a9243.map
</script>
```

# src/lib/components/CrosswordGrid.svelte

```svelte
<script>
  import crosswords from "$lib/data/crosswords.json";
  import MobileKeyboard from './MobileKeyboard.svelte';

  let isMobileDevice = $state(false);

  $effect(() => {
    isMobileDevice = window.matchMedia('(max-width: 768px)').matches;
    
    // Listen for changes in screen size
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handler = (e) => isMobileDevice = e.matches;
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  });

  // Get today's puzzle
  const puzzle = crosswords["2024-02-09"];
  const { size, words } = puzzle;

  // Create grid and message state
  let grid = $state(
    Array(size.height)
      .fill(null)
      .map(() => Array(size.width).fill(null))
  );
  let message = $state("");
  let isCorrect = $state(false);
  let highlightedWord = $state(null);

  // Track currently focused cell
  let focusedX = $state(0);
  let focusedY = $state(0);

  // Audio player state
  let currentAudio = $state(null);
  let isPlaying = $state(false);

  // Generate word numbers and organize clues
  let wordNumbers = $state(new Map());
  let currentNumber = 1;

  let acrossClues = $state([]);
  let downClues = $state([]);

  // Map to track which cells should be spaces
  let spaceCells = $state(new Map());

  words.forEach((word) => {
    const key = `${word.startX},${word.startY}`;
    let number;
    if (!wordNumbers.has(key)) {
      number = currentNumber++;
      wordNumbers.set(key, number);
    } else {
      number = wordNumbers.get(key);
    }

    // Mark spaces in the word
    [...word.word].forEach((char, index) => {
      if (char === " ") {
        const x =
          word.direction === "across" ? word.startX + index : word.startX;
        const y =
          word.direction === "across" ? word.startY : word.startY + index;
        spaceCells.set(`${x},${y}`, true);
      }
    });

    const clue = {
      number,
      word: word.word,
      audioUrl: word.audioUrl,
      startX: word.startX,
      startY: word.startY,
      direction: word.direction,
      length: word.word.length,
    };

    if (word.direction === "across") {
      acrossClues.push(clue);
    } else {
      downClues.push(clue);
    }
  });

  // Sort clues by number
  acrossClues.sort((a, b) => a.number - b.number);
  downClues.sort((a, b) => a.number - b.number);

  // Helper to check if a cell should be an input cell
  function isInputCell(x, y) {
    return words.some((word) => {
      if (word.direction === "across") {
        return (
          word.startY === y &&
          x >= word.startX &&
          x < word.startX + word.word.length
        );
      } else {
        return (
          word.startX === x &&
          y >= word.startY &&
          y < word.startY + word.word.length
        );
      }
    });
  }

  // Initialize grid cells
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      if (isInputCell(x, y)) {
        // If it's a space cell, pre-fill it with a space
        if (spaceCells.has(`${x},${y}`)) {
          grid[y][x] = " ";
        } else {
          grid[y][x] = "";
        }
      }
    }
  }

  // Add state for direction
  let currentDirection = $state("across");

  // Modify handleCellClick to detect if cell is start of a word
  function handleCellClick(x, y) {
    console.log('Clicked cell:', x, y);

    // Check if clicked cell is start of any words
    const isStartOfAcross = words.some(word => {
      const isStart = word.direction === 'across' && word.startX === x && word.startY === y;
      if (isStart) console.log('Found start of across word:', word);
      return isStart;
    });
    
    const isStartOfDown = words.some(word => {
      const isStart = word.direction === 'down' && word.startX === x && word.startY === y;
      if (isStart) console.log('Found start of down word:', word); 
      return isStart;
    });

    // Set direction if it's the start of a word
    if (isStartOfAcross) {
      console.log('Setting direction to across');
      currentDirection = 'across';
    } else if (isStartOfDown) {
      console.log('Setting direction to down');
      currentDirection = 'down';
    }

    console.log('Current direction:', currentDirection);

    focusedX = x;
    focusedY = y;
  }

  function findNextWordStart(currentX, currentY) {
    // Get all word starting positions sorted by position
    let startPositions = [...words].sort((a, b) => {
      if (a.startY === b.startY) {
        return a.startX - b.startX;
      }
      return a.startY - b.startY;
    });

    // Find the next word start position
    let nextWord = startPositions.find(word => {
      // If we're on the same row, find the next word to the right
      if (word.startY === currentY) {
        return word.startX > currentX;
      }
      // Otherwise, find the first word in the next row
      return word.startY > currentY;
    });

    // If no next word found, wrap around to the first word
    if (!nextWord) {
      nextWord = startPositions[0];
    }

    return {
      x: nextWord.startX,
      y: nextWord.startY,
      direction: nextWord.direction
    };
  }
  // Modify moveFocus to be more reliable
  function moveFocus(newX, newY) {
    // First check bounds
    if (newX < 0 || newY < 0 || newX >= size.width || newY >= size.height) {
      return;
    }

    // If we hit a space cell, skip to next cell in current direction
    if (grid[newY][newX] !== null && spaceCells.has(`${newX},${newY}`)) {
      if (currentDirection === 'across') {
        moveFocus(newX + 1, newY);
      } else {
        moveFocus(newX, newY + 1);
      }
      return;
    }

    // If it's a valid cell, focus it
    if (grid[newY][newX] !== null && !spaceCells.has(`${newX},${newY}`)) {
      focusedX = newX;
      focusedY = newY;
      const input = document.querySelector(`input[data-x="${newX}"][data-y="${newY}"]`);
      input?.focus();
    }
  }

  // Modify handleKeydown to move in the current direction
// ... previous code ...

function handleKeydown(event, x, y) {
    console.log('Key pressed:', event.key);  // Debug log
    
    if (spaceCells.has(`${x},${y}`)) {
        event.preventDefault();
        return;
    }

    const input = event.target;

    switch (event.key) {
        case 'Tab':
            event.preventDefault();
            const nextWord = findNextWordStart(x, y);
            focusedX = nextWord.x;
            focusedY = nextWord.y;
            currentDirection = nextWord.direction;
            const nextInput = document.querySelector(
                `input[data-x="${nextWord.x}"][data-y="${nextWord.y}"]`
            );
            nextInput?.focus();
            break;
        case 'ArrowRight':
            event.preventDefault();
            currentDirection = 'across';
            moveFocus(x + 1, y);
            break;
        case 'ArrowLeft':
            event.preventDefault();
            currentDirection = 'across';
            moveFocus(x - 1, y);
            break;
        case 'ArrowUp':
            event.preventDefault();
            currentDirection = 'down';
            moveFocus(x, y - 1);
            break;
        case 'ArrowDown':
            event.preventDefault();
            currentDirection = 'down';
            moveFocus(x, y + 1);
            break;
        case ' ':
        case 'Space':
            event.preventDefault();
            if (currentDirection === 'across') {
                moveFocus(x + 1, y);
            } else {
                moveFocus(x, y + 1);
            }
            break;
            case 'Backspace':
              // Clear current cell if it has a value
              if (grid[y][x]) {
                  grid[y][x] = '';
              }
              // Move to previous cell
              if (currentDirection === 'across') {
                  // Keep moving back until we find a non-space cell or hit the edge
                  let newX = x - 1;
                  while (newX >= 0 && spaceCells.has(`${newX},${y}`)) {
                      newX--;
                  }
                  if (newX >= 0) {
                      moveFocus(newX, y);
                  }
              } else {
                  // Keep moving up until we find a non-space cell or hit the edge
                  let newY = y - 1;
                  while (newY >= 0 && spaceCells.has(`${x},${newY}`)) {
                      newY--;
                  }
                  if (newY >= 0) {
                      moveFocus(x, newY);
                  }
              }
            break;
        default:
            // Changed this part to handle both upper and lowercase letters
            if (event.key.length === 1 && event.key.match(/[a-zA-Z]/i)) {
                // Set the value explicitly to uppercase
                input.value = event.key.toUpperCase();
                requestAnimationFrame(() => {
                    if (currentDirection === 'across') {
                        moveFocus(x + 1, y);
                    } else {
                        moveFocus(x, y + 1);
                    }
                });
            }
    }
}

  function checkWord(word) {
    const letters = [];
    if (word.direction === "across") {
      for (let x = word.startX; x < word.startX + word.word.length; x++) {
        letters.push(grid[word.startY][x]);
      }
    } else {
      for (let y = word.startY; y < word.startY + word.word.length; y++) {
        letters.push(grid[y][word.startX]);
      }
    }
    return letters.join("").toUpperCase() === word.word;
  }

  // Add new function to handle virtual keyboard input
  function handleVirtualKeyPress(key) {
    // For backspace, we need to handle it specially since it's an action rather than a character input
    if (key === 'Backspace') {
        // Clear current cell if it has a value
        if (grid[focusedY][focusedX]) {
            grid[focusedY][focusedX] = '';
        }
        
        // Move to previous cell
        if (currentDirection === 'across') {
            let newX = focusedX - 1;
            while (newX >= 0 && spaceCells.has(`${newX},${focusedY}`)) {
                newX--;
            }
            if (newX >= 0) {
                moveFocus(newX, focusedY);
            }
        } else {
            let newY = focusedY - 1;
            while (newY >= 0 && spaceCells.has(`${focusedX},${newY}`)) {
                newY--;
            }
            if (newY >= 0) {
                moveFocus(focusedX, newY);
            }
        }
        return;
    }

    // Create a synthetic event for other keys
    const syntheticEvent = {
        key,
        preventDefault: () => {},
        target: document.querySelector(`input[data-x="${focusedX}"][data-y="${focusedY}"]`)
    };

    handleKeydown(syntheticEvent, focusedX, focusedY);
  }

  function submitGuess() {
    // Check if all non-space cells are filled
    const hasEmptyCells = grid.some((row, y) =>
      row.some((cell, x) => cell === "" && !spaceCells.has(`${x},${y}`))
    );

    if (hasEmptyCells) {
      message = "Please fill in all cells before submitting";
      isCorrect = false;
      return;
    }

    const allCorrect = words.every(checkWord);

    if (allCorrect) {
      message = "Congratulations! All words are correct!";
      isCorrect = true;
    } else {
      message = "Some words are incorrect. Try again!";
      isCorrect = false;
    }
  }

  async function playClue(clue) {
    try {
      console.log("Starting playback for URL:", clue.audioUrl);

      // Stop any currently playing audio
      if (currentAudio) {
        console.log("Stopping previous audio");
        currentAudio.pause();
        currentAudio = null;
      }
      isPlaying = false;

      // Highlight the word
      highlightedWord = clue;

      // Create and play new audio
      const audio = new Audio(clue.audioUrl);
      currentAudio = audio;

      console.log("Waiting for audio to load...");

      // Wait for audio to load
      await new Promise((resolve, reject) => {
        audio.addEventListener("loadedmetadata", () => {
          console.log("Audio metadata loaded");
          resolve();
        });
        audio.addEventListener("error", (e) => {
          console.log("Audio loading error:", e);
          reject(e);
        });
      });

      console.log("Starting playback...");
      await audio.play();
      console.log("Playback started");
      isPlaying = true;

      // Set timeout to stop after 2 seconds
      setTimeout(() => {
        if (currentAudio === audio) {
          console.log("Stopping audio after 1 seconds");
          audio.pause();
          isPlaying = false;
          currentAudio = null;
          highlightedWord = null;
        }
      }, 1500);

      // Still keep the ended event listener for cases where the audio might end before 2 seconds
      audio.addEventListener("ended", () => {
        console.log("Audio playback ended");
        isPlaying = false;
        currentAudio = null;
        highlightedWord = null;
      });
    } catch (error) {
      console.error("Error playing audio:", error);
      console.error("Audio element error:", currentAudio?.error);
      isPlaying = false;
      currentAudio = null;
      highlightedWord = null;
    }
  }

  function isCellHighlighted(x, y) {
    if (!highlightedWord) return false;

    if (highlightedWord.direction === "across") {
      return (
        y === highlightedWord.startY &&
        x >= highlightedWord.startX &&
        x < highlightedWord.startX + highlightedWord.length
      );
    } else {
      return (
        x === highlightedWord.startX &&
        y >= highlightedWord.startY &&
        y < highlightedWord.startY + highlightedWord.length
      );
    }
  }
</script>

<div class="flex flex-col md:flex-row items-start gap-8 p-4">
  <!-- Crossword Grid -->
  <div class="flex flex-col items-center">
    <div
      class="grid bg-black mb-6"
      style="grid-template-columns: repeat({size.width}, minmax(0, 1fr)); gap: 1px;"
    >
      {#each grid as row, y}
        {#each row as cell, x}
          <div
            class="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center relative
                   {cell === null
              ? 'bg-black'
              : isCellHighlighted(x, y)
                ? 'bg-yellow-200'
                : 'bg-white'} 
                   transition-colors duration-200"
          >
            {#if cell !== null}
              {#if wordNumbers.has(`${x},${y}`)}
                <span class="absolute text-xs top-0 left-0.5">
                  {wordNumbers.get(`${x},${y}`)}
                </span>
              {/if}

              {#if spaceCells.has(`${x},${y}`)}
                <div
                  class="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400"
                >
                  ␣
                </div>
              {:else}
              <input
                type="text"
                maxlength="1"
                data-x={x}
                data-y={y}
                class="w-full h-full text-center uppercase font-bold text-lg focus:outline-none bg-transparent"
                class:cursor-text={!isMobileDevice}
                bind:value={grid[y][x]}
                onkeydown={(e) => handleKeydown(e, x, y)}
                onclick={() => handleCellClick(x, y)}
                {...(isMobileDevice ? {
                  readonly: true,
                  inputmode: "none",
                  tabindex: "-1"
                } : {})}
              />
              {/if}
            {/if}
          </div>
        {/each}
      {/each}
    </div>

    <button
      onclick={submitGuess}
      class="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
    >
      Submit
    </button>

    {#if message}
      <div
        class="text-lg font-semibold {isCorrect
          ? 'text-green-600'
          : 'text-red-600'}"
      >
        {message}
      </div>
    {/if}
  </div>

  <!-- Clue Lists -->

  <MobileKeyboard onKeyPress={handleVirtualKeyPress} />
  <div class="flex flex-col gap-6 w-full md:w-64">
    <!-- Across Clues -->
    <div>
      <h2 class="text-xl font-bold mb-2">Across</h2>
      <div class="space-y-2">
        {#each acrossClues as clue}
          <div class="flex items-center gap-2">
            <span class="font-medium w-6">{clue.number}.</span>
            <span class="text-sm">{clue.length} letters</span>
            <button
              onclick={() => playClue(clue)}
              class="ml-auto px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isPlaying}
            >
              {isPlaying ? "Playing..." : "Play"}
            </button>
          </div>
        {/each}
      </div>
    </div>

    <!-- Down Clues -->
    <div>
      <h2 class="text-xl font-bold mb-2">Down</h2>
      <div class="space-y-2">
        {#each downClues as clue}
          <div class="flex items-center gap-2">
            <span class="font-medium w-6">{clue.number}.</span>
            <span class="text-sm">{clue.length} letters</span>
            <button
              onclick={() => playClue(clue)}
              class="ml-auto px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            >
              Play
            </button>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  /* Add padding at the bottom to prevent the keyboard from covering the grid on mobile */
  @media (max-width: 768px) {
    :global(body) {
      padding-bottom: 220px;
    }
  }
  
  .cursor-text {
    cursor: text;
  }
</style>
```

# src/lib/components/MobileKeyboard.svelte

```svelte
<script>
    // Handle key presses
    let { onKeyPress } = $props();
  
    // Define keyboard layout
    const keyboardLayout = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
    ];
  </script>
  
  <div class="virtual-keyboard md:hidden fixed bottom-0 left-0 right-0 bg-gray-100 p-2 shadow-lg">
    {#each keyboardLayout as row}
      <div class="flex justify-center gap-1 mb-1">
        {#each row as key}
          <button
            class="w-8 h-10 bg-white rounded shadow flex items-center justify-center text-sm font-semibold hover:bg-gray-200 active:bg-gray-300"
            onclick={() => onKeyPress(key)}
          >
            {key}
          </button>
        {/each}
      </div>
    {/each}
    <div class="flex justify-center gap-2">
      <button
        class="px-4 py-2 bg-white rounded shadow flex items-center justify-center text-sm font-semibold hover:bg-gray-200 active:bg-gray-300"
        onclick={() => onKeyPress('Space')}
      >
        Space
      </button>
      <button
        class="px-4 py-2 bg-white rounded shadow flex items-center justify-center text-sm font-semibold hover:bg-gray-200 active:bg-gray-300"
        onclick={() => onKeyPress('Backspace')}
      >
        ⌫
      </button>
    </div>
  </div>
```

# src/lib/data/crosswords.json

```json
{
    "2024-02-09": {
      "size": {
        "width": 16,
        "height": 15
      },
      "words": [
        {
          "word": "THIS LOVE",
          "startX": 13,
          "startY": 1,
          "direction": "down",
          "audioUrl": "https://p.scdn.co/mp3-preview/05d17c445a19455c74237d48b5d6e780f899f1ee"
        },
        {
          "word": "PERFECT",
          "startX": 7,
          "startY": 2,
          "direction": "down",
          "audioUrl": "https://p.scdn.co/mp3-preview/4e30857a3c7da3f8891483643e310bb233afadd2?cid=98f79e400795491cbc5f69b713465708"
        },
        {
          "word": "STAY WITH ME",
          "startX": 3,
          "startY": 2,
          "direction": "down",
          "audioUrl": "https://p.scdn.co/mp3-preview/a6673e86dccaf0232ab041314ec716e03e2f34fc?cid=98f79e400795491cbc5f69b713465708"
        },
        {
          "word": "NO ROLE MODELZ",
          "startX": 1,
          "startY": 6,
          "direction": "across",
          "audioUrl": "https://p.scdn.co/mp3-preview/062b69c85ad8361d6d7e484aa798b3596d174306?cid=98f79e400795491cbc5f69b713465708"
        },
        {
          "word": "YELLOW",
          "startX": 6,
          "startY": 3,
          "direction": "across",
          "audioUrl": "https://p.scdn.co/mp3-preview/c0d9119dc69cae75baf6463e21e43f433fdf5ff4?cid=98f79e400795491cbc5f69b713465708"
        }
      ]
    }
  }

```

# src/lib/index.js

```js
// place files you want to import through the `$lib` alias in this folder.

```

# src/routes/+layout.svelte

```svelte
<script>
	import '../app.css';
	let { children } = $props();
</script>

{@render children()}

```

# src/routes/+page.svelte

```svelte
<script>
    import CrosswordGrid from '$lib/components/CrosswordGrid.svelte';
    import { browser } from "$app/environment";

    if (browser) {
        var iframeElement   = document.querySelector('iframe');
        // var iframeElementID = iframeElement.id;
        var widget1         = SC.Widget(iframeElement);
        // var widget2         = SC.Widget(iframeElementID);
        widget1.seekTo(500);

        if (widget1.isPaused()) {
            widget1.seekTo(500);
            widget1.play();
        }
    }

    function handleWidgetClick() {
        widget1.play();
        widget1.seekTo(90000);
    }

</script>
  
<main class="container mx-auto px-4 py-8">
    <button onclick={handleWidgetClick()}>click me!</button>
    <iframe class="hidden" id="soundcloud" width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay"
        src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/293&amp;show_user=false&show_artwork=false&show_playcount=false&download=false&sharing=false&buying=false">
    </iframe>
    <h1 class="text-4xl font-bold text-center mb-8">Crosstune</h1>
    <CrosswordGrid />
</main>
```

# static/favicon.png

This is a binary file of the type: Image

# svelte.config.js

```js
import adapter from "@sveltejs/adapter-cloudflare";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter()
	}
};

export default config;

```

# vite.config.js

```js
import tailwindcss from "@tailwindcss/vite";
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit(), tailwindcss()]
});

```

