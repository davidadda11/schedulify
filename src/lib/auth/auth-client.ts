import { createAuthClient } from 'better-auth/svelte';
import type { Session, User } from './auth';

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined'
    ? window.location.origin
    : (import.meta.env.VITE_APP_URL ?? 'http://localhost:5173'),
  basePath: '/api/auth',
  advanced: {
    defaultAdvancedPage: false
  }
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;

export { useSession as session$ };
