<script>
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabaseClient";
  import { validateUsername } from "$lib/utils/validation.js";
  import Navbar from "$lib/components/Navbar.svelte";

  let { data } = $props();

  let mode = $state("create");
  let email = $state("");
  let username = $state("");
  let loading = $state(false);
  let sent = $state(false);
  let errorMsg = $state("");
  let showForm = $state(false);

  // Checkbox state for account creation
  let termsAgreed = $state(false);
  let marketingOptIn = $state(false);

  // Real-time username validation feedback
  let usernameHint = $state("");
  let usernameValid = $state(true);

  async function handleUsernameInput(e) {
    const val = e.target.value;
    // Auto-convert to lowercase as user types
    if (val !== val.toLowerCase()) {
      username = val.toLowerCase();
    } else {
      username = val; // Ensure bound value updates if no change
    }

    // Real-time validation feedback
    if (!val) {
      usernameHint = "";
      usernameValid = true;
    } else if (val.length < 3) {
      usernameHint = `${3 - val.length} more character${3 - val.length > 1 ? "s" : ""} needed`;
      usernameValid = false;
    } else if (!/^[a-z0-9_]+$/.test(val)) {
      usernameHint = "Only lowercase letters, numbers, and underscores";
      usernameValid = false;
    } else if (val.length > 24) {
      usernameHint = "Maximum 24 characters";
      usernameValid = false;
    } else {
      // Check profanity async
      const error = await validateUsername(val);
      if (
        error &&
        error !== "Username is required" &&
        error !== "Username must be at least 3 characters" &&
        error !== "Username must be at most 24 characters" &&
        error !==
          "Username can only contain lowercase letters, numbers, and underscores"
      ) {
        usernameHint = error;
        usernameValid = false;
      } else {
        if (error) {
          usernameHint = error;
          usernameValid = false;
        } else {
          usernameHint = "✓ Looks good!";
          usernameValid = true;
        }
      }
    }
  }

  const ALLOWED = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "https://crosstune.io",
    "https://auth.crosstune.pages.dev",
  ];
  let returnTo = "";
  let nextPath = "/";
  let redirectTo = "";

  function originOf(input) {
    try {
      return new URL(input).origin;
    } catch {
      return "";
    }
  }

  onMount(() => {
    const url = new URL(window.location.href);
    const rRaw = url.searchParams.get("r");
    const n = url.searchParams.get("next");
    const m = url.searchParams.get("mode");

    // Set mode from query parameter if provided
    if (m === "create" || m === "login") {
      mode = m;
    }

    // normalize ALLOWED to origins (no paths)
    const allowed = ALLOWED.map(originOf);
    const candidate = rRaw ? originOf(rRaw) : window.location.origin;

    if (candidate && allowed.includes(candidate)) {
      returnTo = candidate;
      redirectTo = `${returnTo}/auth/callback`;
      showForm = true;
    } else {
      // Default to current origin for local dev
      returnTo = window.location.origin;
      redirectTo = `${returnTo}/auth/callback`;
      showForm = true;
    }

    if (n && n.startsWith("/")) nextPath = n;
  });

  async function onSubmit(e) {
    e.preventDefault();
    if (!showForm) return;

    errorMsg = "";
    sent = false;

    if (!email || !email.includes("@")) {
      errorMsg = "Enter a valid email.";
      return;
    }

    loading = true;
    try {
      if (mode === "create") {
        // Validate terms agreement first
        if (!termsAgreed) {
          errorMsg =
            "You must confirm you are at least 13 years old and agree to the Terms of Service and Privacy Policy.";
          loading = false;
          return;
        }

        // Validate username format (includes profanity check)
        const uname = username.trim().toLowerCase();
        const validationError = await validateUsername(uname);
        if (validationError) {
          errorMsg = validationError;
          loading = false;
          return;
        }

        // Check if username is already taken
        const { data: existingUsername, error: usernameCheckErr } =
          await supabase
            .from("profiles")
            .select("id")
            .eq("username", uname)
            .maybeSingle();

        if (usernameCheckErr) {
          console.error("Username check error:", usernameCheckErr);
          // Don't block signup if the check fails, just log it
        } else if (existingUsername) {
          errorMsg = "That username is taken. Try another.";
          loading = false;
          return;
        }

        // Check if email is already registered
        const { data: emailExists, error: emailCheckErr } = await supabase.rpc(
          "email_exists",
          { check_email: email.trim() }
        );

        if (emailCheckErr) {
          console.error("Email check error:", emailCheckErr);
          // Don't block signup if the check fails, just log it
        } else if (emailExists) {
          errorMsg =
            "An account with this email already exists. Please log in instead.";
          loading = false;
          return;
        }

        // Send signup magic link with user metadata
        const now = new Date().toISOString();
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: redirectTo,
            data: {
              username: uname,
              terms_privacy_ack_at: now,
              age_confirmed_at: now,
              marketing_status: marketingOptIn ? "subscribed" : "unsubscribed",
            },
          },
        });
        if (error) throw error;
      } else {
        // LOGIN: send login-only magic link
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: redirectTo,
            shouldCreateUser: false,
          },
        });
        if (error) {
          const msg = String(error.message).toLowerCase();
          if (
            msg.includes("user not found") ||
            msg.includes("signups not allowed")
          ) {
            errorMsg = "No account for that email. Create one instead.";
            return;
          }
          throw error;
        }
      }

      sent = true;
    } catch (err) {
      console.error(err);
      errorMsg = err?.message || "Something went wrong.";
    } finally {
      loading = false;
    }
  }

  // Dummy function for navbar compatibility
  function toggleHelpOverlay() {}
</script>

<Navbar {toggleHelpOverlay} isArchiveMode={false} hideTimer={true} />

<main
  class="flex items-start justify-center pt-28 md:pt-0 bg-gray-200 dark:bg-[#303030] transition-colors duration-300"
>
  <div class="w-full max-w-[420px] px-2 mx-auto">
    <div class="w-full pt-0">
      <!-- Logo Header -->
      <div class="text-center mb-0">
        <img
          src="/fwlogo.webp"
          alt="Flatwhite Games"
          class="w-full max-w-[360px] mx-auto h-auto mt-[-28px] opacity-90 hover:opacity-100 transition-opacity"
        />
      </div>

      <!-- Mode toggle -->
      <div
        class="flex bg-gray-100 dark:bg-[#2a2a2a] border border-gray-200 dark:border-white/10 rounded-md overflow-hidden mt-[-60px] mb-4 relative z-10 p-0.5"
      >
        <button
          class="flex-1 text-sm font-medium py-1.5 px-4 rounded-[4px] cursor-pointer transition-all duration-200 {mode ===
          'login'
            ? 'bg-orange-500 text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}"
          onclick={() => {
            mode = "login";
            errorMsg = "";
            sent = false;
          }}
          aria-pressed={mode === "login"}
        >
          Log In
        </button>
        <button
          class="flex-1 text-sm font-medium py-1.5 px-4 rounded-[4px] cursor-pointer transition-all duration-200 {mode ===
          'create'
            ? 'bg-orange-500 text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}"
          onclick={() => {
            mode = "create";
            errorMsg = "";
            sent = false;
          }}
          aria-pressed={mode === "create"}
        >
          Create Account
        </button>
      </div>

      <!-- Tagline -->
      {#if mode === "create"}
        <p
          class="text-center text-gray-500 dark:text-white/50 text-sm m-0 mb-6 font-medium"
        >
          Join the community and "play" your music, everyday
        </p>
      {/if}

      <!-- Notifications -->
      {#if sent}
        <div
          class="flex items-start gap-3 p-4 rounded-xl mb-6 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20"
        >
          <span
            class="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold bg-green-500 text-white"
            >✓</span
          >
          <div class="flex-1">
            <p
              class="text-gray-900 dark:text-white text-[15px] font-semibold m-0 mb-1 text-left"
            >
              Check your email!
            </p>
            <p
              class="text-gray-600 dark:text-[#d0d0d0] text-[13px] m-0 text-left"
            >
              We sent you a {mode === "create" ? "sign-up" : "login"} link. Click
              it to continue.
            </p>
          </div>
          <button
            class="shrink-0 bg-none border-none text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-xl cursor-pointer"
            onclick={() => (sent = false)}>×</button
          >
        </div>
      {/if}

      {#if errorMsg}
        <div
          class="flex items-start gap-3 p-4 rounded-xl mb-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20"
        >
          <span
            class="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold bg-red-500 text-white"
            >!</span
          >
          <div class="flex-1">
            <p
              class="text-red-700 dark:text-red-300 text-[13px] m-0 text-left font-medium"
            >
              {errorMsg}
            </p>
          </div>
          <button
            class="shrink-0 bg-none border-none text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300 text-xl cursor-pointer"
            onclick={() => (errorMsg = "")}>×</button
          >
        </div>
      {/if}

      {#if showForm}
        <form class="w-full space-y-5" onsubmit={onSubmit}>
          <!-- Email field -->
          <div>
            <label
              class="block text-gray-700 dark:text-white text-sm font-semibold mb-1 text-left"
              for="email">Email</label
            >
            <input
              id="email"
              class="w-full bg-white dark:bg-[#2a2a2a] border border-gray-300 dark:border-white/10 rounded-md py-1.5 px-3 text-gray-900 dark:text-white text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-white/30"
              type="email"
              bind:value={email}
              placeholder="Enter your email..."
              required
            />
          </div>

          <!-- Username field (create mode only) -->
          {#if mode === "create"}
            <div>
              <label
                class="block text-gray-700 dark:text-white text-sm font-semibold mb-1 text-left"
                for="username">Username</label
              >
              <input
                id="username"
                class="w-full bg-white dark:bg-[#2a2a2a] border border-gray-300 dark:border-white/10 rounded-md py-1.5 px-3 text-gray-900 dark:text-white text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-white/30 {usernameHint &&
                !usernameValid
                  ? '!border-red-500/50 !focus:ring-red-500'
                  : ''} {usernameHint && usernameValid && username
                  ? '!border-green-500/50 !focus:ring-green-500'
                  : ''}"
                type="text"
                bind:value={username}
                oninput={handleUsernameInput}
                maxlength="24"
                placeholder="Choose a username..."
                autocorrect="off"
                autocapitalize="off"
                spellcheck="false"
              />
              <small
                class="block mt-1 text-[11px] text-gray-500 dark:text-white/50 text-left font-medium {usernameHint &&
                !usernameValid
                  ? 'text-red-500 dark:text-red-400'
                  : ''} {usernameHint && usernameValid && username
                  ? 'text-green-600 dark:text-green-400'
                  : ''}"
              >
                {usernameHint || "lowercase, numbers, underscore only"}
              </small>
            </div>

            <!-- Terms and Age Confirmation -->
            <div>
              <label
                class="flex items-start gap-2.5 cursor-pointer text-[13px] text-gray-600 dark:text-white/80 leading-tight"
              >
                <input
                  type="checkbox"
                  bind:checked={termsAgreed}
                  class="shrink-0 w-4 h-4 mt-0.5 accent-orange-500 cursor-pointer rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2a2a2a]"
                />
                <span class="flex-1 text-left">
                  I am at least 13 years old and I agree to the
                  <a
                    href="https://spotle.io/privacy"
                    target="_blank"
                    class="text-orange-500 font-semibold hover:underline decoration-1 underline-offset-2"
                    >terms of service & privacy policy</a
                  >
                </span>
              </label>
            </div>

            <!-- Marketing Emails (Optional) -->
            <div>
              <label
                class="flex items-start gap-2.5 cursor-pointer text-[13px] text-gray-600 dark:text-white/80 leading-tight"
              >
                <input
                  type="checkbox"
                  bind:checked={marketingOptIn}
                  class="shrink-0 w-4 h-4 mt-0.5 accent-orange-500 cursor-pointer rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-[#2a2a2a]"
                />
                <span class="flex-1 text-left">
                  Send me updates about new stuff and games (optional, no
                  worries, do you)
                </span>
              </label>
            </div>
          {/if}

          <button
            class="block mx-auto w-auto min-w-[200px] bg-orange-500 hover:bg-orange-600 border-none rounded-lg text-white font-bold py-2 px-8 cursor-pointer transition-all duration-200 transform hover:-translate-y-0.5 shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none mt-8 text-sm"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Sending..."
              : mode === "create"
                ? "Send Sign-Up Link"
                : "Send Login Link"}
          </button>

          {#if mode === "create"}
            <p
              class="text-[13px] text-gray-400 dark:text-white/40 mt-4 text-center leading-[1.5]"
            >
              Your Flatwhite Games account will work across Spotle, Harmonies,
              Crosstune and all the new fun things coming soon™
            </p>
          {/if}
        </form>
      {:else}
        <div class="text-center text-gray-500 dark:text-white/60 p-2">
          <p>{errorMsg || "Loading..."}</p>
        </div>
      {/if}
    </div>
  </div>
</main>
