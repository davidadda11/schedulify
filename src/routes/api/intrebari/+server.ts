import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
  const { materie, lectie, dificultate, numar } = await request.json();
  const cerNr = numar + 2;

  const prompt = `Ești profesor român. Generează exact ${cerNr} întrebări grilă DOAR în limba română despre "${materie}" - "${lectie}", nivel ${dificultate}.
IMPORTANT: Toate întrebările și răspunsurile trebuie să fie în limba română, nu în engleză.
Răspunde DOAR cu JSON array valid, fără explicații, fără markdown, fără text extra.
Exemplu format (NU copia, generează despre "${lectie}"):
[{"q":"Care este capitala Franței?","o":["Londra","Berlin","Paris","Roma"],"c":2},{"q":"Cât face 3 la puterea 2?","o":["6","8","9","12"],"c":2}]
Reguli stricte:
- "o": exact 4 răspunsuri reale, specifice, în română
- "c": indexul corect, variază între 0,1,2,3
- NICIO opțiune în engleză
- Array cu exact ${cerNr} obiecte complete`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      signal: controller.signal,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:3b',
        prompt,
        stream: false,
        options: { num_ctx: 4096, num_predict: 2000, temperature: 0.5 }
      })
    });

    const data = await response.json();
    const raw: string = data.response ?? '';
    console.log('=== RAW OLLAMA ===', raw);

    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return json({ intrebari: [], error: 'no array found', raw }, { status: 200 });

    let parsed;
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      const fixed = match[0].replace(/,\s*$/, '') + ']';
      try { parsed = JSON.parse(fixed); } catch { parsed = []; }
    }

    if (!Array.isArray(parsed)) return json({ intrebari: [] });

    const reunite: any[] = [];
    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i];
      if (item.q && !item.o && parsed[i + 1]?.o) {
        reunite.push({ q: item.q, o: parsed[i + 1].o, c: parsed[i + 1].c ?? 0 });
        i++;
      } else if (item.q && item.o) {
        reunite.push(item);
      }
    }

    const PLACEHOLDER = ['var1','var2','var3','var4','opt1','opt2','opt3','opt4'];
    const intrebari = reunite
      .filter((x: any) =>
        x.q &&
        Array.isArray(x.o) &&
        x.o.length === 4 &&
        typeof x.c === 'number' &&
        x.c >= 0 && x.c <= 3 &&
        x.o.every((opt: string) => opt && !PLACEHOLDER.includes(opt.toLowerCase().trim()))
      )
      .slice(0, numar); // ia exact câte s-au cerut

    return json({ intrebari });
  } catch (e) {
    return json({ intrebari: [], error: String(e) }, { status: 200 });
  } finally {
    clearTimeout(timeout);
  }
};