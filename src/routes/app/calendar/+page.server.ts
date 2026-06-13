import type { ServerLoad, Actions } from '@sveltejs/kit';
import { redirect, fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import { studyPlanItem } from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '$lib/server/auth';

export const load: ServerLoad = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) throw redirect(302, '/login');

  const items = await db
    .select()
    .from(studyPlanItem)
    .where(eq(studyPlanItem.userId, session.user.id));

  const studyByDate: Record<string, typeof items> = {};
  for (const item of items) {
    if (item.tip === 'pauza') continue;
    if (!studyByDate[item.date]) studyByDate[item.date] = [];
    studyByDate[item.date].push(item);
  }

  return { studyByDate };
};

export const actions: Actions = {
  toggleBifat: async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return fail(401, { error: 'Neautentificat' });

    const formData = await request.formData();
    const id    = formData.get('id') as string;
    const bifat = formData.get('bifat') === 'true';

    await db.update(studyPlanItem)
      .set({ bifat: !bifat })
      .where(and(
        eq(studyPlanItem.id, id),
        eq(studyPlanItem.userId, session.user.id)
      ));

    return { ok: true };
  }
};