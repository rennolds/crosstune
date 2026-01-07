<script>
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabaseClient";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  let { data } = $props();

  onMount(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    let tokenHash = urlParams.get("token_hash");
    let type = urlParams.get("type") || "email";
    let next = data.next || "/";

    // Workaround for Supabase appending parameters with '?' instead of '&' when 'next' is present
    if (!tokenHash && next.includes("?")) {
      try {
        console.log("Detecting potential nested params in next:", next);
        // Parse 'next' as a URL (relative to current origin)
        const nestedUrl = new URL(next, window.location.origin);
        const nestedTokenHash = nestedUrl.searchParams.get("token_hash");
        
        if (nestedTokenHash) {
          console.log("Found nested token_hash. Extracting...");
          tokenHash = nestedTokenHash;
          type = nestedUrl.searchParams.get("type") || type;
          // Clean up next (keep pathname, discard the nested query params)
          next = nestedUrl.pathname;
          console.log("Cleaned next:", next);
        }
      } catch (e) {
        console.warn("Error parsing nested params:", e);
      }
    }

    console.log("Auth callback client mount. TokenHash:", !!tokenHash, "Type:", type, "Next:", next);

    if (tokenHash) {
      console.log("Verifying OTP...");
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });
      if (!error) {
        console.log("OTP verified. Redirecting to:", next);
        goto(next);
      } else {
        console.error("OTP verification error:", error);
        goto("/auth/error");
      }
      return;
    }

    console.log("Checking session...");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (user) {
      console.log("User found in session. Redirecting to:", next);
      goto(next);
    } else {
      console.log("No user found.");
      const errorDesc =
        urlParams.get("error_description") ||
        hashParams.get("error_description");
      if (errorDesc) {
        console.error("Auth error description:", errorDesc);
      }
      // If no user and no error, maybe just redirect to home or login?
      // setTimeout(() => goto('/login'), 3000);
    }
  });
</script>

<div
  class="flex flex-col items-center justify-center min-h-screen bg-[#121212] text-white gap-5"
>
  <div
    class="w-10 h-10 border-4 border-[rgba(186,129,194,0.3)] border-t-[#ba81c2] rounded-full animate-spin"
  ></div>
  <p class="text-[rgba(255,255,255,0.7)] text-base">
    Verifying authentication...
  </p>
</div>
