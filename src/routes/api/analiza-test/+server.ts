// OPȚIUNEA A — Viteză: moondream (OCR) + qwen2.5:3b (analiză)
// ~40-55s, calitate medie, sigur pe RAM-ul tău

import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

const OLLAMA_URL = 'http://localhost:11434/api/generate';

async function ollamaVision(base64: string, timeoutMs = 60000): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(OLLAMA_URL, {
      signal: controller.signal,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'moondream:latest',
        prompt: 'List all text visible in this image. Include every word, number, and symbol exactly as written. Include handwritten text.',
        images: [base64],
        stream: true,
        keep_alive: 0,
        options: { num_predict: 1000, temperature: 0.0 }
      })
    });
    if (!res.body) throw new Error(`Ollama status ${res.status}`);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let out = '', buffer = '';
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
          if (o.error) throw new Error(o.error);
          if (o.response) out += o.response;
        } catch { continue; }
      }
    }
    return out.trim();
  } finally {
    clearTimeout(timeout);
  }
}

async function ollamaText(prompt: string, timeoutMs = 90000): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(OLLAMA_URL, {
      signal: controller.signal,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:3b',
        prompt,
        stream: false,
        keep_alive: 0,
        options: { num_ctx: 2048, num_predict: 500, temperature: 0.1, repeat_penalty: 1.2, top_k: 20, top_p: 0.85 }
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
    return JSON.parse(match[0].replace(/\/\/[^\n"]*/g, '').replace(/,\s*([}\]])/g, '$1').replace(/[\x00-\x1F\x7F]/g, ' ').trim());
  } catch { return null; }
}

function buildPrompt(subject: string, descriere: string, observatii: string): string {
  const obs = observatii ? `\nNotă elev: "${observatii}"` : '';
  return `Ești profesor român. Analizează testul de ${subject}. OCR de pe lucrarea elevului:

"""
${descriere.slice(0, 2000)}
"""${obs}

Răspunde DOAR cu JSON valid, fără markdown. Exemplu de STIL (test de matematică, nu de conținut):
{"nota_estimata":"8","mesaj":"Elevul a rezolvat corect exercițiile I și II, dar la III a calculat greșit aria.","ce_a_vazut":"La I a obținut x=3. La II a simplificat 12/18 la 2/3. La III a folosit formula greșită.","puncteTari":["La exercițiul I a izolat corect x obținând 3.","La exercițiul II a găsit corect cmmdc=6."],"puncteSlabe":["La exercițiul III a folosit perimetrul în loc de arie, obținând 15 în loc de 6."],"recomandari":["Recapitulează formulele de arie pentru triunghi."],"capitoleRepetare":["Aria figurilor geometrice"]}

Acum analizează testul real de ${subject}. JSON cu conținut REAL, în română, cu numere de exerciții și răspunsuri exacte ale elevului. Nu folosi nimic din exemplul de matematică.`;
}

function pareTemplate(a: any): boolean {
  return /x=3|12\/18|triunghi.*perimetru|specific (strength|weakness)|sentences in romanian/i.test(JSON.stringify(a));
}

export const POST: RequestHandler = async ({ request }) => {
  const formData = await request.formData();
  const imagine = formData.get('imagine') as File | null;
  const materie = (formData.get('materie') as string ?? '').trim();
  const observatii = (formData.get('observatii') as string ?? '').trim();
  if (!imagine) return json({ error: 'Nicio imagine primită.' }, { status: 400 });

  const base64 = Buffer.from(await imagine.arrayBuffer()).toString('base64');

  let descriere = '';
  try {
    descriere = await ollamaVision(base64);
    console.log('[A] OCR moondream:', descriere.slice(0, 400));
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'eroare';
    return json({ error: msg.toLowerCase().includes('abort') ? 'Citirea imaginii a durat prea mult. Încearcă o poză mai mică (sub 2MB).' : `Eroare OCR: ${msg}` }, { status: 500 });
  }
  if (!descriere.trim()) return json({ error: 'Modelul nu a putut citi text din imagine.' }, { status: 500 });

  const subject = materie || 'școală';
  let analiza: any = null;
  for (let i = 0; i < 2; i++) {
    let raw = '';
    try {
      raw = await ollamaText(i === 0 ? buildPrompt(subject, descriere, observatii) : buildPrompt(subject, descriere, observatii) + '\n\nGenerează DOAR JSON cu conținut real, în română.');
      console.log(`[A] qwen3b try ${i}:`, raw.slice(0, 400));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'eroare';
      return json({ error: msg.toLowerCase().includes('abort') ? 'Analiza a durat prea mult. Încearcă din nou.' : `Eroare analiză: ${msg}` }, { status: 500 });
    }
    const parsed = extrageJSON(raw);
    if (parsed && !pareTemplate(parsed)) { analiza = parsed; break; }
    analiza = parsed;
  }

  if (!analiza) return json({ error: 'Răspuns invalid. Încearcă din nou.' }, { status: 500 });

  analiza.nota_estimata = String(analiza.nota_estimata).replace(/[^0-9.]/g, '').trim() || '5';
  const nota = parseFloat(analiza.nota_estimata);
  analiza.culoare = nota >= 9 ? '#22c55e' : nota >= 7 ? '#3b82f6' : nota >= 5 ? '#f59e0b' : '#ef4444';
  for (const key of ['puncteTari', 'puncteSlabe', 'recomandari', 'capitoleRepetare']) {
    if (!Array.isArray(analiza[key]) || analiza[key].length === 0) analiza[key] = ['—'];
  }

  return json({ analiza, descriere });
};