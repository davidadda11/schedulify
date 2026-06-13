// src/routes/app/dashboard/+page.server.ts  (fișier nou sau adaugă în cel existent)

import type { PageServerLoad } from './$types';
import { db } from '$lib/db';
import { studyPlanItem } from '$lib/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';

export const load: PageServerLoad = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) throw redirect(302, '/login');

  const azi = new Date().toISOString().slice(0, 10); // "2026-06-13"

  // Itemii de studiu din azi și viitor (fără pauze)
  const items = await db
    .select()
    .from(studyPlanItem)
    .where(
      and(
        eq(studyPlanItem.userId, session.user.id),
        gte(studyPlanItem.date, azi)
      )
    );

  // Grupăm pe dată, excludem pauzele
  const studyByDate: Record<string, typeof items> = {};
  for (const item of items) {
    if (item.tip === 'pauza') continue;
    if (!studyByDate[item.date]) studyByDate[item.date] = [];
    studyByDate[item.date].push(item);
  }

  // Itemii de azi separat (pentru widgetul principal)
  const studyAzi = studyByDate[azi] ?? [];

  // Progres general (toate zilele)
  const toate = Object.values(studyByDate).flat();
  const bifate = toate.filter(i => i.bifat).length;
  const progresGeneral = toate.length ? Math.round(bifate / toate.length * 100) : 0;

  return {
    studyByDate,
    studyAzi,
    progresGeneral,
    // Păstrăm și datele existente (orare, evenimente) dacă le încarci din altă parte
  };
};