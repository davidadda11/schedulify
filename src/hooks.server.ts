<<<<<<< HEAD
import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';

const handleBetterAuth: Handle = async ({ event, resolve }) => {
  const session = await auth.api.getSession({ headers: event.request.headers });

  if (session) {
    event.locals.session = session.session;
    event.locals.user = session.user;
  }

  // Lasă SvelteKit să gestioneze rutele care NU sunt API Better Auth
  const url = new URL(event.request.url);
  if (!url.pathname.startsWith('/api/auth')) {
    return resolve(event);
  }

  return svelteKitHandler({ event, resolve, auth, building });
};

export const handle: Handle = handleBetterAuth;
=======
import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export const handle: Handle = async ({ event, resolve }) => {
	// 1. Lasă Better Auth să își gestioneze rutele interne de API (/api/auth/*) PRIMUL
	const url = new URL(event.request.url);
	if (url.pathname.startsWith('/api/auth')) {
		return svelteKitHandler({ event, resolve, auth, building });
	}

	// 2. Pentru toate celelalte pagini, extrage sesiunea curentă
	const session = await auth.api.getSession({ 
		headers: event.request.headers 
	});

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	} else {
		event.locals.session = null;
		event.locals.user = null;
	}

	// 3. PROTECȚIE: Dacă userul încearcă să intre în zona de /app dar NU are sesiune, 
	// trimite-l direct la /login înainte să încarce vreo pagină
	if (url.pathname.startsWith('/app') && !event.locals.session) {
		return new Response(null, {
			status: 302,
			headers: { Location: '/login' }
		});
	}

	// 4. Dacă totul e în regulă, încarcă pagina în mod normal
	return resolve(event);
};
>>>>>>> 5db2259 (sali pregatire fara AI)
