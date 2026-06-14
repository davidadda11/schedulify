<script lang="ts">
  import { onMount } from 'svelte';

  let mounted = $state(false);
  let materie = $state('');
  let lectie = $state('');
  let dificultate = $state('mediu');
  let numarIntrebari = $state(5);
  let loading = $state(false);

  type Intrebare = { q: string; o: string[]; c: number };
  let intrebari = $state<Intrebare[]>([]);
  let curent = $state(0);
  let selectat = $state(-1);
  let skipFaza = $state(0);
  let terminat = $state(false);
  let scor = $state(0);

  onMount(() => setTimeout(() => { mounted = true; }, 100));

  // Shuffle Fisher-Yates pe opțiuni, actualizează indexul corect
  function shuffleIntrebare(q: Intrebare): Intrebare {
    const indices = [0, 1, 2, 3];
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return {
      q: q.q,
      o: indices.map(i => q.o[i]),
      c: indices.indexOf(q.c)
    };
  }

  async function genereaza() {
    if (!materie.trim() || !lectie.trim()) return;
    loading = true;
    intrebari = [];
    curent = 0;
    selectat = -1;
    skipFaza = 0;
    terminat = false;
    scor = 0;

    try {
      const res = await fetch('/api/intrebari', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materie, lectie, dificultate, numar: numarIntrebari })
      });
      const data = await res.json();
      // Shuffle fiecare întrebare la primire
      intrebari = (data.intrebari ?? []).map(shuffleIntrebare);
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  }

  function alege(oi: number) {
    if (selectat !== -1 || skipFaza === 1) return;
    selectat = oi;
    if (oi === intrebari[curent].c) scor++;
  }

  function urmatoarea() {
    if (curent + 1 >= intrebari.length) {
      terminat = true;
    } else {
      curent++;
      selectat = -1;
      skipFaza = 0;
    }
  }

  function skip() {
    if (skipFaza === 0) {
      skipFaza = 1;
    } else {
      urmatoarea();
    }
  }

  function restart() {
    intrebari = intrebari.map(shuffleIntrebare); // re-shuffle la restart
    curent = 0;
    selectat = -1;
    skipFaza = 0;
    terminat = false;
    scor = 0;
  }

  function culoareOptiune(oi: number): string {
    const corect = intrebari[curent].c;
    if (skipFaza === 1) {
      if (oi === corect) return 'opt-verde';
      return 'opt-default opt-dim';
    }
    if (selectat === -1) return 'opt-default';
    if (oi === corect) return 'opt-verde';
    if (oi === selectat) return 'opt-rosu';
    return 'opt-default opt-dim';
  }

  // Progress bazat pe întrebări completate (curent+1 / total)
  let progressWidth = $derived(
    intrebari.length > 0 ? ((curent + 1) / intrebari.length) * 100 : 0
  );
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
      <h2>Întrebări pregătitoare</h2>
      <p>Generează întrebări personalizate pentru lecțiile și testele tale.</p>
    </header>

    <div class="bento-card form-card">
      <div class="card-header">
        <h3>Configurează întrebările</h3>
        <span class="badge">Generare automată</span>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="field">
            <label for="materie">Materie</label>
            <input id="materie" type="text" placeholder="ex: Matematică, Fizică…" bind:value={materie} />
          </div>
          <div class="field">
            <label for="lectie">Lecție / Subiect</label>
            <input id="lectie" type="text" placeholder="ex: Ecuații de gradul I…" bind:value={lectie} />
          </div>
          <div class="field">
            <label for="dificultate">Nivel de dificultate</label>
            <select id="dificultate" bind:value={dificultate}>
              <option value="usor">Ușor</option>
              <option value="mediu">Mediu</option>
              <option value="greu">Greu</option>
            </select>
          </div>
          <div class="field">
            <label for="numar">Număr de întrebări: <strong>{numarIntrebari}</strong></label>
            <input id="numar" type="range" min="3" max="8" bind:value={numarIntrebari} />
          </div>
        </div>
        <button class="action-btn" onclick={genereaza} disabled={!materie.trim() || !lectie.trim() || loading}>
          {#if loading}
            <span class="spinner"></span> Se generează…
          {:else}
            ✨ Generează întrebări
          {/if}
        </button>
      </div>
    </div>

    {#if terminat}
      <div class="results-final">
        <div class="score-circle">
          <span class="score-num">{scor}</span>
          <span class="score-total">/ {intrebari.length}</span>
        </div>
        <h3 class="score-title">
          {#if scor === intrebari.length}🏆 Perfect!
          {:else if scor >= intrebari.length / 2}👍 Bine făcut!
          {:else}📚 Mai exersează!{/if}
        </h3>
        <p class="score-sub">Ai răspuns corect la {scor} din {intrebari.length} întrebări.</p>
        <div class="final-btns">
          <button class="action-btn" onclick={restart}>🔁 Încearcă din nou</button>
          <button class="action-btn btn-outline" onclick={genereaza}>✨ Întrebări noi</button>
        </div>
      </div>

    {:else if intrebari.length > 0}
      <div class="quiz-section">
        <div class="quiz-header">
          <div class="progress-info">
            <span class="q-counter">{curent + 1} / {intrebari.length}</span>
            <span class="scor-live">✓ {scor} corecte</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: {progressWidth}%"></div>
          </div>
        </div>

        <div class="question-card">
          <div class="q-top">
            <span class="q-number">{curent + 1}</span>
            <p class="q-text">{intrebari[curent].q}</p>
          </div>

          {#if skipFaza === 1}
            <div class="skip-hint">💡 Răspunsul corect este evidențiat mai jos</div>
          {/if}

          <div class="options-grid">
            {#each intrebari[curent].o as optiune, oi}
              <button
                class="opt {culoareOptiune(oi)}"
                onclick={() => alege(oi)}
                disabled={selectat !== -1 || skipFaza === 1}
              >
                <span class="opt-litera">{['A','B','C','D'][oi]}</span>
                <span class="opt-text">{optiune}</span>
              </button>
            {/each}
          </div>

          <div class="nav-btns">
            {#if selectat !== -1 || skipFaza === 1}
              <button class="action-btn" onclick={urmatoarea}>
                {curent + 1 >= intrebari.length ? '🏁 Vezi rezultatul' : 'Următoarea →'}
              </button>
            {:else}
              <button class="skip-btn" onclick={skip}>
                {skipFaza === 0 ? 'Skip' : 'Treci mai departe →'}
              </button>
            {/if}
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
    min-height: auto; width: 100%; background: transparent;
    position: relative; overflow-x: hidden;
    opacity: 0; transform: translateY(16px);
    transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1);
  }
  .page.mounted { opacity: 1; transform: translateY(0); }

  .bg-blob { position: fixed; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0; display: none; }
  .blob-1 { width: 600px; height: 600px; background: radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 70%); top: -100px; left: -100px; animation: blobFloat 9s ease-in-out infinite; }
  .blob-2 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(96,165,250,0.15) 0%, transparent 70%); bottom: -100px; right: 10%; animation: blobFloat 12s ease-in-out infinite reverse; }
  .blob-3 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%); top: 40%; left: 40%; animation: blobFloat 7s ease-in-out infinite 3s; }
  @keyframes blobFloat { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(30px,-20px) scale(1.05)} 66%{transform:translate(-15px,15px) scale(0.97)} }

  .grid-overlay { position: fixed; inset: 0; z-index: 0; pointer-events: none; background-image: linear-gradient(rgba(96,165,250,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(96,165,250,0.04) 1px,transparent 1px); background-size: 60px 60px; display: none; }

  .main-content { position: relative; z-index: 1; max-width: 100%; margin: 0; padding: 24px 24px 48px; display: flex; flex-direction: column; gap: 32px; }

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
  .field { display: flex; flex-direction: column; gap: 8px; }
  .field label { font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  .field input[type="text"], .field select { padding: 12px 16px; border: 2px solid #e2e8f0; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 15px; color: var(--blue-950); background: #f8fafc; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
  .field input[type="text"]:focus, .field select:focus { border-color: var(--blue-500); box-shadow: 0 0 0 3px rgba(59,130,246,0.15); background: white; }
  .field input[type="range"] { accent-color: var(--blue-600); width: 100%; cursor: pointer; }

  .action-btn { display: inline-flex; align-items: center; gap: 10px; background: var(--blue-600); color: white; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600; padding: 14px 28px; border-radius: 14px; border: none; cursor: pointer; transition: background 0.2s, transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s; }
  .action-btn:hover:not(:disabled) { background: var(--blue-500); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(37,99,235,0.35); }
  .action-btn:disabled { opacity: 0.55; cursor: not-allowed; }
  .btn-outline { background: transparent; border: 2px solid var(--blue-400); color: var(--blue-400); }
  .btn-outline:hover:not(:disabled) { background: rgba(96,165,250,0.1); }

  .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .quiz-section { display: flex; flex-direction: column; gap: 16px; }
  .quiz-header { display: flex; flex-direction: column; gap: 10px; }
  .progress-info { display: flex; justify-content: space-between; align-items: center; }
  .q-counter { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: white; }
  .scor-live { font-size: 14px; font-weight: 600; color: #4ade80; }
  .progress-bar { width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 99px; overflow: hidden; }
  .progress-fill { height: 100%; background: linear-gradient(90deg, var(--blue-600), var(--blue-400)); border-radius: 99px; transition: width 0.4s cubic-bezier(0.16,1,0.3,1); }

  .question-card { background: rgba(255,255,255,0.95); border-radius: 24px; padding: 32px; box-shadow: 0 4px 24px rgba(10,22,40,0.2), 0 0 0 1px rgba(37,99,235,0.07); display: flex; flex-direction: column; gap: 20px; animation: fadeUp 0.35s cubic-bezier(0.16,1,0.3,1) both; }
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

  .q-top { display: flex; align-items: flex-start; gap: 14px; }
  .q-number { min-width: 36px; height: 36px; border-radius: 10px; background: var(--blue-600); color: white; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .q-text { font-size: 17px; color: #1e293b; line-height: 1.55; font-weight: 500; padding-top: 6px; }

  .skip-hint { background: #fef9c3; border: 1px solid #fde047; border-radius: 10px; padding: 10px 14px; font-size: 13px; color: #713f12; font-weight: 500; }

  .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .opt { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 12px; border: 2px solid #e2e8f0; background: #f8fafc; cursor: pointer; text-align: left; transition: border-color 0.18s, background 0.18s, transform 0.15s; font-family: 'DM Sans', sans-serif; }
  .opt:hover:not(:disabled) { border-color: var(--blue-400); background: #eff6ff; transform: translateY(-1px); }
  .opt:disabled { cursor: default; }
  .opt-litera { min-width: 28px; height: 28px; border-radius: 8px; background: #e2e8f0; color: #475569; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.18s, color 0.18s; }
  .opt-text { font-size: 14px; color: #334155; line-height: 1.4; }

  .opt-verde { border-color: #22c55e !important; background: #f0fdf4 !important; }
  .opt-verde .opt-litera { background: #22c55e; color: white; }
  .opt-verde .opt-text { color: #166534; font-weight: 600; }
  .opt-rosu { border-color: #ef4444 !important; background: #fef2f2 !important; }
  .opt-rosu .opt-litera { background: #ef4444; color: white; }
  .opt-rosu .opt-text { color: #991b1b; }
  .opt-dim { opacity: 0.35; }

  .nav-btns { display: flex; justify-content: space-between; align-items: center; padding-top: 4px; }
  .skip-btn { background: transparent; border: none; color: #94a3b8; font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer; padding: 8px 4px; transition: color 0.2s; }
  .skip-btn:hover { color: #475569; }

  .results-final { background: rgba(255,255,255,0.95); border-radius: 24px; padding: 48px 32px; display: flex; flex-direction: column; align-items: center; gap: 16px; box-shadow: 0 4px 24px rgba(10,22,40,0.2); text-align: center; animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both; }
  .score-circle { width: 120px; height: 120px; border-radius: 50%; background: linear-gradient(135deg, var(--blue-600), var(--blue-400)); display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 8px 32px rgba(37,99,235,0.4); }
  .score-num { font-family: 'Syne', sans-serif; font-size: 42px; font-weight: 800; color: white; line-height: 1; }
  .score-total { font-size: 14px; color: rgba(255,255,255,0.75); font-weight: 500; }
  .score-title { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; color: #0f172a; }
  .score-sub { color: #64748b; font-size: 15px; }
  .final-btns { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; margin-top: 8px; }

  @media (max-width: 768px) {
    .main-content { padding: 32px 20px 48px; }
    .top-header h2 { font-size: 26px; }
    .form-grid { grid-template-columns: 1fr; }
    .options-grid { grid-template-columns: 1fr; }
    .final-btns { flex-direction: column; align-items: center; }
  }
</style>