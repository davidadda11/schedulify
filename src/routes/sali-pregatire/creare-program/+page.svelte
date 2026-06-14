<script lang="ts">
  import { onMount } from 'svelte';

  let mounted = $state(false);
  onMount(() => setTimeout(() => { mounted = true; }, 100));

  let materii = $state('');
  let timpZi = $state(2);
  let deadline = $state('');
  let prioritate = $state('echilibrat');
  let loading = $state(false);
  let ziSelectata = $state<number | null>(null);

  type Activitate = { ora: string; activitate: string; durata: string; tip: 'studiu' | 'pauza' | 'recapitulare'; bifat?: boolean };
  type Zi = { zi: string; data: string; activitati: Activitate[]; dateObj?: Date };
  let program = $state<Zi[]>([]);

  let lunaAfisata = $state(new Date());

  function progresZi(zi: Zi): number {
    if (!zi.activitati.length) return 0;
    return Math.round((zi.activitati.filter(a => a.bifat).length / zi.activitati.length) * 100);
  }

  function progresTotal(): number {
    const total = program.reduce((s, z) => s + z.activitati.length, 0);
    const bifate = program.reduce((s, z) => s + z.activitati.filter(a => a.bifat).length, 0);
    return total ? Math.round((bifate / total) * 100) : 0;
  }

  function toggleActivitate(ziIdx: number, actIdx: number) {
    program[ziIdx].activitati[actIdx].bifat = !program[ziIdx].activitati[actIdx].bifat;
    program = [...program];
  }

  function getZileLuna(data: Date): (Date | null)[] {
    const an = data.getFullYear();
    const luna = data.getMonth();
    const primaZi = new Date(an, luna, 1);
    const ultimaZi = new Date(an, luna + 1, 0);
    const ziStart = (primaZi.getDay() + 6) % 7;
    const zile: (Date | null)[] = [];
    for (let i = 0; i < ziStart; i++) zile.push(null);
    for (let i = 1; i <= ultimaZi.getDate(); i++) zile.push(new Date(an, luna, i));
    return zile;
  }

  function getActivitatiPentruZi(data: Date): { ziIdx: number; zi: Zi } | null {
    const idx = program.findIndex(z => {
      if (!z.dateObj) return false;
      return z.dateObj.toDateString() === data.toDateString();
    });
    return idx >= 0 ? { ziIdx: idx, zi: program[idx] } : null;
  }

  function clickZi(data: Date) {
    const act = getActivitatiPentruZi(data);
    if (!act) return;
    ziSelectata = ziSelectata === act.ziIdx ? null : act.ziIdx;
  }

  function lunaStr(data: Date): string {
    return data.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
  }

  function schimbaLuna(dir: number) {
    lunaAfisata = new Date(lunaAfisata.getFullYear(), lunaAfisata.getMonth() + dir, 1);
  }

  function parseDataOllama(dataStr: string, index: number): Date {
    // încearcă să parseze "13 iunie", "2026-06-13", etc.
    const luni: Record<string, number> = {
      ianuarie: 0, februarie: 1, martie: 2, aprilie: 3, mai: 4, iunie: 5,
      iulie: 6, august: 7, septembrie: 8, octombrie: 9, noiembrie: 10, decembrie: 11
    };
    const parts = dataStr.toLowerCase().split(' ');
    if (parts.length >= 2) {
      const zi = parseInt(parts[0]);
      const luna = luni[parts[1]];
      if (!isNaN(zi) && luna !== undefined) {
        return new Date(new Date().getFullYear(), luna, zi);
      }
    }
    // fallback: azi + index
    const d = new Date();
    d.setDate(d.getDate() + index);
    return d;
  }

  async function genereazaProgram() {
    if (!materii.trim() || !deadline) return;
    loading = true;
    program = [];
    ziSelectata = null;

    try {
      const res = await fetch('/api/program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materii, timpZi, deadline, prioritate })
      });
      const data = await res.json();
      program = (data.program ?? []).map((z: Zi, i: number) => ({
        ...z,
        dateObj: parseDataOllama(z.data, i),
        activitati: z.activitati.map((a: Activitate) => ({ ...a, bifat: false }))
      }));
      // setează luna la prima zi din program
      if (program.length > 0 && program[0].dateObj) {
        lunaAfisata = new Date(program[0].dateObj.getFullYear(), program[0].dateObj.getMonth(), 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      loading = false;
    }
  }

  const ZILE_HEADER = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'];
  const TIP_CULORI: Record<string, string> = {
    studiu: '#2563eb',
    pauza: '#22c55e',
    recapitulare: '#eab308'
  };
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

        <div class="progres-general">
          <div class="progres-label">
            <span>Progres general</span>
            <strong>{progresTotal()}%</strong>
          </div>
          <div class="progres-bar">
            <div class="progres-fill" style="width: {progresTotal()}%"></div>
          </div>
        </div>

        <!-- Calendar -->
        <div class="calendar-wrap">
          <div class="cal-nav">
            <button class="cal-nav-btn" onclick={() => schimbaLuna(-1)}>‹</button>
            <span class="cal-luna-titlu">{lunaStr(lunaAfisata)}</span>
            <button class="cal-nav-btn" onclick={() => schimbaLuna(1)}>›</button>
          </div>

          <div class="cal-grid">
            {#each ZILE_HEADER as h}
              <div class="cal-header-zi">{h}</div>
            {/each}

            {#each getZileLuna(lunaAfisata) as data}
              {#if data === null}
                <div class="cal-zi-empty"></div>
              {:else}
                {@const act = getActivitatiPentruZi(data)}
                {@const azi = new Date()}
                {@const eAzi = data.toDateString() === azi.toDateString()}
                {@const eSelectata = act && ziSelectata === act.ziIdx}
                <div
                  class="cal-zi"
                  class:are-activitati={!!act}
                  class:azi={eAzi}
                  class:selectata={eSelectata}
                  class:completata={act && progresZi(act.zi) === 100}
                  onclick={() => clickZi(data)}
                >
                  <span class="cal-nr">{data.getDate()}</span>
                  {#if act}
                    <div class="cal-pills">
                      {#each act.zi.activitati.slice(0, 2) as a}
                        <span class="cal-pill" style="background: {TIP_CULORI[a.tip]}20; color: {TIP_CULORI[a.tip]}; border: 1px solid {TIP_CULORI[a.tip]}40">
                          {a.activitate.length > 12 ? a.activitate.slice(0, 12) + '…' : a.activitate}
                        </span>
                      {/each}
                      {#if act.zi.activitati.length > 2}
                        <span class="cal-pill-more">+{act.zi.activitati.length - 2}</span>
                      {/if}
                    </div>
                  {/if}
                </div>
              {/if}
            {/each}
          </div>

          <!-- Expand panel -->
          {#if ziSelectata !== null}
            {@const zi = program[ziSelectata]}
            <div class="expand-panel">
              <div class="expand-header">
                <div>
                  <div class="expand-zi">{zi.zi} — {zi.data}</div>
                  <div class="expand-progres-text">{zi.activitati.filter(a => a.bifat).length}/{zi.activitati.length} completate</div>
                </div>
                <div class="expand-progres-bar">
                  <div class="expand-progres-fill" style="width: {progresZi(zi)}%"></div>
                </div>
              </div>
              <div class="expand-activitati">
                {#each zi.activitati as act, actIdx}
                  <button
                    class="exp-act tip-{act.tip}"
                    class:bifat={act.bifat}
                    onclick={() => toggleActivitate(ziSelectata!, actIdx)}
                  >
                    <span class="exp-checkbox">{act.bifat ? '✓' : ''}</span>
                    <span class="exp-ora">{act.ora}</span>
                    <div class="exp-info">
                      <span class="exp-nume">{act.activitate}</span>
                      <span class="exp-durata">{act.durata}</span>
                    </div>
                  </button>
                {/each}
              </div>
            </div>
          {/if}
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
  position: relative; overflow: visible;
  opacity: 0;
  transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}
.page.mounted { opacity: 1;}

  .bg-blob { position: fixed; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0; display: none; }
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

  .results-section { display: flex; flex-direction: column; gap: 24px; }
  .results-header { display: flex; align-items: center; gap: 12px; }
  .results-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700; color: white; }

  .progres-general { background: rgba(255,255,255,0.07); border-radius: 16px; padding: 20px 24px; display: flex; flex-direction: column; gap: 10px; }
  .progres-label { display: flex; justify-content: space-between; color: white; font-size: 15px; }
  .progres-label strong { color: var(--blue-400); }
  .progres-bar { height: 8px; background: rgba(255,255,255,0.1); border-radius: 99px; overflow: hidden; }
  .progres-fill { height: 100%; background: var(--blue-500); border-radius: 99px; transition: width 0.4s ease; }

  /* Calendar */
  .calendar-wrap { background: rgba(255,255,255,0.95); border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(10,22,40,0.25); }

  .cal-nav { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 16px; border-bottom: 1px solid #e2e8f0; }
  .cal-luna-titlu { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: var(--blue-950); text-transform: capitalize; }
  .cal-nav-btn { background: none; border: 2px solid #e2e8f0; border-radius: 8px; width: 32px; height: 32px; cursor: pointer; font-size: 18px; color: #64748b; display: flex; align-items: center; justify-content: center; transition: border-color 0.2s, color 0.2s; }
  .cal-nav-btn:hover { border-color: var(--blue-500); color: var(--blue-600); }

  .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); padding: 0 12px 12px; }

  .cal-header-zi { text-align: center; padding: 12px 0 8px; font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }

  .cal-zi-empty { min-height: 90px; }

  .cal-zi {
    min-height: 90px; padding: 8px; border-radius: 10px;
    cursor: default; display: flex; flex-direction: column; gap: 4px;
    transition: background 0.15s;
    margin: 2px;
  }
  .cal-zi.are-activitati { cursor: pointer; }
  .cal-zi.are-activitati:hover { background: #f1f5ff; }
  .cal-zi.azi .cal-nr { background: var(--blue-600); color: white; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; }
  .cal-zi.selectata { background: #eff6ff; outline: 2px solid var(--blue-500); }
  .cal-zi.completata { background: #f0fdf4; }

  .cal-nr { font-size: 13px; font-weight: 600; color: #334155; min-width: 26px; text-align: center; }

  .cal-pills { display: flex; flex-direction: column; gap: 3px; }
  .cal-pill { font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cal-pill-more { font-size: 11px; color: #94a3b8; padding: 0 4px; }

  /* Expand panel */
  .expand-panel { border-top: 2px solid var(--blue-500); background: #f8faff; padding: 24px; animation: fadeUp 0.3s cubic-bezier(0.16,1,0.3,1); }
  @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

  .expand-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 20px; }
  .expand-zi { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; color: var(--blue-950); }
  .expand-progres-text { font-size: 13px; color: #64748b; margin-top: 2px; }
  .expand-progres-bar { flex: 1; max-width: 200px; height: 6px; background: #e2e8f0; border-radius: 99px; overflow: hidden; }
  .expand-progres-fill { height: 100%; background: #22c55e; border-radius: 99px; transition: width 0.3s; }

  .expand-activitati { display: flex; flex-direction: column; gap: 8px; }

  .exp-act {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 16px; border-radius: 12px; border: none; cursor: pointer;
    width: 100%; text-align: left;
    transition: opacity 0.2s, transform 0.1s;
  }
  .exp-act:active { transform: scale(0.99); }
  .exp-act.bifat { opacity: 0.5; }
  .tip-studiu { background: #eff6ff; border-left: 3px solid var(--blue-600); }
  .tip-pauza { background: #f0fdf4; border-left: 3px solid #22c55e; }
  .tip-recapitulare { background: #fefce8; border-left: 3px solid #eab308; }

  .exp-checkbox { min-width: 20px; height: 20px; border-radius: 6px; border: 2px solid #cbd5e1; background: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: #22c55e; flex-shrink: 0; }
  .bifat .exp-checkbox { background: #dcfce7; border-color: #22c55e; }

  .exp-ora { font-size: 12px; font-weight: 700; color: #94a3b8; min-width: 44px; }
  .exp-info { display: flex; flex-direction: column; gap: 2px; }
  .exp-nume { font-size: 14px; font-weight: 600; color: #1e293b; }
  .exp-durata { font-size: 12px; color: #94a3b8; }

  @media (max-width: 768px) {
    .main-content { padding: 32px 20px 48px; }
    .top-header h2 { font-size: 26px; }
    .form-grid { grid-template-columns: 1fr; }
    .full-width { grid-column: auto; }
    .cal-zi { min-height: 60px; }
    .cal-pills { display: none; }
  }
</style>