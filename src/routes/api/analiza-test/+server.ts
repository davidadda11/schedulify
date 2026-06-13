import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

const OLLAMA_URL = 'http://localhost:11434/api/generate';

async function ollamaVision(base64: string, timeoutMs = 120000): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(OLLAMA_URL, {
      signal: controller.signal,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'moondream:latest',
        prompt: `Read every single word and number written in this image. Output raw text only, exactly as written, including all handwritten answers, exercise numbers, scores, and marks. Do not summarize or interpret.`,
        images: [base64],
        stream: true,
        options: { num_predict: 800, temperature: 0.0 }
      })
    });

    if (!res.body) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Ollama nu a răspuns (status ${res.status}). ${txt.slice(0, 200)}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let out = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.trim()) continue;
        let o: any;
        try {
          o = JSON.parse(line);
        } catch {
          continue;
        }
        if (o.error) throw new Error(`Ollama vision error: ${o.error}`);
        if (o.response) out += o.response;
      }
    }
    return out.trim();
  } finally {
    clearTimeout(timeout);
  }
}

async function ollamaText(prompt: string, timeoutMs = 120000): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(OLLAMA_URL, {
      signal: controller.signal,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:7b',
        prompt,
        stream: false,
        options: {
          num_ctx: 3072,
          num_predict: 600,
          temperature: 0.1,
          repeat_penalty: 1.2,
          top_k: 20,
          top_p: 0.85
        }
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(`Ollama text error: ${data.error}`);
    return data.response ?? '';
  } finally {
    clearTimeout(timeout);
  }
}

function extrageJSON(text: string): any | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const curat = match[0]
      .replace(/\/\/[^\n"]*/g, '')
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/[\x00-\x1F\x7F]/g, ' ')
      .trim();
    return JSON.parse(curat);
  } catch {
    return null;
  }
}

function buildPrompt(subject: string, descriere: string, observatii: string): string {
  const obs = observatii ? `\nNotă elev: "${observatii}"` : '';
  return `Ești un profesor român care analizează un test la ${subject}. Mai jos este textul citit (OCR) de pe lucrarea scrisă de mână a elevului.

TEXT TEST:
"""
${descriere.slice(0, 2700)}
"""${obs}

PAS 1: Identifică mental exercițiile/subiectele numerotate (I, II, III, 1, 2, a, b, c etc.) și ce a răspuns elevul la fiecare.

PAS 2: Răspunde STRICT cu un obiect JSON, fără markdown, fără explicații, fără text în engleză.

EXEMPLU de răspuns CORECT (pentru un alt test, ca model de STIL — observă că fiecare câmp e o propoziție completă, concretă, despre conținutul real al testului, niciodată o descriere a formatului):
{"nota_estimata":"7","mesaj":"Elevul a răspuns corect la exercițiul II, enumerând caracteristicile nucleului intern, dar la exercițiul III a clasificat greșit bazaltul.","culoare":"#3b82f6","ce_a_vazut":"La exercițiul I a scris definițiile mișcărilor epirogenetice și ale riftului. La exercițiul II a enumerat patru caracteristici ale nucleului intern (solid, conține nichel și fier, 4500°C, densitate peste 22 g/cm3). La exercițiul III a clasificat bazaltul ca rocă sedimentară.","puncteTari":["La exercițiul II a enumerat corect toate cele patru caracteristici ale nucleului intern, inclusiv temperatura de 4500°C și densitatea peste 22 g/cm3.","La exercițiul IV.b a identificat corect categoria de mărime a plăcilor tectonice 7, 9 și 13."],"puncteSlabe":["La exercițiul III, punctul 1, a clasificat bazaltul ca rocă sedimentară detritică în loc de rocă eruptivă efuzivă.","La exercițiul IV.a nu a precizat denumirea plăcii tectonice numărul 9."],"recomandari":["Recapitulează diferența dintre rocile eruptive, sedimentare și metamorfice folosind exemple ca bazaltul și granitul.","Exersează identificarea plăcilor tectonice pe hartă folosind denumirile lor complete."],"capitoleRepetare":["Clasificarea rocilor după origine","Plăcile tectonice și mișcările lor"]}

ACUM analizează testul real de mai sus și generează un JSON cu EXACT aceeași structură de câmpuri, dar cu conținut REAL despre ACEST test, în stilul exemplului de mai sus.

REGULI STRICTE:
- INTERZIS să scrii text în engleză sau descrieri de tipul "specific strength", "mention an exercise" etc. Tot ce scrii trebuie să fie propoziții în română despre testul real.
- INTERZIS fraze generice ca "a confuzat subiectul", "ar trebui să citească mai atent", fără să spui exact CE exercițiu și CE a scris elevul.
- Fiecare element din puncteTari și puncteSlabe TREBUIE să menționeze un număr de exercițiu (I, II, III, IV.a, IV.b, V etc.) ȘI termenul/răspunsul exact scris de elev.
- nota_estimata: număr întreg 1-10, în funcție de câte exerciții par corecte vs greșite/lipsă.
- Dacă o parte din text e neclară, spune asta explicit, în română, despre conținutul testului - nu inventa.`;
}

function pareTemplate(analiza: any): boolean {
  const text = JSON.stringify(analiza).toLowerCase();
  return /specific (strength|weakness)|tied to an exercise|mention a |the first question|sentences in romanian/.test(text);
}

export const POST: RequestHandler = async ({ request }) => {
  const formData = await request.formData();
  const imagine = formData.get('imagine') as File | null;
  const materie = (formData.get('materie') as string ?? '').trim();
  const observatii = (formData.get('observatii') as string ?? '').trim();

  if (!imagine) return json({ error: 'Nicio imagine primită.' }, { status: 400 });

  const base64 = Buffer.from(await imagine.arrayBuffer()).toString('base64');

  // --- PASUL 1: moondream citește textul din imagine ---
  let descriere = '';
  try {
    descriere = await ollamaVision(base64);
    console.log('[analiza-test] OCR:', descriere.slice(0, 500));
  } catch (e) {
    console.error('[analiza-test] vision error:', e);
    const msg = e instanceof Error ? e.message : 'eroare necunoscută';
    return json({ error: `Eroare la citirea imaginii: ${msg}` }, { status: 500 });
  }

  if (!descriere.trim()) {
    return json({ error: 'Modelul nu a putut citi niciun text din imagine. Încearcă o poză mai clară sau mai bine luminată.' }, { status: 500 });
  }

  // --- PASUL 2: qwen2.5:7b analizează ---
  const subject = materie || 'school';
  const prompt = buildPrompt(subject, descriere, observatii);

  let analiza: any = null;
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    let raw = '';
    try {
      raw = await ollamaText(
        tentativa === 0
          ? prompt
          : prompt + '\n\nIMPORTANT: răspunsul anterior a copiat instrucțiunile în loc de conținut real. Generează DOAR JSON valid, cu propoziții în română despre testul real, fără descrieri de format.'
      );
      console.log(`[analiza-test] qwen raw (try ${tentativa}):`, raw.slice(0, 600));
    } catch (e) {
      console.error('[analiza-test] qwen error:', e);
      const msg = e instanceof Error ? e.message : 'eroare necunoscută';
      return json({ error: `Eroare la generarea analizei: ${msg}` }, { status: 500 });
    }

    const parsed = extrageJSON(raw);
    if (parsed && !pareTemplate(parsed)) {
      analiza = parsed;
      break;
    }
    analiza = parsed;
  }

  if (!analiza) {
    return json({ error: 'AI-ul nu a generat un răspuns valid. Încearcă din nou.' }, { status: 500 });
  }

  // sanitizare
  analiza.nota_estimata = String(analiza.nota_estimata).replace(/[^0-9.]/g, '').trim() || '5';
  const nota = parseFloat(analiza.nota_estimata);
  analiza.culoare = nota >= 9 ? '#22c55e' : nota >= 7 ? '#3b82f6' : nota >= 5 ? '#f59e0b' : '#ef4444';

  for (const key of ['puncteTari', 'puncteSlabe', 'recomandari', 'capitoleRepetare']) {
    if (!Array.isArray(analiza[key]) || analiza[key].length === 0) analiza[key] = ['—'];
  }

  return json({ analiza, descriere });
};