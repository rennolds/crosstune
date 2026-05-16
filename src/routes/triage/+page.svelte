<script>
  import { untrack } from 'svelte';

  let { data } = $props();

  let queue = $state(data.queue);
  let idx = $state(0);
  let current = $derived(queue[idx]);
  let done = $derived(idx >= queue.length);

  let searchQuery = $state('');
  let searching = $state(false);
  let results = $state([]);
  let manualId = $state('');
  let submitting = $state(false);
  let errorMsg = $state('');

  let previewingId = $state(null);
  let previewAudio = $state(null);

  // Re-run search whenever the current word changes. untrack() so writes/reads
  // of searchQuery etc. inside don't cause this effect to re-fire on keystrokes.
  $effect(() => {
    const c = current;
    if (!c) return;
    untrack(() => {
      searchQuery = `${c.song_title} ${c.artist_name}`.trim();
      manualId = '';
      results = [];
      errorMsg = '';
      stopPreview();
      runSearch();
    });
  });

  async function runSearch() {
    if (!searchQuery.trim()) return;
    searching = true;
    errorMsg = '';
    try {
      const r = await fetch(`/api/search-apple-music?q=${encodeURIComponent(searchQuery)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      results = j.results || [];
    } catch (e) {
      errorMsg = `Search failed: ${e.message}`;
      results = [];
    } finally {
      searching = false;
    }
  }

  function playPreview(id, url) {
    stopPreview();
    if (!url) return;
    previewingId = id;
    previewAudio = new Audio(url);
    previewAudio.play().catch(() => {});
    previewAudio.addEventListener('ended', stopPreview);
  }

  function stopPreview() {
    if (previewAudio) {
      previewAudio.pause();
      previewAudio = null;
    }
    previewingId = null;
  }

  async function apply(itunesId, matchedTitle, matchedArtist) {
    if (submitting) return;
    submitting = true;
    errorMsg = '';
    try {
      const r = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          date: current.date,
          word: current.word,
          action: 'apply',
          itunesId: String(itunesId),
          matchedTitle,
          matchedArtist,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      stopPreview();
      idx++;
    } catch (e) {
      errorMsg = `Apply failed: ${e.message}`;
    } finally {
      submitting = false;
    }
  }

  async function skip() {
    if (submitting) return;
    submitting = true;
    errorMsg = '';
    try {
      const r = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ date: current.date, word: current.word, action: 'skip' }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      stopPreview();
      idx++;
    } catch (e) {
      errorMsg = `Skip failed: ${e.message}`;
    } finally {
      submitting = false;
    }
  }

  function next() { stopPreview(); idx = Math.min(idx + 1, queue.length); }
  function prev() { stopPreview(); idx = Math.max(idx - 1, 0); }

  function applyManual() {
    if (!/^\d+$/.test(manualId.trim())) {
      errorMsg = 'Manual ID must be numeric';
      return;
    }
    apply(manualId.trim(), null, null);
  }

  function onKey(e) {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 's') skip();
    else if (e.key === 'ArrowRight') next();
    else if (e.key === 'ArrowLeft') prev();
    else if (e.key >= '1' && e.key <= '9') {
      const i = Number(e.key) - 1;
      if (results[i]) apply(results[i].id, results[i].title, results[i].artist);
    }
  }
</script>

<svelte:window on:keydown={onKey} />

<div class="mx-auto max-w-4xl p-6">
  <header class="mb-6 flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold">Triage queue</h1>
      <p class="text-sm text-gray-500">SC → Apple Music manual review</p>
    </div>
    <div class="text-right">
      <div class="text-2xl font-mono">{idx + 1} / {queue.length}</div>
      <div class="h-1 w-48 bg-gray-200 rounded">
        <div class="h-1 bg-blue-500 rounded" style="width: {(idx / queue.length) * 100}%"></div>
      </div>
    </div>
  </header>

  {#if done}
    <div class="rounded border bg-green-50 p-8 text-center">
      <h2 class="text-xl font-bold text-green-800">Queue complete</h2>
      <p class="mt-2 text-green-700">All {queue.length} words triaged. Refresh the page to re-load if you added more.</p>
    </div>
  {:else if current}
    <div class="rounded-lg border bg-white shadow-sm">
      <div class="border-b p-4">
        <div class="text-xs uppercase tracking-wide text-gray-500">{current.date} · {current.puzzleTitle}</div>
        <div class="mt-1 text-3xl font-bold">{current.word}</div>
        <div class="mt-2 text-sm text-gray-700">{current.textClue}</div>
      </div>

      <div class="border-b bg-gray-50 p-4 text-sm">
        <div class="font-medium text-gray-600">SoundCloud source</div>
        <div class="mt-1">"{current.song_title || '(no title)'}" by {current.artist_name || '(no artist)'}</div>
        {#if current.soundcloudUrl}
          <a href={current.soundcloudUrl} target="_blank" rel="noreferrer" class="mt-1 inline-block text-xs text-blue-600 underline">Open canonical URL ↗</a>
        {/if}
        {#if current.audioUrl}
          <div class="mt-1 text-xs text-gray-500 font-mono">audioUrl: {current.audioUrl}</div>
        {/if}
        {#if current.audioUrl || current.soundcloudUrl}
          {@const scTrackUrl = current.soundcloudUrl
            ? current.soundcloudUrl
            : `https://api.soundcloud.com/tracks/${current.audioUrl}`}
          <iframe
            title="SoundCloud player for {current.word}"
            class="mt-3 w-full rounded"
            height="120"
            scrolling="no"
            frameborder="no"
            allow="autoplay"
            src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(scTrackUrl)}&color=%23ff5500&inverse=false&auto_play=false&show_user=true&show_artwork=true&visual=false`}
          ></iframe>
        {/if}
      </div>

      <div class="p-4">
        <div class="flex gap-2">
          <input
            type="text"
            bind:value={searchQuery}
            on:keydown={(e) => { if (e.key === 'Enter') runSearch(); }}
            class="flex-1 rounded border px-3 py-2 text-sm"
            placeholder="Search Apple Music…"
          />
          <button on:click={runSearch} class="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50" disabled={searching}>
            {searching ? 'Searching…' : 'Search'}
          </button>
        </div>

        {#if errorMsg}
          <div class="mt-2 rounded bg-red-50 p-2 text-sm text-red-700">{errorMsg}</div>
        {/if}

        <div class="mt-4 space-y-2">
          {#each results as r, i (r.id)}
            <div class="flex items-center gap-3 rounded border p-2">
              {#if r.artworkUrl}
                <img src={r.artworkUrl} alt="" class="h-12 w-12 rounded" />
              {:else}
                <div class="h-12 w-12 rounded bg-gray-200"></div>
              {/if}
              <div class="flex-1 min-w-0">
                <div class="truncate text-sm font-medium">{r.title}</div>
                <div class="truncate text-xs text-gray-600">{r.artist} · {r.album}</div>
                <div class="text-xs text-gray-400 font-mono">{r.id}</div>
              </div>
              <button on:click={() => previewingId === r.id ? stopPreview() : playPreview(r.id, r.previewUrl)} class="rounded border px-2 py-1 text-xs hover:bg-gray-100" disabled={!r.previewUrl}>
                {previewingId === r.id ? '◼ Stop' : '▶ Preview'}
              </button>
              <button on:click={() => apply(r.id, r.title, r.artist)} class="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50" disabled={submitting}>
                Use ({i + 1})
              </button>
            </div>
          {/each}
        </div>

        <div class="mt-4 flex items-end gap-2 border-t pt-4">
          <div class="flex-1">
            <label class="text-xs text-gray-600">Custom Apple Music ID</label>
            <input type="text" bind:value={manualId} class="mt-1 w-full rounded border px-2 py-1 text-sm font-mono" placeholder="e.g. 1440848099" />
          </div>
          <button on:click={applyManual} class="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50" disabled={submitting || !manualId.trim()}>Apply custom</button>
        </div>
      </div>

      <div class="flex items-center justify-between border-t bg-gray-50 px-4 py-3">
        <div class="flex gap-2">
          <button on:click={prev} class="rounded border px-3 py-1 text-sm hover:bg-white" disabled={idx === 0}>← Prev</button>
          <button on:click={next} class="rounded border px-3 py-1 text-sm hover:bg-white">Skip view →</button>
        </div>
        <button on:click={skip} class="rounded bg-gray-700 px-3 py-1 text-sm text-white hover:bg-gray-800 disabled:opacity-50" disabled={submitting}>
          Mark unmigratable (s)
        </button>
      </div>
    </div>

    <p class="mt-4 text-xs text-gray-500">
      Keys: <span class="font-mono">1–9</span> apply nth result, <span class="font-mono">s</span> mark unmigratable, <span class="font-mono">←/→</span> nav without saving
    </p>
  {/if}
</div>
