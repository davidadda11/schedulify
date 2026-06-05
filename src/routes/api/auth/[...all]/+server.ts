// src/routes/api/auth/[...all]/+server.ts
// Better Auth — SvelteKit route handler

import { auth } from '$auth/auth';
import { toSvelteKitHandler } from 'better-auth/svelte-kit';

export const { GET, POST } = toSvelteKitHandler(auth);