<script lang="ts">
  import { onMount } from 'svelte';

  let mounted = $state(false);

  // Form state
  let materie = $state('');
  let lectie = $state('');
  let dificultate = $state('mediu');
  let numarIntrebari = $state(5);
  let loading = $state(false);
  let intrebari = $state<string[]>([]);

  onMount(() => setTimeout(() => { mounted = true; }, 100));

  const mockIntrebari: Record<string, string[]> = {
    matematica: [
      'Care este formula pentru aria unui cerc?',
      'Rezolvați ecuația: 2x + 5 = 13.',
      'Ce este un număr prim? Dați 3 exemple.',
      'Calculați 25% din 240.',
      'Care este valoarea lui x dacă 3x - 7 = 14?',
      'Ce este teorema lui Pitagora?',
      'Simplificați fracția 36/48.',
      'Calculați perimetrul unui dreptunghi cu L=8 și l=5.',
    ],
    fizica: [
      'Care este formula vitezei medii?',
      'Ce este inerția unui corp?',
      'Enunțați primul principiu al mecanicii newtoniene.',
      'Care este unitatea de măsură a forței în SI?',
      'Ce este energia cinetică? Scrieți formula.',
      'Explicați fenomenul de dilatare termică.',
      'Ce este presiunea? Cum se calculează?',
      'Care este viteza luminii în vid?',
    ],
    chimie: [
      'Ce este un atom? Dar o moleculă?',
      'Care sunt componentele unui atom?',
      'Ce este valența unui element chimic?',
      'Scrieți formula apei și explicați legăturile chimice.',
      'Ce este un ion? Dați exemple de cationi și anioni.',
      'Explicați reacția de ardere a carbonului.',
      'Ce este tabelul periodic al elementelor?',
      'Ce este un acid? Dați 3 exemple.',
    ],
    default: [
      'Care sunt conceptele principale ale acestei lecții?',
      'Explicați cu cuvintele voastre principalele idei.',
      'Care sunt cauzele și efectele fenomenului studiat?',
      'Dați un exemplu concret din viața reală.',
      'Ce legătură există între această lecție și cele anterioare?',
      'Care sunt termenii-cheie pe care trebuie să îi cunoașteți?',
      'Descrieți procesul/fenomenul pas cu pas.',
      'Ce întrebări v-ar putea pune profesorul la test?',
    ],
  };

  function genereaza() {
    if (!materie.trim() || !lectie.trim()) return;
    loading = true;
    intrebari = [];

    setTimeout(() => {
      const key = materie.toLowerCase().trim();
      const pool = mockIntrebari[key] ?? mockIntrebari.default;
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      intrebari = shuffled.slice(0, Math.min(numarIntrebari, pool.length));
      loading = false;
    }, 1200);
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
      <h2>Întrebări pregătitoare</h2>
      <p>Generează întrebări personalizate pentru lecțiile și testele tale.</p>
    </header>

    <!-- Form Card -->
    <div class="bento-card form-card">
      <div class="card-header">
        <h3>Configurează întrebările</h3>
        <span class="badge">Generare automată</span>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="field">
            <label for="materie">Materie</label>
            <input id="materie" type="text" placeholder="ex: Matematică, Fizică, Chimie…" bind:value={materie} />
          </div>
          <div class="field">
            <label for="lectie">Lecție / Subiect</label>
            <input id="lectie" type="text" placeholder="ex: Ecuații de gradul I, Mecanică…" bind:value={lectie} />
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

    <!-- Results -->
    {#if intrebari.length > 0}
      <div class="results-section">
        <div class="results-header">
          <h3 class="results-title">Întrebări generate</h3>
          <span class="badge">{intrebari.length} întrebări</span>
        </div>
        <div class="questions-grid">
          {#each intrebari as intrebare, i}
            <div class="question-card">
              <span class="q-number">{i + 1}</span>
              <p class="q-text">{intrebare}</p>
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
    --blue-950: #0a1628;
    --blue-900: #0f2347;
    --blue-600: #2563eb;
    --blue-500: #3b82f6;
    --blue-400: #60a5fa;
    --blue-200: #bfdbfe;

    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
    width: 100vw;
    background: var(--blue-950);
    position: relative;
    overflow-x: hidden;
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1);
  }
  .page.mounted { opacity: 1; transform: translateY(0); }

  .bg-blob { position: fixed; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0; }
  .blob-1 { width: 600px; height: 600px; background: radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 70%); top: -100px; left: -100px; animation: blobFloat 9s ease-in-out infinite; }
  .blob-2 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(96,165,250,0.15) 0%, transparent 70%); bottom: -100px; right: 10%; animation: blobFloat 12s ease-in-out infinite reverse; }
  .blob-3 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%); top: 40%; left: 40%; animation: blobFloat 7s ease-in-out infinite 3s; }

  @keyframes blobFloat {
    0%, 100% { transform: translate(0,0) scale(1); }
    33%       { transform: translate(30px,-20px) scale(1.05); }
    66%       { transform: translate(-15px,15px) scale(0.97); }
  }

  .grid-overlay {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image: linear-gradient(rgba(96,165,250,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.04) 1px, transparent 1px);
    background-size: 60px 60px;
  }

  .main-content {
    position: relative; z-index: 1;
    max-width: 860px; margin: 0 auto;
    padding: 48px 32px 64px;
    display: flex; flex-direction: column; gap: 32px;
  }

  .top-header { color: white; display: flex; flex-direction: column; gap: 8px; }
  .back-link { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 500; color: var(--blue-400); text-decoration: none; margin-bottom: 8px; transition: color 0.2s; width: fit-content; }
  .back-link:hover { color: white; }
  .top-header h2 { font-family: 'Syne', sans-serif; font-size: 36px; font-weight: 800; letter-spacing: -0.5px; }
  .top-header p { color: var(--blue-200); font-size: 16px; }

  .bento-card {
    background: rgba(255,255,255,0.95);
    border-radius: 24px; padding: 32px;
    box-shadow: 0 4px 24px rgba(10,22,40,0.25), 0 0 0 1px rgba(37,99,235,0.08);
    display: flex; flex-direction: column; gap: 20px;
  }

  .card-header { display: flex; justify-content: space-between; align-items: center; }
  .card-header h3 { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: var(--blue-950); }

  .badge { background: #dbeafe; color: var(--blue-600); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }

  .card-body { display: flex; flex-direction: column; gap: 20px; }

  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

  .field { display: flex; flex-direction: column; gap: 8px; }
  .field label { font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  .field input[type="text"],
  .field select {
    padding: 12px 16px; border: 2px solid #e2e8f0; border-radius: 12px;
    font-family: 'DM Sans', sans-serif; font-size: 15px; color: var(--blue-950);
    background: #f8fafc; outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .field input[type="text"]:focus,
  .field select:focus { border-color: var(--blue-500); box-shadow: 0 0 0 3px rgba(59,130,246,0.15); background: white; }

  .field input[type="range"] { accent-color: var(--blue-600); width: 100%; cursor: pointer; }

  .action-btn {
    display: inline-flex; align-items: center; gap: 10px;
    background: var(--blue-600); color: white;
    font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600;
    padding: 14px 28px; border-radius: 14px; border: none; cursor: pointer;
    transition: background 0.2s, transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s;
    align-self: flex-start;
  }
  .action-btn:hover:not(:disabled) { background: var(--blue-500); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(37,99,235,0.35); }
  .action-btn:disabled { opacity: 0.55; cursor: not-allowed; }

  .spinner {
    width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white; border-radius: 50%;
    animation: spin 0.7s linear infinite; display: inline-block;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .results-section { display: flex; flex-direction: column; gap: 20px; }
  .results-header { display: flex; align-items: center; gap: 12px; }
  .results-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; color: white; }

  .questions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  .question-card {
    background: rgba(255,255,255,0.95); border-radius: 18px; padding: 20px 24px;
    box-shadow: 0 4px 16px rgba(10,22,40,0.2), 0 0 0 1px rgba(37,99,235,0.07);
    display: flex; align-items: flex-start; gap: 16px;
    animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both;
  }
  .question-card:nth-child(1) { animation-delay: 0.05s; }
  .question-card:nth-child(2) { animation-delay: 0.1s; }
  .question-card:nth-child(3) { animation-delay: 0.15s; }
  .question-card:nth-child(4) { animation-delay: 0.2s; }
  .question-card:nth-child(5) { animation-delay: 0.25s; }
  .question-card:nth-child(6) { animation-delay: 0.3s; }
  .question-card:nth-child(7) { animation-delay: 0.35s; }
  .question-card:nth-child(8) { animation-delay: 0.4s; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .q-number {
    min-width: 32px; height: 32px; border-radius: 10px;
    background: var(--blue-600); color: white;
    font-size: 13px; font-weight: 700;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }

  .q-text { font-size: 15px; color: #334155; line-height: 1.55; }

  @media (max-width: 768px) {
    .main-content { padding: 32px 20px 48px; }
    .top-header h2 { font-size: 26px; }
    .form-grid { grid-template-columns: 1fr; }
    .questions-grid { grid-template-columns: 1fr; }
  }
</style>