<script>
  import { fly } from "svelte/transition";
  import { supabase } from "$lib/supabaseClient";
  import { validateUsername } from "$lib/utils/validation.js";

  let { isOpen, onClose, user, handleSignOut } = $props();
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

      console.log("Profile data fetched:", data, "Error:", error);

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

  $effect(() => {
    if (isOpen && user) {
      fetchUserProfile();
      fetchUserPuzzles();
    }
  });

  function handleClose() {
    onClose();
  }

  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
    onkeydown={(e) => e.key === "Enter" && handleClose()}
    role="button"
    tabindex="0"
    aria-label="Close profile menu"
  ></div>

  {#if isOpen}
    <div
      class="profile-menu fixed right-0 md:top-12 top-[50px] md:pt-0 pt-12 h-full w-full max-w-[400px] bg-gray-200 dark:bg-[#202020] shadow-2xl overflow-y-auto"
      style="z-index: 50;"
      in:fly={{ x: 400, duration: 300 }}
      out:fly={{ x: 400, duration: 300 }}
    >
      <div class="p-6 flex flex-col h-full">
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center space-x-3 flex-1 min-w-0">
            <div
              class="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-lg"
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
              <span
                class="text-xl font-bold text-black dark:text-white truncate"
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
            {/if}
          </div>
          <button
            onclick={handleClose}
            class="shrink-0 p-2 hover:bg-gray-300 dark:hover:bg-gray-800 rounded-full transition-colors"
            aria-label="Close menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 text-gray-500 dark:text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
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
              class="bg-white dark:bg-[#303030] p-6 rounded-xl text-center border border-gray-100 dark:border-gray-700 shadow-sm"
            >
              <p class="text-gray-600 dark:text-gray-400 mb-4">
                You haven't created any puzzles yet.
              </p>
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
                  <span
                    class="font-medium text-black dark:text-white group-hover:text-orange-500 transition-colors"
                  >
                    {puzzle.title}
                  </span>
                  <div class="flex items-center space-x-3">
                    <span class="text-sm text-gray-400 dark:text-gray-500">
                      {formatDate(puzzle.created_at)}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 text-gray-400 group-hover:text-orange-500 transition-colors"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                </a>
              {/each}
            </div>
          {/if}
        </div>

        <div
          class="mt-8 pt-6 pb-32 md:pb-12 border-t border-gray-200 dark:border-gray-700"
        >
          <button
            onclick={() => {
              handleSignOut();
              handleClose();
            }}
            class="w-full py-3 px-4 bg-black dark:bg-[#303030] text-white dark:text-white rounded-xl font-bold hover:bg-zinc-800 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 shadow-sm"
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
    </div>
  {/if}
</div>

<style>
  .profile-menu {
    box-shadow: -10px 0 30px rgba(0, 0, 0, 0.15);
  }
</style>
