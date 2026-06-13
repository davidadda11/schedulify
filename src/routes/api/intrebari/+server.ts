import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
  const { materie, lectie, dificultate, numar } = await request.json();

  const prompt = `Ești un profesor român. Generează exact ${numar} întrebări în LIMBA ROMÂNĂ, nivel ${dificultate}, pentru materia "${materie}", lecția "${lectie}".
REGULI STRICTE:
- Doar limba română, niciun cuvânt în engleză
- Răspunde DOAR cu un array JSON pe o singură linie
- Fără markdown, fără \`\`\`json, fără text extra
- Exemplu: ["Întrebare 1?", "Întrebare 2?"]`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  const response = await fetch('http://localhost:11434/api/generate', {
    signal: controller.signal,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen2.5:1.5b',
      prompt,
      stream: false,
      options: {
        num_ctx: 1024,
        num_predict: 400,
        temperature: 0.5,
      }
    })
  });
  clearTimeout(timeout);

  const data = await response.json();
  console.log('FULL DATA:', JSON.stringify(data));

  try {
    let raw = data.response ?? '';
    const cleaned = raw
      .replace(/```json[\s\S]*?```/g, (m: string) => m.slice(7, -3))
      .replace(/^```[\w]*\n?/m, '')
      .replace(/```$/m, '')
      .trim();

    console.log('CLEANED:', cleaned);
    const parsed = JSON.parse(cleaned);
    return json({ intrebari: Array.isArray(parsed) ? parsed : [] });
  } catch (e) {
    console.log('PARSE ERROR:', e);
    const match = data.response?.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        return json({ intrebari: Array.isArray(parsed) ? parsed : [] });
      } catch {}
    }
    return json({ intrebari: [], error: String(e) }, { status: 500 });
  }
};