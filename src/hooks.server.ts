import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export const handle: Handle = async ({ event, resolve }) => {

  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/auth')) {
    return svelteKitHandler({ event, resolve, auth, building });
  }


  const session = await auth.api.getSession({ headers: event.request.headers });

  if (session) {
    event.locals.session = session.session;
    event.locals.user = session.user;
  }

  return resolve(event);
};