import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

const OLLAMA_URL = 'http://localhost:11434/api/generate';

// Moondream citește textul din imagine (OCR simplu)
async function citesteImagine(base64: string, timeoutMs = 120000): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(OLLAMA_URL, {
      signal: controller.signal,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'moondream:latest',
        prompt: 'Describe everything you see in this image. Read all text, numbers, formulas, and code exactly as written. Include exercise numbers and all content.',
        images: [base64],
        stream: true,
        options: { num_predict: 1000, temperature: 0.0 }
      })
    });

    if (!res.body) throw new Error(`Ollama status ${res.status}`);

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
        try {
          const o = JSON.parse(line);
          if (o.response) out += o.response;
        } catch { /* ignoră linii invalide */ }
      }
    }
    return out.trim();
  } finally {
    clearTimeout(timeout);
  }
}

// Qwen analizează și dă indicii (fără soluție)
async function explicaExercitiu(descriere: string, materie: string, timeoutMs = 120000): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const materieCtx = materie ? `la materia ${materie}` : 'la o materie școlară';
  const prompt = `Ești un profesor român. Un elev are nevoie de ajutor cu o temă ${materieCtx}.

Ce a văzut moondream în imagine:
"""
${descriere.slice(0, 2500)}
"""

Sarcina ta: explică CE SE CERE în exercițiu și oferă INDICII pentru rezolvare. NU da soluția, NU calcula rezultatul final.

Răspunde DOAR cu un JSON valid, fără markdown, fără text în afara acoladelor:
{"ce_se_cere":"[o propoziție clară ce trebuie făcut]","materie_detectata":"[materia]","tip_exercitiu":"[tipul problemei]","pasi":["[indiciu 1]","[indiciu 2]","[indiciu 3]"],"concepte_cheie":["[concept 1]","[concept 2]"]}

REGULI: Nu rezolva. Fiecare pas = un indiciu sau o întrebare ghidată. Totul în română.`;

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
          repeat_penalty: 1.1,
          top_k: 20,
          top_p: 0.85
        }
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
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
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
      .trim();
    return JSON.parse(curat);
  } catch {
    return null;
  }
}

export const POST: RequestHandler = async ({ request }) => {
  const formData = await request.formData();
  const imagine = formData.get('imagine') as File | null;
  const materie = (formData.get('materie') as string ?? '').trim();

  if (!imagine) return json({ error: 'Nicio imagine primită.' }, { status: 400 });

  const base64 = Buffer.from(await imagine.arrayBuffer()).toString('base64');

  // PASUL 1: moondream descrie imaginea
  let descriere = '';
  try {
    descriere = await citesteImagine(base64);
    console.log('[analiza-tema] moondream:', descriere.slice(0, 300));
  } catch (e) {
    console.warn('[analiza-tema] moondream a eșuat:', e);
    // Continuăm — qwen va primi o descriere goală și va spune că nu vede clar
    descriere = 'Imaginea nu a putut fi citită clar.';
  }

  // PASUL 2: qwen generează indicii
  let raw = '';
  try {
    raw = await explicaExercitiu(descriere, materie);
    console.log('[analiza-tema] qwen:', raw.slice(0, 400));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'eroare necunoscută';
    return json({ error: `Eroare la generarea indiciilor: ${msg}` }, { status: 500 });
  }

  const analiza = extrageJSON(raw);

  if (!analiza) {
    return json({ error: 'AI-ul nu a generat un răspuns valid. Încearcă din nou.' }, { status: 500 });
  }

  // Sanitizare minimă
  analiza.ce_se_cere = String(analiza.ce_se_cere || 'Nu s-a putut determina ce se cere.').trim();
  analiza.materie_detectata = materie || String(analiza.materie_detectata || 'Necunoscută').trim();
  analiza.tip_exercitiu = String(analiza.tip_exercitiu || '').trim();
  if (!Array.isArray(analiza.pasi) || analiza.pasi.length === 0) analiza.pasi = ['—'];
  if (!Array.isArray(analiza.concepte_cheie) || analiza.concepte_cheie.length === 0) analiza.concepte_cheie = ['—'];

  return json({ analiza, descriere });
};