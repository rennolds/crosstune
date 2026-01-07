<script>
  import { onMount } from "svelte";
  import { supabase } from "$lib/supabaseClient";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  let { data } = $props();

  onMount(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const tokenHash = urlParams.get("token_hash");
    const type = urlParams.get("type") || "email";
    const next = data.next || "/";

    if (tokenHash) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });
      if (!error) {
        goto(next);
      } else {
        goto("/auth/error");
      }
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      goto(next);
    } else {
      const errorDesc =
        urlParams.get("error_description") ||
        hashParams.get("error_description");
      if (errorDesc) {
        console.error(errorDesc);
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
