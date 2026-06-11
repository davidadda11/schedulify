<script lang="ts">
  import { onMount } from 'svelte';

  let mounted = $state(false);
  onMount(() => setTimeout(() => { mounted = true; }, 100));

  let materii = $state('');
  let timpZi = $state(2);
  let deadline = $state('');
  let prioritate = $state('echilibrat');
  let loading = $state(false);

  type Activitate = { ora: string; activitate: string; durata: string; tip: 'studiu' | 'pauza' | 'recapitulare' };
  type Zi = { zi: string; data: string; activitati: Activitate[] };
  let program = $state<Zi[]>([]);

  function genereazaProgram() {
    if (!materii.trim() || !deadline) return;
    loading = true;
    program = [];

    setTimeout(() => {
      const materiiList = materii.split(',').map(m => m.trim()).filter(Boolean);
      const zile = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică'];
      const azi = new Date();

      const rezultat: Zi[] = [];

      for (let i = 0; i < 5; i++) {
        const data = new Date(azi);
        data.setDate(azi.getDate() + i);
        const materie = materiiList[i % materiiList.length];

        const activitati: Activitate[] = [];
        let ora = 16;

        activitati.push({ ora: `${ora}:00`, activitate: `Recapitulare rapidă — ${materie}`, durata: '15 min', tip: 'recapitulare' });
        ora += 0;

        activitati.push({ ora: `${ora}:15`, activitate: `Studiu intensiv — ${materie}`, durata: `${Math.round(timpZi * 0.6 * 60)} min`, tip: 'studiu' });

        activitati.push({ ora: `${Math.floor(ora + timpZi * 0.6)}:${(0.6 * timpZi % 1 * 60).toFixed(0).padStart(2,'0')}`, activitate: 'Pauză activă', durata: '10 min', tip: 'pauza' });

        const materie2 = materiiList[(i + 1) % materiiList.length];
        if (prioritate === 'intensiv') {
          activitati.push({ ora: `${ora + 1}:30`, activitate: `Exerciții practice — ${materie}`, durata: `${Math.round(timpZi * 0.4 * 60)} min`, tip: 'studiu' });
        } else {
          activitati.push({ ora: `${ora + 1}:30`, activitate: `Introducere — ${materie2}`, durata: '30 min', tip: 'studiu' });
        }

        rezultat.push({
          zi: zile[data.getDay() === 0 ? 6 : data.getDay() - 1],
          data: data.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long' }),
          activitati,
        });
      }

      program = rezultat;
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
      <h2>Creare program</h2>
      <p>Construiește un program de învățare organizat pe zile și materii.</p>
    </header>

    <div class="bento-card">
      <div class="card-header">
        <h3>Configurează programul</h3>
        <span class="badge">Planificare automată</span>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="field full-width">
            <label for="materii">Materii (separate prin virgulă)</label>
            <input id="materii" type="text" placeholder="ex: Matematică, Fizică, Chimie, Biologie" bind:value={materii} />
          </div>
          <div class="field">
            <label for="timp">Timp disponibil pe zi: <strong>{timpZi}h</strong></label>
            <input id="timp" type="range" min="1" max="6" step="0.5" bind:value={timpZi} />
          </div>
          <div class="field">
            <label for="deadline">Data testului / deadline</label>
            <input id="deadline" type="date" bind:value={deadline} />
          </div>
          <div class="field">
            <label for="prioritate">Stil de învățare</label>
            <select id="prioritate" bind:value={prioritate}>
              <option value="echilibrat">Echilibrat (mai multe materii/zi)</option>
              <option value="intensiv">Intensiv (focus pe o materie)</option>
              <option value="relaxat">Relaxat (pauze frecvente)</option>
            </select>
          </div>
        </div>

        <button class="action-btn" onclick={genereazaProgram} disabled={!materii.trim() || !deadline || loading}>
          {#if loading}
            <span class="spinner"></span> Se generează…
          {:else}
            📅 Generează program
          {/if}
        </button>
      </div>
    </div>

    {#if program.length > 0}
      <div class="results-section">
        <div class="results-header">
          <h3 class="results-title">Programul tău de studiu</h3>
          <span class="badge">{program.length} zile</span>
        </div>
        <div class="program-grid">
          {#each program as zi, i}
            <div class="zi-card" style="animation-delay: {i * 0.08}s">
              <div class="zi-header">
                <div class="zi-name">{zi.zi}</div>
                <div class="zi-data">{zi.data}</div>
              </div>
              <div class="activitati">
                {#each zi.activitati as act}
                  <div class="activitate tip-{act.tip}">
                    <span class="act-ora">{act.ora}</span>
                    <div class="act-info">
                      <span class="act-nume">{act.activitate}</span>
                      <span class="act-durata">{act.durata}</span>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/each}
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

  .grid-overlay {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image: linear-gradient(rgba(96,165,250,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(96,165,250,0.04) 1px,transparent 1px);
    background-size: 60px 60px;
  }

  .main-content { position: relative; z-index: 1; max-width: 960px; margin: 0 auto; padding: 48px 32px 64px; display: flex; flex-direction: column; gap: 32px; }

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
  .field input[type="text"],.field input[type="date"],.field select {
    padding: 12px 16px; border: 2px solid #e2e8f0; border-radius: 12px;
    font-family: 'DM Sans', sans-serif; font-size: 15px; color: var(--blue-950); background: #f8fafc; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .field input:focus,.field select:focus { border-color: var(--blue-500); box-shadow: 0 0 0 3px rgba(59,130,246,0.15); background: white; }
  .field input[type="range"] { accent-color: var(--blue-600); cursor: pointer; }

  .action-btn {
    display: inline-flex; align-items: center; gap: 10px;
    background: var(--blue-600); color: white;
    font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600;
    padding: 14px 28px; border-radius: 14px; border: none; cursor: pointer; align-self: flex-start;
    transition: background 0.2s, transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s;
  }
  .action-btn:hover:not(:disabled) { background: var(--blue-500); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(37,99,235,0.35); }
  .action-btn:disabled { opacity: 0.55; cursor: not-allowed; }

  .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .results-section { display: flex; flex-direction: column; gap: 20px; }
  .results-header { display: flex; align-items: center; gap: 12px; }
  .results-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; color: white; }

  .program-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }

  .zi-card {
    background: rgba(255,255,255,0.95); border-radius: 20px; overflow: hidden;
    box-shadow: 0 4px 20px rgba(10,22,40,0.2), 0 0 0 1px rgba(37,99,235,0.07);
    animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both;
  }
  @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

  .zi-header { background: var(--blue-600); padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }
  .zi-name { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: white; }
  .zi-data { font-size: 13px; color: rgba(255,255,255,0.75); }

  .activitati { padding: 16px; display: flex; flex-direction: column; gap: 10px; }

  .activitate {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 14px; border-radius: 12px;
    border-left: 3px solid transparent;
  }
  .tip-studiu    { background: #eff6ff; border-left-color: var(--blue-600); }
  .tip-pauza     { background: #f0fdf4; border-left-color: #22c55e; }
  .tip-recapitulare { background: #fefce8; border-left-color: #eab308; }

  .act-ora { font-size: 12px; font-weight: 700; color: #94a3b8; min-width: 44px; }
  .act-info { display: flex; flex-direction: column; gap: 2px; }
  .act-nume { font-size: 14px; font-weight: 600; color: #1e293b; }
  .act-durata { font-size: 12px; color: #94a3b8; }

  @media (max-width: 768px) {
    .main-content { padding: 32px 20px 48px; }
    .top-header h2 { font-size: 26px; }
    .form-grid { grid-template-columns: 1fr; }
    .full-width { grid-column: auto; }
  }
</style>