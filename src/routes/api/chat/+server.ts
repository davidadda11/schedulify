import { json } from '@sveltejs/kit';

const SYSTEM_PROMPT = `Ești Schedulify AI, un asistent educațional pentru elevi din România. Răspunde cu acuratețe științifică, biologică și matematică maximă (folosește termeni corecți: "ipotenuza", "conuri", "silogism").

Răspunzi DOAR cu un array JSON valid de stringuri.
Format exact: ["mesaj"] sau ["mesaj1", "mesaj2", "mesaj3"]

Reguli stricte pentru structură (ALEGE DOAR O VARIANTĂ, NICIODATĂ AMBELE):
1. DECIZIE SIMPLĂ (Pentru definiții rapide, saluturi, întrebări scurte sau uzuale): Generează UN SINGUR string în tot array-ul. Pune toată informația esențială acolo (maxim 2 propoziții).
2. DECIZIE COMPLEXĂ (Doar pentru procese în pași, rezolvări de probleme sau subiecte vaste): Generează EXACT 3 stringuri în array. Fiecare string aduce o informație complet nouă.

Interziceri absolute:
- ESTE INTERZIS să generezi 2 stringuri în array. Aceasta este cauza repetării aceleiași idei. Ori generezi exact 1, ori generezi exact 3.
- NU repeta și NU parafraza aceeași idee sub alte cuvinte în bule diferite din același array.
- Fiecare string are maxim 2 propoziții scurte, clare și concise.
- DOAR array JSON pur, fără prefixe ca "AI:" sau alte texte în afara parantezelor pătrate.`;

function cleanBubble(text: string): string {
	return text.replace(/^(AI:|Schedulify AI:|Elev:)\s*/i, '').trim();
}

export const POST = async ({ request }: { request: Request }) => {
	const { messages } = await request.json();

	const lastMessages = messages.slice(-4);
	const prompt = lastMessages
		.map((m: { role: string; text: string }) =>
			m.role === 'user'
				? `Elev: ${m.text}`
				: `Schedulify AI: ${cleanBubble(m.text)}`
		)
		.join('\n') + '\nSchedulify AI:';

	const ollamaRes = await fetch('http://localhost:11434/api/generate', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			model: 'qwen2.5:3b',
			prompt: `${SYSTEM_PROMPT}\n\nContexul conversației:\n${prompt}`,
			stream: false,
			options: {
				num_predict: 400,
				temperature: 0.2, // Scăzută suplimentar de la 0.3 la 0.2 pentru a forța respectarea strictă a logicii IF/ELSE
				stop: ['\nElev:', '\nSchedulify AI:']
			}
		})
	});

	if (!ollamaRes.ok) {
		return json({ error: 'Ollama nu răspunde. Verifică dacă rulează.' }, { status: 500 });
	}

	const data = await ollamaRes.json();
	const raw = data.response?.trim() ?? '';

	try {
		const match = raw.match(/\[[\s\S]*\]/);
		if (!match) throw new Error('no array');

		const parsed: string[] = JSON.parse(match[0]);
		
		// Filtru de siguranță la nivel de cod pentru a elimina duplicările textuale
		const uniqueBubbles: string[] = [];
		for (const str of parsed) {
			const cleaned = cleanBubble(str).trim();
			if (cleaned && !uniqueBubbles.includes(cleaned)) {
				uniqueBubbles.push(cleaned);
			}
		}

		// Dacă modelul a generat din greșeală 2 elemente identice și curățarea a lăsat 2 elemente diferite, le păstrăm, dar limităm la structura corectă
		const bubbles = uniqueBubbles.slice(0, 4);

		if (bubbles.length === 0) throw new Error('empty');
		return json({ bubbles });
	} catch {
		const cleaned = cleanBubble(raw.replace(/[\[\]"]/g, '').trim());
		return json({ bubbles: [cleaned || 'Nu am putut genera un răspuns.'] });
	}
};
