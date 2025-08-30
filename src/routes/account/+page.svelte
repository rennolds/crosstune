<script>
    import { invalidateAll } from '$app/navigation';
    export let data; // { status, user, profile }
  
    async function logout() {
      await fetch('/auth/logout', { method: 'POST' });
      await invalidateAll();
    }
  </script>
  
  <main class="max-w-lg mx-auto p-6 space-y-4">
    <h1 class="text-xl font-semibold">Account debug</h1>
    <p><strong>Status:</strong> {data.status}</p>
  
    {#if data.user}
      <pre class="bg-gray-100 p-3 rounded">
        <code>{JSON.stringify(data.user, null, 2)}</code>
      </pre>
      <pre class="bg-gray-100 p-3 rounded">
        <code>{JSON.stringify(data.profile, null, 2)}</code>
      </pre>
      <button class="border rounded px-3 py-2" on:click={logout}>Log out</button>
    {:else}
      <p>You are not logged in.</p>
    {/if}
  </main>
  