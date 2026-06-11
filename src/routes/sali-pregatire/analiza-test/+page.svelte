<script lang="ts">
  import { onMount } from 'svelte';

  let mounted = $state(false);
  onMount(() => setTimeout(() => { mounted = true; }, 100));

  let materie = $state('');
  let nota = $state('');
  let intrebariGresite = $state('');
  let observatii = $state('');
  let loading = $state(false);

  type Analiza = {
    puncteTari: string[];
    puncteSlabe: string[];
    recomandari: string[];
    capitoleRepetare: string[];
    mesaj: string;
    culoare: string;
  };
  let analiza = $state<Analiza | null>(null);

  function analizeaza() {
    if (!materie.trim() || !nota) return;
    loading = true;
    analiza = null;

    setTimeout(() => {
      const notaNum = parseFloat(nota);
      let culoare = notaNum >= 9 ? '#22c55e' : notaNum >= 7 ? '#3b82f6' : notaNum >= 5 ? '#f59e0b' : '#ef4444';

      const gresite = intrebariGresite.split(',').map(s => s.trim()).filter(Boolean);

      analiza = {
        mesaj: notaNum >= 9
          ? 'Rezultat excelent! Continuă să menții acest nivel.'
          : notaNum >= 7
          ? 'Rezultat bun, dar există loc de îmbunătățire.'
          : notaNum >= 5
          ? 'Ai promovat, dar trebuie să approfundezi unele capitole.'
          : 'Rezultatul necesită muncă suplimentară. Nu te descuraja!',
        culoare,
        puncteTari: [
          `Ai demonstrat înțelegere la capitolele de bază din ${materie}`,
          'Structura răspunsurilor este corectă în general',
          notaNum >= 7 ? 'Stăpânești bine conceptele fundamentale' : 'Ai răspuns corect la întrebările simple',
        ],
        puncteSlabe: gresite.length > 0
          ? gresite.map(g => `Lacune la: ${g}`)
          : [
              `Unele concepte avansate din ${materie} necesită repetare`,
              'Gestionarea timpului poate fi îmbunătățită',
              'Unele răspunsuri au lipsit detalii importante',
            ],
        recomandari: [
          `Recitește capitolele slabe din ${materie} de cel puțin 2 ori`,
          'Rezolvă exerciții similare cu cele greșite',
          'Fă un rezumat scris cu principalele formule/reguli',
          'Discută cu profesorul greșelile neînțelese',
        ],
        capitoleRepetare: gresite.length > 0
          ? gresite
          : [`Capitol introductiv — ${materie}`, 'Exerciții de consolidare', 'Aplicații practice'],
      };

      loading = false;
    }, 1300);
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
      <h2>Analiză test</h2>
      <p>Introdu rezultatele testului și primești o analiză detaliată.</p>
    </header>

    <div class="bento-card">
      <div class="card-header">
        <h3>Detalii test</h3>
        <span class="badge">Analiză inteligentă</span>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="field">
            <label for="materie">Materie</label>
            <input id="materie" type="text" placeholder="ex: Matematică, Biologie…" bind:value={materie} />
          </div>
          <div class="field">
            <label for="nota">Nota / Scorul obținut</label>
            <input id="nota" type="number" min="1" max="10" step="0.5" placeholder="ex: 7.5" bind:value={nota} />
          </div>
          <div class="field full-width">
            <label for="gresite">Întrebările greșite / capitole (separate prin virgulă)</label>
            <input id="gresite" type="text" placeholder="ex: Ecuații, Geometrie, Funcții…" bind:value={intrebariGresite} />
          </div>
          <div class="field full-width">
            <label for="obs">Observații suplimentare</label>
            <textarea id="obs" placeholder="Ce ai simțit că nu știai? Ce a fost dificil?" bind:value={observatii} rows="3"></textarea>
          </div>
        </div>

        <button class="action-btn" onclick={analizeaza} disabled={!materie.trim() || !nota || loading}>
          {#if loading}
            <span class="spinner"></span> Se analizează…
          {:else}
            📊 Analizează testul
          {/if}
        </button>
      </div>
    </div>

    {#if analiza}
      <div class="analiza-wrapper">
        <!-- Scor vizual -->
        <div class="scor-card">
          <div class="scor-circle" style="border-color: {analiza.culoare}; color: {analiza.culoare}">
            {nota}
          </div>
          <div class="scor-info">
            <div class="scor-materie">{materie}</div>
            <p class="scor-mesaj">{analiza.mesaj}</p>
          </div>
        </div>

        <div class="results-grid">
          <!-- Puncte tari -->
          <div class="result-card tip-verde">
            <div class="result-header">
              <span class="result-icon">✅</span>
              <h4>Puncte forte</h4>
            </div>
            <ul class="result-list">
              {#each analiza.puncteTari as p}
                <li>{p}</li>
              {/each}
            </ul>
          </div>

          <!-- Puncte slabe -->
          <div class="result-card tip-rosu">
            <div class="result-header">
              <span class="result-icon">⚠️</span>
              <h4>Puncte slabe</h4>
            </div>
            <ul class="result-list">
              {#each analiza.puncteSlabe as p}
                <li>{p}</li>
              {/each}
            </ul>
          </div>

          <!-- Recomandări -->
          <div class="result-card tip-albastru">
            <div class="result-header">
              <span class="result-icon">💡</span>
              <h4>Recomandări</h4>
            </div>
            <ul class="result-list">
              {#each analiza.recomandari as r}
                <li>{r}</li>
              {/each}
            </ul>
          </div>

          <!-- Capitole -->
          <div class="result-card tip-galben">
            <div class="result-header">
              <span class="result-icon">📚</span>
              <h4>Capitole de repetat</h4>
            </div>
            <div class="badges-list">
              {#each analiza.capitoleRepetare as c}
                <span class="chip">{c}</span>
              {/each}
            </div>
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

  .main-content { position: relative; z-index: 1; max-width: 900px; margin: 0 auto; padding: 48px 32px 64px; display: flex; flex-direction: column; gap: 32px; }

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

  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .full-width { grid-column: 1 / -1; }
  .field { display: flex; flex-direction: column; gap: 8px; }
  .field label { font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  .field input[type="text"],.field input[type="number"],.field textarea {
    padding: 12px 16px; border: 2px solid #e2e8f0; border-radius: 12px;
    font-family: 'DM Sans', sans-serif; font-size: 15px; color: var(--blue-950); background: #f8fafc; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s; resize: vertical;
  }
  .field input:focus,.field textarea:focus { border-color: var(--blue-500); box-shadow: 0 0 0 3px rgba(59,130,246,0.15); background: white; }

  .action-btn { display: inline-flex; align-items: center; gap: 10px; background: var(--blue-600); color: white; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600; padding: 14px 28px; border-radius: 14px; border: none; cursor: pointer; align-self: flex-start; transition: background 0.2s, transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s; }
  .action-btn:hover:not(:disabled) { background: var(--blue-500); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(37,99,235,0.35); }
  .action-btn:disabled { opacity: 0.55; cursor: not-allowed; }

  .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Analiza */
  .analiza-wrapper { display: flex; flex-direction: column; gap: 24px; animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1); }
  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }

  .scor-card { background: rgba(255,255,255,0.95); border-radius: 24px; padding: 28px 32px; box-shadow: 0 4px 24px rgba(10,22,40,0.2); display: flex; align-items: center; gap: 28px; }

  .scor-circle { width: 90px; height: 90px; border-radius: 50%; border: 4px solid; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; flex-shrink: 0; }

  .scor-materie { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: var(--blue-950); margin-bottom: 6px; }
  .scor-mesaj { font-size: 15px; color: #475569; line-height: 1.5; }

  .results-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

  .result-card { background: rgba(255,255,255,0.95); border-radius: 20px; padding: 24px; box-shadow: 0 4px 16px rgba(10,22,40,0.15); display: flex; flex-direction: column; gap: 16px; border-left: 4px solid transparent; }
  .tip-verde  { border-left-color: #22c55e; }
  .tip-rosu   { border-left-color: #ef4444; }
  .tip-albastru { border-left-color: var(--blue-600); }
  .tip-galben { border-left-color: #eab308; }

  .result-header { display: flex; align-items: center; gap: 10px; }
  .result-icon { font-size: 20px; }
  .result-header h4 { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: var(--blue-950); }

  .result-list { list-style: none; display: flex; flex-direction: column; gap: 8px; padding: 0; }
  .result-list li { font-size: 14px; color: #475569; padding-left: 14px; position: relative; line-height: 1.5; }
  .result-list li::before { content: '—'; position: absolute; left: 0; color: #94a3b8; }

  .badges-list { display: flex; flex-wrap: wrap; gap: 8px; }
  .chip { background: #fef9c3; color: #854d0e; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; border: 1px solid #fde047; }

  @media (max-width: 768px) {
    .main-content { padding: 32px 20px 48px; }
    .top-header h2 { font-size: 26px; }
    .form-grid { grid-template-columns: 1fr; }
    .full-width { grid-column: auto; }
    .results-grid { grid-template-columns: 1fr; }
    .scor-card { flex-direction: column; text-align: center; }
  }
</style>