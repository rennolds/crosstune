<script>
  import { fly } from "svelte/transition";
  import { supabase } from "$lib/supabaseClient";

  let { isOpen, onClose, user, handleSignOut } = $props();
  let puzzles = $state([]);
  let loading = $state(false);
  let profile = $state(null);

  async function fetchUserProfile() {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_color')
        .eq('id', user.id)
        .maybeSingle();

      console.log("Profile data fetched:", data, "Error:", error);

      if (!error && data) {
        profile = data;
      }
    } catch (e) {
      console.error("Error fetching profile:", e);
    }
  }

  async function fetchUserPuzzles() {
    if (!user) return;
    loading = true;
    try {
      const { data, error } = await supabase
        .from('crosstune_puzzles')
        .select('id, puzzle_json, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        puzzles = data.map(row => {
          let title = '(Untitled)';
          try {
            const json = typeof row.puzzle_json === 'string' ? JSON.parse(row.puzzle_json) : row.puzzle_json;
            title = json.title || '(Untitled)';
          } catch (e) {}
          return { id: row.id, title };
        });
      }
    } catch (e) {
      console.error("Error fetching puzzles:", e);
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    if (isOpen && user) {
      fetchUserProfile();
      fetchUserPuzzles();
    }
  });

  function handleClose() {
    onClose();
  }
</script>

<div
  class="fixed inset-0 transition-all z-40"
  class:pointer-events-none={!isOpen}
  class:pointer-events-auto={isOpen}
>
  <div
    class="absolute inset-0 bg-black/50 transition-opacity"
    class:opacity-0={!isOpen}
    class:invisible={!isOpen}
    class:pointer-events-none={!isOpen}
    class:pointer-events-auto={isOpen}
    onclick={handleClose}
    onkeydown={(e) => e.key === 'Enter' && handleClose()}
    role="button"
    tabindex="0"
    aria-label="Close profile menu"
  ></div>

  {#if isOpen}
    <div
      class="profile-menu fixed top-0 right-0 md:mt-14 mt-[98px] md:pt-0 pt-2 h-full w-full max-w-[400px] bg-gray-50 dark:bg-[#202020] shadow-2xl overflow-y-auto"
      style="z-index: 50;"
      in:fly={{ x: 400, duration: 300 }}
      out:fly={{ x: 400, duration: 300 }}
    >
      <div class="p-6 flex flex-col h-full">
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center space-x-3">
            <div 
              class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style="background-color: {profile?.avatar_color || '#f97316'}"
            >
              {(profile?.username || user?.user_metadata?.username || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <span class="text-xl font-bold text-black dark:text-white">
              {profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'User'}
            </span>
          </div>
          <button 
            onclick={handleClose} 
            class="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
            aria-label="Close menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="flex-grow">
          <h3 class="text-lg font-bold mb-4 text-black dark:text-white flex items-center">
            Your Puzzles
          </h3>
          
          {#if loading}
            <div class="flex justify-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          {:else if puzzles.length === 0}
            <div class="bg-white dark:bg-[#303030] p-6 rounded-xl text-center border border-gray-100 dark:border-gray-700 shadow-sm">
              <p class="text-gray-600 dark:text-gray-400 mb-4">You haven't created any puzzles yet.</p>
              <a 
                href="/create" 
                class="inline-block bg-orange-500 text-white px-6 py-2 rounded-full font-bold hover:bg-orange-600 transition-all hover:scale-105" 
                onclick={handleClose}
              >
                Create a Puzzle
              </a>
            </div>
          {:else}
            <div class="space-y-3">
              {#each puzzles as puzzle}
                <a 
                  href={`/puzzles/${puzzle.id}`} 
                  class="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-[#303030] border border-gray-100 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 transition-all group shadow-sm" 
                  onclick={handleClose}
                >
                  <span class="font-medium text-black dark:text-white group-hover:text-orange-500 transition-colors">
                    {puzzle.title}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                </a>
              {/each}
            </div>
          {/if}
        </div>

        <div class="mt-8 pt-6 pb-32 md:pb-8 border-t border-gray-200 dark:border-gray-700">
          <button
            onclick={() => { handleSignOut(); handleClose(); }}
            class="w-full py-3 px-4 bg-gray-200 dark:bg-[#303030] text-black dark:text-white rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-700 transition-all flex items-center justify-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .profile-menu {
    box-shadow: -10px 0 30px rgba(0, 0, 0, 0.15);
  }
</style>

