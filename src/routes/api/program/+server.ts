// src/routes/api/program/+server.ts

import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { studyPlanItem } from '$lib/db/schema';
import { auth } from '$lib/auth/auth';
import { eq, and } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
  // ── Auth ────────────────────────────────────────────────────
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return json({ error: 'Neautentificat' }, { status: 401 });
  const userId = session.user.id;

  const { materii, timpZi, deadline, prioritate } = await request.json();

  const azi = new Date();
  const dataDeadline = new Date(deadline);
  const zileDiff = Math.max(1, Math.ceil((dataDeadline.getTime() - azi.getTime()) / (1000 * 60 * 60 * 24)));
  const nrZile = Math.min(zileDiff, 14);

  const ZILE   = ['Duminică','Luni','Marți','Miercuri','Joi','Vineri','Sâmbătă'];
  const LUNI   = ['ianuarie','februarie','martie','aprilie','mai','iunie','iulie','august','septembrie','octombrie','noiembrie','decembrie'];
  const materiiList = materii.split(',').map((m: string) => m.trim()).filter(Boolean);

  const program = [];

  for (let i = 0; i < nrZile; i++) {
    const data = new Date(azi);
    data.setDate(azi.getDate() + i);

    const ziNume  = ZILE[data.getDay()];
    const dataStr = `${data.getDate()} ${LUNI[data.getMonth()]}`;

    // ISO pentru DB: "2026-06-13"
    const isoDate = data.toISOString().slice(0, 10);

    const materieZi        = materiiList[i % materiiList.length];
    const materieUrmatoare = materiiList[(i + 1) % materiiList.length];

    const prompt = `Generează activități studiu pentru ${ziNume} ${dataStr}. Materia principală: ${materieZi}. Timp total: ${timpZi}h. Stil: ${prioritate}.
REGULI:
- Materia principală este ${materieZi}
- Poți adăuga 15-20 min recapitulare din ${materieUrmatoare}
- Adaugă pauze de 10 min după fiecare 45-60 min de studiu
- Ora de start: 16:00
Răspunde DOAR cu JSON array fără markdown:
[{"ora":"16:00","activitate":"Studiu ${materieZi}","durata":"60 min","tip":"studiu"},{"ora":"17:00","activitate":"Pauză","durata":"10 min","tip":"pauza"},{"ora":"17:10","activitate":"Recapitulare ${materieUrmatoare}","durata":"20 min","tip":"recapitulare"}]`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    let activitati: Array<{ ora: string; activitate: string; durata: string; tip: string }> = [];

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        signal: controller.signal,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen2.5:1.5b',
          prompt,
          stream: false,
          options: { num_ctx: 1024, num_predict: 400, temperature: 0.3 }
        })
      });
      clearTimeout(timeout);

      const raw   = (await response.json()).response ?? '';
      const match = raw.match(/\[[\s\S]*\]/);
      activitati  = match ? JSON.parse(match[0]) : [];
      if (!Array.isArray(activitati)) activitati = [];
    } catch {
      clearTimeout(timeout);
    }

    program.push({ zi: ziNume, data: dataStr, activitati });

    // ── Salvare în DB (ștergem ziua dacă există deja, apoi reinserăm) ──
    if (activitati.length > 0) {
      await db.delete(studyPlanItem)
        .where(and(eq(studyPlanItem.userId, userId), eq(studyPlanItem.date, isoDate)));

      await db.insert(studyPlanItem).values(
        activitati.map(a => ({
          userId,
          date: isoDate,
          zi:   ziNume,
          ora:         a.ora,
          activitate:  a.activitate,
          durata:      a.durata,
          tip:         a.tip,
        }))
      );
    }
  }

  return json({ program });
};

// ── Endpoint PATCH pentru bifat/nebifat ─────────────────────
export const PATCH: RequestHandler = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return json({ error: 'Neautentificat' }, { status: 401 });

  const { id, bifat } = await request.json();

  await db.update(studyPlanItem)
    .set({ bifat })
    .where(and(
      eq(studyPlanItem.id, id),
      eq(studyPlanItem.userId, session.user.id)
    ));

  return json({ ok: true });
};

// ── Endpoint PUT pentru adăugare activitate manuală ──────────
export const PUT: RequestHandler = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return json({ error: 'Neautentificat' }, { status: 401 });
  const userId = session.user.id;

  const { date, zi, ora, activitate, durata, tip } = await request.json();

  if (!date || !activitate?.trim()) {
    return json({ error: 'Date invalide' }, { status: 400 });
  }

  const [item] = await db.insert(studyPlanItem).values({
    userId,
    date,
    zi,
    ora,
    activitate: activitate.trim(),
    durata,
    tip,
    bifat: false,
  }).returning();

  return json({ ok: true, item });
};

// ── Endpoint DELETE pentru ștergere activitate ───────────────
export const DELETE: RequestHandler = async ({ request }) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return json({ error: 'Neautentificat' }, { status: 401 });

  const { id } = await request.json();

  await db.delete(studyPlanItem)
    .where(and(
      eq(studyPlanItem.id, id),
      eq(studyPlanItem.userId, session.user.id)
    ));

  return json({ ok: true });
};