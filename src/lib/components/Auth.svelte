<script>
    import { supabase } from '$lib/supabase';
    import { setUser } from '$lib/stores/auth.svelte.js';
  
    let email = $state('');
    let password = $state('');
    let loading = $state(false);
    let error = $state(null);
    let isLogin = $state(true);
  
    async function handleAuth() {
      try {
        loading = true;
        error = null;
        
        let result;
        if (isLogin) {
          result = await supabase.auth.signInWithPassword({
            email,
            password,
          });
        } else {
          result = await supabase.auth.signUp({
            email,
            password,
          });
        }
  
        if (result.error) {
          error = result.error.message;
        } else {
          setUser(result.data.user);
        }
      } catch (e) {
        error = e.message;
      } finally {
        loading = false;
      }
    }
  
    function toggleMode() {
      isLogin = !isLogin;
      error = null;
    }
  </script>
  
  <div class="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
    <h2 class="text-2xl font-bold mb-6 text-center">
      {isLogin ? 'Login' : 'Sign Up'}
    </h2>
  
    <form onsubmit={(e) => { e.preventDefault(); handleAuth(); }} class="space-y-4">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
        <input
          id="email"
          type="email"
          bind:value={email}
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
        />
      </div>
  
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
        <input
          id="password"
          type="password"
          bind:value={password}
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black"
        />
      </div>
  
      {#if error}
        <div class="text-red-600 text-sm">{error}</div>
      {/if}
  
      <button
        type="submit"
        disabled={loading}
        class="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
      >
        {#if loading}
          Loading...
        {:else}
          {isLogin ? 'Login' : 'Sign Up'}
        {/if}
      </button>
  
      <button
        type="button"
        onclick={toggleMode}
        class="w-full text-sm text-gray-600 hover:text-gray-900"
      >
        {isLogin ? 'Need an account? Sign up' : 'Already have an account? Login'}
      </button>
    </form>
  </div>