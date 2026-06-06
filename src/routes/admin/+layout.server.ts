import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { auth } from '$lib/auth/auth';

export const load: LayoutServerLoad = async ({ request }: { request: Request }) => {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) throw redirect(303, '/login');

  const user = session.user as typeof session.user & { role: string };
  if (user.role !== 'admin') throw redirect(303, '/');

  return { adminUser: user };
};