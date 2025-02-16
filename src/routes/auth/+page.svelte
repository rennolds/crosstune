<script>
    import Auth from '$lib/components/Auth.svelte';
    import { getUser } from '$lib/stores/auth.svelte.js';
    import { goto } from '$app/navigation';
    
    $effect(() => {
      if (getUser()) {
        goto('/');
      }
    });
</script>
  
<Auth />