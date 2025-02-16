import { redirect } from '@sveltejs/kit';
import { getUser } from '$lib/stores/auth.svelte.js';

export function requireAuth() {
  if (!getUser()) {
    throw redirect(303, '/auth');
  }
}