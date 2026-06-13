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

  console.log('[analiza-test] Imagine primită:', imagine.name, imagine.size, 'bytes');

  // --- PASUL 1: llava-phi3 citește testul ---
  let descriere = '';
  try {
    const controller1 = new AbortController();
    const timeout1 = setTimeout(() => controller1.abort(), 180000);

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
    console.log('[analiza-test] llava-phi3:', descriere.slice(0, 300));

  } catch (e) {
    console.error('[analiza-test] llava-phi3 error:', e);
    return json({ error: 'Eroare la analiza imaginii.' }, { status: 500 });
  }

  if (!descriere.trim()) {
    return json({ error: 'Modelul nu a putut citi imaginea. Încearcă o poză mai clară.' }, { status: 500 });
  }

  // --- PASUL 2: qwen feedback concret ---
  const prompt2 = `Esti un profesor roman de ${materie || 'liceu'}. Un elev ti-a trimis testul sau. Citeste descrierea si da feedback CONCRET si SPECIFIC.

Ce a vazut AI-ul in test: ${descriere}
Observatii elev: ${observatii || 'niciuna'}

IMPORTANT: Nu folosi fraze generice. Fii specific la materia ${materie || 'din test'}. Mentioneaza concepte reale, exercitii concrete, metode de invatare specifice.

Raspunde DOAR cu acest JSON complet (fara text inainte sau dupa, fara comentarii cu //):
{"nota_estimata":"7","mesaj":"Ai demonstrat cunostinte solide la capitolele de baza, dar subiectul 3 are nevoie de atentie. Nu te descuraja!","culoare":"#3b82f6","ce_a_vazut":"Am observat raspunsuri la [subiecte concrete din descriere]. Elevul a avut dificultati la [parte specifica].","puncteTari":["Descrie primul lucru concret facut bine","Descrie al doilea lucru concret facut bine","Descrie al treilea lucru concret facut bine"],"puncteSlabe":["Descrie prima greseala concreta facuta","Descrie a doua greseala concreta","Descrie a treia greseala concreta"],"recomandari":["Recomandare concreta 1: ce anume sa studieze si cum","Recomandare concreta 2: exercitiu specific de facut","Recomandare concreta 3: metoda de memorare pentru acest subiect","Recomandare concreta 4: cum sa se pregateasca pentru data viitoare"],"capitoleRepetare":["Capitol sau tema concreta 1","Capitol sau tema concreta 2","Capitol sau tema concreta 3"]}`;

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
        options: { num_ctx: 2048, num_predict: 1000, temperature: 0.3 }
      })
    });
    clearTimeout(timeout2);

    const raw2 = await res2.json();
    const text = raw2.response ?? '';
    console.log('[analiza-test] Qwen raw:', text.slice(0, 400));

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return json({ error: 'AI-ul nu a generat un răspuns structurat. Încearcă din nou.' }, { status: 500 });
    }

    const jsonCurat = match[0]
      .replace(/\/\/[^\n"]*/g, '')
      .replace(/,\s*([}\]])/g, '$1')
      .trim();

    const analiza = JSON.parse(jsonCurat);

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