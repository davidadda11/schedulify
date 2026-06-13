import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
  const { materii, timpZi, deadline, prioritate } = await request.json();

  const azi = new Date();
  const dataDeadline = new Date(deadline);
  const zileDiff = Math.max(1, Math.ceil((dataDeadline.getTime() - azi.getTime()) / (1000 * 60 * 60 * 24)));
  const nrZile = Math.min(zileDiff, 14);

  const ZILE = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
  const LUNI = ['ianuarie','februarie','martie','aprilie','mai','iunie','iulie','august','septembrie','octombrie','noiembrie','decembrie'];
  const materiiList = materii.split(',').map((m: string) => m.trim()).filter(Boolean);

  const program = [];

  for (let i = 0; i < nrZile; i++) {
    const data = new Date(azi);
    data.setDate(azi.getDate() + i);
    const ziNume = ZILE[data.getDay()];
    const dataStr = `${data.getDate()} ${LUNI[data.getMonth()]}`;

    const materieZi = materiiList[i % materiiList.length];
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

      const raw = (await response.json()).response ?? '';
      const match = raw.match(/\[[\s\S]*\]/);
      const activitati = match ? JSON.parse(match[0]) : [];

      program.push({ zi: ziNume, data: dataStr, activitati: Array.isArray(activitati) ? activitati : [] });
    } catch {
      clearTimeout(timeout);
      program.push({ zi: ziNume, data: dataStr, activitati: [] });
    }
  }

  return json({ program });
};