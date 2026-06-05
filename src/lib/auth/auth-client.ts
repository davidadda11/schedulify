// src/lib/auth/auth-client.ts
// Better Auth — Browser Client

import { createAuthClient } from 'better-auth/svelte';
import type { Session, User } from './auth';

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined'
    ? window.location.origin
    : (import.meta.env.VITE_APP_URL ?? 'http://localhost:5173')
});

// Named exports for convenience
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;

// ── Reactive session store (Svelte 5 compatible) ──────────
// Usage in components:
//   import { session$ } from '$auth/auth-client';
//   <p>{$session$.data?.user.name}</p>

export { useSession as session$ };