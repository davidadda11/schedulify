<script lang="ts">
  import { onMount } from 'svelte';

  let mounted = $state(false);
  onMount(() => setTimeout(() => { mounted = true; }, 100));

  let materie = $state('');
  let cerinta = $state('');
  let textTema = $state('');
  let loading = $state(false);

  type ScorItem = { label: string; valoare: number; culoare: string };
  type Feedback = {
    scorGeneral: number;
    scoruri: ScorItem[];
    puncteFoarte: string[];
    imbunatatiri: string[];
    sugestii: string[];
    concluzie: string;
  };
  let feedback = $state<Feedback | null>(null);

  function calcScore(text: string): number {
    const words = text.trim().split(/\s+/).length;
    if (words < 30) return 4 + Math.random() * 2;
    if (words < 80) return 6 + Math.random() * 2;
    return 7.5 + Math.random() * 2;
  }

  function analizeazaTema() {
    if (!materie.trim() || !textTema.trim()) return;
    loading = true;
    feedback = null;

    setTimeout(() => {
      const baseScore = calcScore(textTema);
      const words = textTema.trim().split(/\s+/).length;

      feedback = {
        scorGeneral: Math.min(10, parseFloat(baseScore.toFixed(1))),
        scoruri: [
          { label: 'Claritate', valoare: Math.min(10, baseScore + (Math.random() - 0.3)), culoare: '#3b82f6' },
          { label: 'Structură', valoare: Math.min(10, baseScore - 0.5 + Math.random()), culoare: '#6366f1' },
          { label: 'Corectitudine', valoare: Math.min(10, baseScore + 0.2 - Math.random() * 0.5), culoare: '#22c55e' },
          { label: 'Profunzime', valoare: Math.min(10, baseScore - 1 + Math.random()), culoare: '#f59e0b' },
        ].map(s => ({ ...s, valoare: parseFloat(Math.max(1, s.valoare).toFixed(1)) })),
        puncteFoarte: [
          words > 60 ? 'Răspunsul are o lungime adecvată' : 'Ai abordat ideea principală',
          `Tema acoperă subiectul de la ${materie}`,
          cerinta ? 'Cerința a fost luată în considerare în răspuns' : 'Structura de bază este prezentă',
        ],
        imbunatatiri: [
          words < 50 ? 'Dezvoltă mai mult ideile principale — răspunsul este prea scurt' : 'Unele paragrafe pot fi mai bine dezvoltate',
          'Adaugă exemple concrete pentru a susține argumentele',
          'Verifică semnele de punctuație și diacriticele',
        ],
        sugestii: [
          `Citește încă o dată cerința de la ${materie} și compară cu răspunsul tău`,
          'Adaugă o concluzie clară la final dacă lipsește',
          'Folosește conectori logici: "în primul rând", "de asemenea", "în concluzie"',
          'Lasă răspunsul deoparte 10 minute, apoi recitește-l cu ochi proaspeți',
        ],
        concluzie: baseScore >= 8
          ? 'Tema ta este bine redactată. Cu câteva ajustări minore va fi excelentă!'
          : baseScore >= 6
          ? 'Bună bază! Urmează sugestiile de mai sus pentru un rezultat mai bun.'
          : 'Tema are nevoie de mai multă muncă. Concentrează-te pe structură și detalii.',
      };

      loading = false;
    }, 1400);
  }
</script>

<svelte:head>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap" rel="stylesheet" />
</svelte:head>

<div class="page" class:mounted>
  <div class="bg-blob blob-1"></div>
  <div class="bg-blob blob-2"></div>
  <div class="bg-blob blob-3"></div>
  <div class="grid-overlay"></div>

  <main class="main-content">
    <header class="top-header">
      <a href="/sali-pregatire" class="back-link">← Săli de pregătire</a>
      <h2>Analiză temă</h2>
      <p>Primește feedback detaliat pentru tema sau răspunsul tău.</p>
    </header>

    <div class="bento-card">
      <div class="card-header">
        <h3>Tema ta</h3>
        <span class="badge">Feedback automat</span>
      </div>
      <div class="card-body">
        <div class="form-row">
          <div class="field">
            <label for="mat">Materie</label>
            <input id="mat" type="text" placeholder="ex: Română, Istorie, Biologie…" bind:value={materie} />
          </div>
          <div class="field">
            <label for="cer">Cerința temei</label>
            <input id="cer" type="text" placeholder="ex: Comentează textul următor…" bind:value={cerinta} />
          </div>
        </div>

        <div class="field">
          <label for="tema">Răspunsul / Tema ta</label>
          <textarea id="tema" placeholder="Lipește sau scrie tema ta aici…" bind:value={textTema} rows="8"></textarea>
          <span class="char-count">{textTema.trim().split(/\s+/).filter(Boolean).length} cuvinte</span>
        </div>

        <button class="action-btn" onclick={analizeazaTema} disabled={!materie.trim() || !textTema.trim() || loading}>
          {#if loading}
            <span class="spinner"></span> Se analizează…
          {:else}
            📝 Analizează tema
          {/if}
        </button>
      </div>
    </div>

    {#if feedback}
      <div class="feedback-wrapper">
        <!-- Scor general + scoruri -->
        <div class="bento-card scor-overview">
          <div class="scor-left">
            <div class="scor-big">{feedback.scorGeneral}</div>
            <div class="scor-label">Scor general</div>
            <p class="concluzie">{feedback.concluzie}</p>
          </div>
          <div class="scor-bars">
            {#each feedback.scoruri as s}
              <div class="bar-item">
                <div class="bar-meta">
                  <span class="bar-label">{s.label}</span>
                  <span class="bar-val">{s.valoare}/10</span>
                </div>
                <div class="bar-track">
                  <div class="bar-fill" style="width: {s.valoare * 10}%; background: {s.culoare}"></div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- 3 coloane feedback -->
        <div class="feedback-grid">
          <div class="feedback-card tip-verde">
            <div class="fc-header"><span>✅</span><h4>Ce ai făcut bine</h4></div>
            <ul>
              {#each feedback.puncteFoarte as p}<li>{p}</li>{/each}
            </ul>
          </div>
          <div class="feedback-card tip-rosu">
            <div class="fc-header"><span>🔧</span><h4>Ce trebuie îmbunătățit</h4></div>
            <ul>
              {#each feedback.imbunatatiri as p}<li>{p}</li>{/each}
            </ul>
          </div>
          <div class="feedback-card tip-albastru">
            <div class="fc-header"><span>💡</span><h4>Sugestii concrete</h4></div>
            <ul>
              {#each feedback.sugestii as s}<li>{s}</li>{/each}
            </ul>
          </div>
        </div>
      </div>
    {/if}
  </main>
</div>

<style>
  :global(*, *::before, *::after) { box-sizing: border-box; margin: 0; padding: 0; }

  .page {
    --blue-950: #0a1628; --blue-900: #0f2347;
    --blue-600: #2563eb; --blue-500: #3b82f6;
    --blue-400: #60a5fa; --blue-200: #bfdbfe;
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh; width: 100vw; background: var(--blue-950);
    position: relative; overflow-x: hidden;
    opacity: 0; transform: translateY(16px);
    transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1);
  }
  .page.mounted { opacity: 1; transform: translateY(0); }

  .bg-blob { position: fixed; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0; }
  .blob-1 { width: 600px; height: 600px; background: radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 70%); top: -100px; left: -100px; animation: blobFloat 9s ease-in-out infinite; }
  .blob-2 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(96,165,250,0.15) 0%, transparent 70%); bottom: -100px; right: 10%; animation: blobFloat 12s ease-in-out infinite reverse; }
  .blob-3 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%); top: 40%; left: 40%; animation: blobFloat 7s ease-in-out infinite 3s; }
  @keyframes blobFloat { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-20px) scale(1.05)} 66%{transform:translate(-15px,15px) scale(0.97)} }

  .grid-overlay { position: fixed; inset: 0; z-index: 0; pointer-events: none; background-image: linear-gradient(rgba(96,165,250,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(96,165,250,0.04) 1px,transparent 1px); background-size: 60px 60px; }

  .main-content { position: relative; z-index: 1; max-width: 940px; margin: 0 auto; padding: 48px 32px 64px; display: flex; flex-direction: column; gap: 32px; }

  .top-header { color: white; display: flex; flex-direction: column; gap: 8px; }
  .back-link { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 500; color: var(--blue-400); text-decoration: none; margin-bottom: 8px; transition: color 0.2s; width: fit-content; }
  .back-link:hover { color: white; }
  .top-header h2 { font-family: 'Syne', sans-serif; font-size: 36px; font-weight: 800; letter-spacing: -0.5px; }
  .top-header p { color: var(--blue-200); font-size: 16px; }

  .bento-card { background: rgba(255,255,255,0.95); border-radius: 24px; padding: 32px; box-shadow: 0 4px 24px rgba(10,22,40,0.25),0 0 0 1px rgba(37,99,235,0.08); display: flex; flex-direction: column; gap: 20px; }
  .card-header { display: flex; justify-content: space-between; align-items: center; }
  .card-header h3 { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: var(--blue-950); }
  .badge { background: #dbeafe; color: var(--blue-600); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }
  .card-body { display: flex; flex-direction: column; gap: 20px; }

  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .field { display: flex; flex-direction: column; gap: 8px; }
  .field label { font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  .field input[type="text"],.field textarea {
    padding: 12px 16px; border: 2px solid #e2e8f0; border-radius: 12px;
    font-family: 'DM Sans', sans-serif; font-size: 15px; color: var(--blue-950); background: #f8fafc; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s; resize: vertical;
  }
  .field input:focus,.field textarea:focus { border-color: var(--blue-500); box-shadow: 0 0 0 3px rgba(59,130,246,0.15); background: white; }
  .char-count { font-size: 12px; color: #94a3b8; text-align: right; }

  .action-btn { display: inline-flex; align-items: center; gap: 10px; background: var(--blue-600); color: white; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600; padding: 14px 28px; border-radius: 14px; border: none; cursor: pointer; align-self: flex-start; transition: background 0.2s, transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s; }
  .action-btn:hover:not(:disabled) { background: var(--blue-500); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(37,99,235,0.35); }
  .action-btn:disabled { opacity: 0.55; cursor: not-allowed; }

  .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Feedback */
  .feedback-wrapper { display: flex; flex-direction: column; gap: 24px; animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1); }
  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }

  .scor-overview { flex-direction: row !important; gap: 40px; align-items: flex-start; }

  .scor-left { display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 140px; }
  .scor-big { font-family: 'Syne', sans-serif; font-size: 56px; font-weight: 800; color: var(--blue-600); line-height: 1; }
  .scor-label { font-size: 13px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
  .concluzie { font-size: 14px; color: #475569; text-align: center; line-height: 1.5; margin-top: 4px; }

  .scor-bars { flex: 1; display: flex; flex-direction: column; gap: 14px; }
  .bar-item { display: flex; flex-direction: column; gap: 6px; }
  .bar-meta { display: flex; justify-content: space-between; }
  .bar-label { font-size: 13px; font-weight: 600; color: #475569; }
  .bar-val { font-size: 13px; font-weight: 700; color: var(--blue-950); }
  .bar-track { background: #e2e8f0; border-radius: 6px; height: 8px; overflow: hidden; }
  .bar-fill { height: 100%; border-radius: 6px; transition: width 0.8s cubic-bezier(0.16,1,0.3,1); }

  .feedback-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }

  .feedback-card { background: rgba(255,255,255,0.95); border-radius: 20px; padding: 24px; box-shadow: 0 4px 16px rgba(10,22,40,0.15); display: flex; flex-direction: column; gap: 14px; border-left: 4px solid transparent; }
  .tip-verde  { border-left-color: #22c55e; }
  .tip-rosu   { border-left-color: #ef4444; }
  .tip-albastru { border-left-color: var(--blue-600); }

  .fc-header { display: flex; align-items: center; gap: 10px; }
  .fc-header span { font-size: 18px; }
  .fc-header h4 { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--blue-950); }

  .feedback-card ul { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 10px; }
  .feedback-card li { font-size: 14px; color: #475569; padding-left: 14px; position: relative; line-height: 1.55; }
  .feedback-card li::before { content: '—'; position: absolute; left: 0; color: #94a3b8; }

  @media (max-width: 900px) {
    .scor-overview { flex-direction: column !important; }
    .scor-left { flex-direction: row; min-width: auto; }
    .feedback-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 768px) {
    .main-content { padding: 32px 20px 48px; }
    .top-header h2 { font-size: 26px; }
    .form-row { grid-template-columns: 1fr; }
  }
</style>