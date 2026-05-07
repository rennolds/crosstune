<script>
  import { supabase } from "$lib/supabaseClient";
  import { validateUsername } from "$lib/utils/validation.js";
  import { getUser } from "$lib/stores/auth.svelte.js";
  import { goto } from "$app/navigation";
  import Navbar from "$lib/components/Navbar.svelte";
  import ConfirmationDialog from "$lib/components/ConfirmationDialog.svelte";

  let user = $derived(getUser());
  let puzzles = $state([]);
  let loading = $state(false);
  let profile = $state(null);

  // Username editing state
  let isEditingUsername = $state(false);
  let newUsername = $state("");
  let usernameHint = $state("");
  let usernameValid = $state(true);
  let savingUsername = $state(false);
  let usernameError = $state("");

  async function fetchUserProfile() {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_color")
        .eq("id", user.id)
        .maybeSingle();

      if (!error && data) {
        profile = data;
      }
    } catch (e) {
      console.error("Error fetching profile:", e);
    }
  }

  function startEditingUsername() {
    newUsername = profile?.username || user?.user_metadata?.username || "";
    usernameHint = "";
    usernameValid = true;
    usernameError = "";
    isEditingUsername = true;
  }

  function cancelEditingUsername() {
    isEditingUsername = false;
    newUsername = "";
    usernameHint = "";
    usernameValid = true;
    usernameError = "";
  }

  async function handleUsernameInput(e) {
    const val = e.target.value.toLowerCase();
    newUsername = val;

    if (!val) {
      usernameHint = "";
      usernameValid = true;
      return;
    }

    // Show friendly character countdown for short usernames
    if (val.length < 3) {
      usernameHint = `${3 - val.length} more character${3 - val.length > 1 ? "s" : ""} needed`;
      usernameValid = false;
      return;
    }

    // Use centralized validation for everything else
    const error = await validateUsername(val);
    if (error) {
      usernameHint = error;
      usernameValid = false;
    } else {
      usernameHint = "✓ Looks good!";
      usernameValid = true;
    }
  }

  async function saveUsername() {
    usernameError = "";
    const uname = newUsername.trim().toLowerCase();

    // Validate username format (includes profanity check)
    const validationError = await validateUsername(uname);
    if (validationError) {
      usernameError = validationError;
      return;
    }

    // Check if username is unchanged
    const currentUsername = profile?.username || user?.user_metadata?.username;
    if (uname === currentUsername?.toLowerCase()) {
      isEditingUsername = false;
      return;
    }

    savingUsername = true;
    try {
      // Check if username is already taken
      const { data: existingUsername, error: usernameCheckErr } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", uname)
        .maybeSingle();

      if (usernameCheckErr) {
        console.error("Username check error:", usernameCheckErr);
      } else if (existingUsername) {
        usernameError = "That username is taken. Try another.";
        savingUsername = false;
        return;
      }

      // Update the username in the profiles table
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ username: uname })
        .eq("id", user.id);

      if (updateError) {
        console.error("Username update error:", updateError);
        usernameError = "Failed to update username. Please try again.";
        savingUsername = false;
        return;
      }

      // Update local profile state
      profile = { ...profile, username: uname };
      isEditingUsername = false;
    } catch (e) {
      console.error("Error saving username:", e);
      usernameError = "Something went wrong. Please try again.";
    } finally {
      savingUsername = false;
    }
  }

  async function fetchUserPuzzles() {
    if (!user) return;
    loading = true;
    try {
      const { data, error } = await supabase
        .from("crosstune_puzzles")
        .select("id, puzzle_json, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        puzzles = data.map((row) => {
          let title = "(Untitled)";
          try {
            const json =
              typeof row.puzzle_json === "string"
                ? JSON.parse(row.puzzle_json)
                : row.puzzle_json;
            title = json.title || "(Untitled)";
          } catch (e) {}
          return { id: row.id, title, created_at: row.created_at };
        });
      }
    } catch (e) {
      console.error("Error fetching puzzles:", e);
    } finally {
      loading = false;
    }
  }

  let deleteTargetId = $state(null);
  let deleteError = $state("");
  let deleting = $state(false);

  function startDelete(id) {
    deleteTargetId = id;
    deleteError = "";
  }

  async function confirmDelete() {
    if (!deleteTargetId) return;
    deleting = true;
    deleteError = "";
    try {
      const res = await fetch(`/api/puzzles/${deleteTargetId}`, { method: 'DELETE' });
      if (res.ok) {
        puzzles = puzzles.filter((p) => p.id !== deleteTargetId);
        deleteTargetId = null;
      } else {
        deleteError = "Failed to delete puzzle. Please try again.";
      }
    } catch {
      deleteError = "Something went wrong. Please try again.";
    } finally {
      deleting = false;
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    goto("/login");
  }

  $effect(() => {
    if (user) {
      fetchUserProfile();
      fetchUserPuzzles();
    }
  });

  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function navigateToHome() {
    window.location.href = "/";
  }

  function formatJoinDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `Since ${date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    })}`;
  }
</script>

<Navbar
  hideTimer={true}
  onNavigateToHome={navigateToHome}
/>

<main class="min-h-screen flex flex-col bg-gray-200 dark:bg-[#303030]">
  <div class="profile-container mx-auto px-4 py-8 w-full max-w-2xl">
    <div class="flex flex-col h-full pt-4 md:pt-0">
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center space-x-3 flex-1 min-w-0">
          <div
            class="w-16 h-16 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-2xl"
            style="background-color: {profile?.avatar_color || '#f97316'}"
          >
            {(
              profile?.username ||
              user?.user_metadata?.username ||
              user?.email ||
              "U"
            )
              .charAt(0)
              .toUpperCase()}
          </div>
          {#if isEditingUsername}
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  value={newUsername}
                  oninput={handleUsernameInput}
                  maxlength="24"
                  placeholder="New username..."
                  autocorrect="off"
                  autocapitalize="off"
                  spellcheck="false"
                  class="flex-1 min-w-0 bg-white dark:bg-[#303030] border rounded-lg py-1.5 px-3 text-black dark:text-white text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent {usernameHint &&
                  !usernameValid
                    ? 'border-red-500/50'
                    : 'border-gray-300 dark:border-gray-600'} {usernameHint &&
                  usernameValid &&
                  newUsername
                    ? 'border-green-500/50'
                    : ''}"
                />
                <button
                  onclick={saveUsername}
                  disabled={savingUsername || !usernameValid || !newUsername}
                  class="shrink-0 p-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  aria-label="Save username"
                >
                  {#if savingUsername}
                    <div
                      class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                    ></div>
                  {:else}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 text-white"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  {/if}
                </button>
                <button
                  onclick={cancelEditingUsername}
                  class="shrink-0 p-1.5 bg-gray-400 hover:bg-gray-500 rounded-lg transition-colors"
                  aria-label="Cancel editing"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </button>
              </div>
              {#if usernameHint || usernameError}
                <small
                  class="block mt-1 text-[11px] font-medium {usernameHint &&
                  !usernameValid
                    ? 'text-red-500 dark:text-red-400'
                    : ''} {usernameHint && usernameValid && newUsername
                    ? 'text-green-600 dark:text-green-400'
                    : ''} {usernameError
                    ? 'text-red-500 dark:text-red-400'
                    : ''} {!usernameHint && !usernameError
                    ? 'text-gray-500 dark:text-white/50'
                    : ''}"
                >
                  {usernameError || usernameHint}
                </small>
              {/if}
            </div>
          {:else}
            <div class="flex flex-col">
              <div class="flex items-center gap-2">
                <span
                  class="text-2xl font-bold text-black dark:text-white truncate"
                >
                  {profile?.username ||
                    user?.user_metadata?.username ||
                    user?.email?.split("@")[0] ||
                    "User"}
                </span>
                <button
                  onclick={startEditingUsername}
                  class="shrink-0 p-1.5 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Edit username"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4 text-gray-500 dark:text-gray-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
                    />
                  </svg>
                </button>
              </div>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {formatJoinDate(user?.created_at)}
              </span>
            </div>
          {/if}
        </div>
      </div>

      <div class="flex-grow">
        <h3
          class="text-lg font-bold mb-4 text-black dark:text-white flex items-center"
        >
          Your Puzzles
        </h3>

        {#if loading}
          <div class="flex justify-center py-8">
            <div
              class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"
            ></div>
          </div>
        {:else if puzzles.length === 0}
          <div
            class="bg-white dark:bg-black p-6 rounded-xl text-center border border-gray-100 dark:border-gray-800 shadow-sm"
          >
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              You haven't created any puzzles yet.
            </p>
            <a
              href="/create"
              class="inline-block bg-orange-500 text-white px-6 py-2 rounded-full font-bold hover:bg-orange-600 transition-all hover:scale-105"
            >
              Create a Puzzle
            </a>
          </div>
        {:else}
          <div class="space-y-3">
            {#each puzzles as puzzle}
              <div
                class="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-black border border-gray-100 dark:border-gray-800 transition-all shadow-sm"
              >
                <a
                  href={`/puzzles/${puzzle.id}`}
                  class="flex-1 min-w-0 mr-3 group"
                >
                  <span
                    class="font-medium text-black dark:text-white group-hover:text-orange-500 transition-colors block truncate"
                  >
                    {puzzle.title}
                  </span>
                  <span class="text-sm text-gray-400 dark:text-gray-500">
                    {formatDate(puzzle.created_at)}
                  </span>
                </a>
                <div class="flex items-center gap-1 flex-shrink-0">
                  <a
                    href={`/create?id=${puzzle.id}`}
                    class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    title="Edit puzzle"
                    aria-label="Edit puzzle"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </a>
                  <button
                    onclick={() => startDelete(puzzle.id)}
                    class="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete puzzle"
                    aria-label="Delete puzzle"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      {#if deleteError}
        <p class="mt-3 text-sm text-red-500">{deleteError}</p>
      {/if}

      <div
        class="mt-8 pt-6 border-t border-gray-300 dark:border-gray-700 flex justify-center"
      >
        <button
          onclick={handleSignOut}
          class="py-3 px-8 bg-black dark:bg-black text-white dark:text-white rounded-xl font-bold hover:bg-zinc-800 dark:hover:bg-zinc-900 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 shadow-sm border dark:border-gray-800"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span>Sign Out</span>
        </button>
      </div>
  </div>
</main>

<ConfirmationDialog
  isOpen={deleteTargetId !== null}
  title="Delete puzzle?"
  message="This will permanently delete the puzzle. Anyone with the share link will no longer be able to play it."
  confirmText={deleting ? "Deleting…" : "Delete"}
  cancelText="Cancel"
  onConfirm={confirmDelete}
  onCancel={() => { deleteTargetId = null; deleteError = ""; }}
/>

<style>
  /* Mobile-specific styles to match other pages */
  @media (max-width: 768px) {
    .profile-container {
      padding-top: 3.5rem;
      margin-top: 0;
    }
  }
</style>
