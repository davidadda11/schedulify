import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
 
export const POST: RequestHandler = async ({ request }) => {
  const formData = await request.formData();
  const imagine = formData.get('imagine') as File | null;
  const materie = formData.get('materie') as string ?? '';
  const observatii = formData.get('observatii') as string ?? '';
 
  if (!imagine) {
    return json({ error: 'Nicio imagine primită.' }, { status: 400 });
  }
 
  const buffer = await imagine.arrayBuffer();
  const base64 = Buffer.from(buffer).toString('base64');
 
  console.log('[analiza-test] Imagine primită:', imagine.name, imagine.type, imagine.size, 'bytes');

  // --- PASUL 1: llava-phi3 citește textul din imagine ---
  let descriere = '';
  try {
    const controller1 = new AbortController();
    const timeout1 = setTimeout(() => controller1.abort(), 180000); // 3 minute
 
    const res1 = await fetch('http://localhost:11434/api/generate', {
      signal: controller1.signal,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llava-phi3',
        prompt: `This is a student's handwritten test paper. Read and transcribe as much text as you can see. Identify: the subject/topic, each question or exercise number, the student's written answers, any grades or scores marked, any corrections or marks. Be specific about what is written.`,
        images: [base64],
        stream: true,
        options: { num_predict: 600, temperature: 0.1 }
      })
    });
    clearTimeout(timeout1);
 
    const reader = res1.body!.getReader();
    const decoder = new TextDecoder();
    let chunks = '';
 
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value);
      const lines = text.split('\n').filter(l => l.trim());
      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          if (obj.response) chunks += obj.response;
          if (obj.done) break;
        } catch {}
      }
    }
 
    descriere = chunks.trim();
    console.log('[analiza-test] llava-phi3 descriere:', descriere.slice(0, 300));
 
  } catch (e) {
    console.error('[analiza-test] llava-phi3 error:', e);
    return json({ error: 'Eroare la analiza imaginii. Verifică că Ollama rulează.' }, { status: 500 });
  }
 
  if (!descriere.trim()) {
    return json({ error: 'Modelul nu a putut citi imaginea. Încearcă o poză mai clară.' }, { status: 500 });
  }
 
  // --- PASUL 2: qwen generează feedback structurat ---
  const prompt2 = `Esti un profesor roman experimentat. Analizeaza acest test de elev si scrie o analiza reala.
 
Descrierea imaginii testului: ${descriere}
Materia: ${materie || 'necunoscuta'}
Observatii elev: ${observatii || 'niciuna'}
 
Raspunde STRICT cu JSON valid, fara text in afara JSON-ului, fara comentarii:
{
  "nota_estimata": "ex: 8",
  "mesaj": "mesaj motivational real de 1-2 propozitii in romana",
  "culoare": "#22c55e",
  "ce_a_vazut": "descrie concret ce ai observat in test, 1-2 propozitii in romana",
  "puncteTari": ["primul punct forte observat", "al doilea punct forte", "al treilea punct forte"],
  "puncteSlabe": ["prima problema identificata", "a doua problema", "a treia problema"],
  "recomandari": ["prima recomandare concreta", "a doua recomandare", "a treia recomandare", "a patra recomandare"],
  "capitoleRepetare": ["primul capitol de studiat", "al doilea capitol", "al treilea capitol"]
}`;
 
  try {
    const controller2 = new AbortController();
    const timeout2 = setTimeout(() => controller2.abort(), 60000);
 
    const res2 = await fetch('http://localhost:11434/api/generate', {
      signal: controller2.signal,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:1.5b',
        prompt: prompt2,
        stream: false,
        options: { num_ctx: 2048, num_predict: 800, temperature: 0.2 }
      })
    });
    clearTimeout(timeout2);
 
    const raw2 = await res2.json();
    const text = raw2.response ?? '';
    console.log('[analiza-test] Qwen răspuns raw:', text.slice(0, 300));
 
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return json({ error: 'AI-ul nu a generat un răspuns structurat. Încearcă din nou.' }, { status: 500 });
    }
 
    const jsonCurat = match[0]
      .replace(/\/\/[^\n"]*/g, '')
      .replace(/,\s*([}\]])/g, '$1')
      .trim();
 
    const analiza = JSON.parse(jsonCurat);

    // Curățăm nota și setăm culoarea corect
    analiza.nota_estimata = String(analiza.nota_estimata).replace(/^ex:\s*/i, '').trim();
    const notaNum = parseFloat(analiza.nota_estimata);
    if (!isNaN(notaNum)) {
      analiza.culoare = notaNum >= 9 ? '#22c55e'
        : notaNum >= 7 ? '#3b82f6'
        : notaNum >= 5 ? '#f59e0b'
        : '#ef4444';
    }

    return json({ analiza, descriere });
 
  } catch (e) {
    console.error('[analiza-test] qwen error:', e);
    return json({ error: 'Eroare la generarea analizei.' }, { status: 500 });
  }
};