
import type { LayoutServerLoad } from './$types';
import { auth } from '$auth/auth';

export const load: LayoutServerLoad = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers });

  return {
    session: session ?? null,
    user:    session?.user ?? null,
  };
};