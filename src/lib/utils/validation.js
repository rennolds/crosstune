import { containsProfanity } from './filters.js';

export { containsProfanity };

export async function validateUsername(username) {
  if (!username) {
    return 'Username is required';
  }
  
  if (username.length < 3) {
    return 'Username must be at least 3 characters';
  }

  if (username.length > 24) {
    return 'Username must be at most 24 characters';
  }

  if (!/^[a-z0-9_]+$/.test(username)) {
    return 'Username can only contain lowercase letters, numbers, and underscores';
  }

  if (await containsProfanity(username)) {
    return 'Username contains inappropriate language';
  }

  return null;
}

