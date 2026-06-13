<script lang="ts">
  import { onMount } from 'svelte';

  // 💥 SVELTE 5: Prindem datele reale venite din +layout.server.ts sau +page.server.ts
  let { data } = $props();

  let mounted = $state(false);

  // --- CONFIGURĂRI MINI CALENDAR ---
  const MONTH_NAMES = [
    'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
    'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
  ];
  const DAY_NAMES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const MATERII_DISPONIBILE = ['Matematică', 'Fizică', 'Informatică', 'Română', 'Engleză', 'Istorie', 'Geografie', 'Chimie', 'Biologie', 'Pauză Mare', 'Liber'];

  const today = new Date();
  let currentMonth = $state(today.getMonth());
  let currentYear = $state(today.getFullYear());
  let selectedDay = $state(today.getDate());

  let showOrarSelector = $state(false);

  // Funcție ajutătoare pentru a potrivi cheia de căutare cu formatul salvat de tine în DB
  function dateKey(year: number, month: number, day: number) {
    // Modifică aici dacă în DB salvezi altfel (ex: "2025-09-01" cu zero în față sau simplu "2025-9-1")
    return `${year}-${month}-${day}`;
  }

  // 🔗 1. LEGARE ORAR REAL
  // Căutăm în datele globale din layout după cheia zilei selectate
  let oreleZileiCurente = $derived(data.orare?.[dateKey(currentYear, currentMonth, selectedDay)] ?? ['Nicio oră configurată']);

  // 🔗 2. LEGARE TEME ȘI TESTE REALE DIN CALENDAR
  // Filtrăm evenimentele din ziua selectată în funcție de tipul lor
  let evenimenteZilei = $derived(data.evenimente?.[dateKey(currentYear, currentMonth, selectedDay)] ?? []);
  let temeZilei = $derived(evenimenteZilei.filter((e: any) => e.type === 'tema' || e.type === 'teme'));
  let testeZilei = $derived(evenimenteZilei.filter((e: any) => e.type === 'test' || e.type === 'teste'));

  // Generare dinamică a lunii pentru mini-calendar
  let cells = $derived((() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const first = firstDayIndex === 0 ? 6 : firstDayIndex - 1; 
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const arr: (number | null)[] = Array(first).fill(null);
    for (let i = 1; i <= totalDays; i++) arr.push(i);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  })());

  // 🔗 3. SALVARE RAPIDĂ PRIN API-UL TĂU EXISTENT
  // Văd în screenshot că ai deja rute de API precum /api/program sau /api/schedule
  async function toggleMaterie(materie: string) {
    const cheie = dateKey(currentYear, currentMonth, selectedDay);
    let curente = data.orare?.[cheie] ? [...data.orare[cheie]] : [];
    
    if (curente.includes(materie)) {
      curente = curente.filter(m => m !== materie);
    } else {
      if (curente.length === 1 && curente[0] === 'Nicio oră configurată') curente = [];
      curente.push(materie);
    }

    // Aici facem apel direct la endpoint-ul tău de API ca să salvăm modificarea în DB
    try {
      await fetch('/api/program', { // sau '/api/schedule' depinde cum l-ai denumit
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: cheie, program: curente })
      });
      
      // Opțional: Forțează SvelteKit să re-execute funcțiile de load server ca să aducă datele proaspete
      // import { invalidateAll } from '$app/navigation';
      // invalidateAll();
    } catch (err) {
      console.error("Eroare la salvarea orarului:", err);
    }
  }

  onMount(() => {
    setTimeout(() => { mounted = true; }, 100);
  });
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap" rel="stylesheet" />
</svelte:head>

<div class="page" class:mounted>
  <div class="bg-blob blob-1"></div>
  <div class="bg-blob blob-2"></div>
  <div class="bg-blob blob-3"></div>
  <div class="grid-overlay"></div>

  <div class="dashboard-container">
    <main class="main-content">
      <header class="top-header">
        <h2>Salut! Săptămâna ta arată excelent.</h2>
        <p>Vizualizezi datele pentru: <strong>{selectedDay} {MONTH_NAMES[currentMonth]} {currentYear}</strong></p>
      </header>

      <div class="bento-grid">
        
        <div class="bento-card tall-card">
          <div class="card-header">
            <h3>Task-uri viitoare</h3>
            <span class="badge">{temeZilei.length + testeZilei.length} active</span>
          </div>
          <div class="card-body">
            {#if evenimenteZilei.length === 0}
              <p class="placeholder-text">Nu ai task-uri pentru această zi.</p>
            {:else}
              {#each evenimenteZilei as ev}
                <label class="task-item">
                  <input type="checkbox" /> 
                  <span class={ev.type}>{ev.type.toUpperCase()}:</span> {ev.text || ev.title}
                </label>
              {/each}
            {/if}
          </div>
        </div>

        <div class="bento-card wide-card">
          <div class="card-header">
            <h3>Orarul din {selectedDay} {MONTH_NAMES[currentMonth].slice(0, 3)}</h3>
            <button class="badge btn-interactiv" onclick={() => showOrarSelector = !showOrarSelector}>
              {showOrarSelector ? 'Închide' : '✏️ Editează rapid'}
            </button>
          </div>
          
          <div class="card-body">
            {#if showOrarSelector}
              <div class="selector-orar">
                <p style="font-size: 13px; margin-bottom: 8px; color: #64748b;">Configurează direct în baza de date:</p>
                <div class="materii-chips">
                  {#each MATERII_DISPONIBILE as mat}
                    <button 
                      class="chip-btn" 
                      class:selectat={oreleZileiCurente.includes(mat)} 
                      onclick={() => toggleMaterie(mat)}
                    >
                      {mat}
                    </button>
                  {/each}
                </div>
              </div>
            {:else}
              <div class="timeline-flex">
                {#each oreleZileiCurente as subject, index}
                  <div class="timeline-item" class:active={index === 0 && subject !== 'Nicio oră configurată'}>
                    <span class="time">Ora {index + 1}</span>
                    <div class="subject">{subject}</div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>

        <div class="bento-card">
          <div class="card-header">
            <h3>Teme din această zi</h3>
          </div>
          <div class="card-body">
            {#if temeZilei.length === 0}
              <p class="placeholder-text">Fără teme salvate</p>
            {:else}
              {#each temeZilei as tema}
                <p class="placeholder-text">{tema.text || tema.title}</p>
              {/each}
            {/if}
          </div>
        </div>

        <div class="bento-card">
          <div class="card-header">
            <h3>Teste din această zi</h3>
          </div>
          <div class="card-body">
            {#if testeZilei.length === 0}
              <p class="placeholder-text">Niciun test anunțat</p>
            {:else}
              {#each testeZilei as test}
                <p class="placeholder-text highlight">{test.text || test.title}</p>
              {/each}
            {/if}
          </div>
        </div>

        <div class="bento-card wide-card">
          <div class="card-header">
            <h3>{MONTH_NAMES[currentMonth]} {currentYear}</h3>
            <div style="display: flex; gap: 8px;">
              <button class="nav-mini" onclick={() => { if (currentMonth === 0) { currentMonth = 11; currentYear--; } else currentMonth--; }}>‹</button>
              <button class="nav-mini" onclick={() => { if (currentMonth === 11) { currentMonth = 0; currentYear++; } else currentMonth++; }}>›</button>
            </div>
          </div>
          <div class="card-body calendar-grid">
            {#each DAY_NAMES as day}
              <div class="cal-day-header">{day}</div>
            {/each}
            {#each cells as day}
              {#if day === null}
                <div class="cal-day empty"></div>
              {:else}
                <button 
                  class="cal-day" 
                  class:active={selectedDay === day} 
                  class:is-today={day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()}
                  onclick={() => { selectedDay = day; showOrarSelector = false; }}
                >
                  {day}
                </button>
              {/if}
            {/each}
          </div>
        </div>

      </div>
    </main>
  </div>
</div>

<style>
  :global(*, *::before, *::after) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(body) { overflow-x: hidden; background: #0a1628; }
  .page { --blue-950: #0a1628; --blue-600: #2563eb; --blue-200: #bfdbfe; font-family: 'DM Sans', sans-serif; min-height: 100vh; width: 100%; background: var(--blue-950); position: relative; overflow-y: auto; }
  .bg-blob { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0; }
  .blob-1 { width: 600px; height: 600px; background: radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 70%); top: -100px; left: -100px; animation: blobFloat 9s ease-in-out infinite; }
  .blob-2 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(96,165,250,0.15) 0%, transparent 70%); bottom: -100px; right: 10%; animation: blobFloat 12s ease-in-out infinite reverse; }
  .blob-3 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%); top: 40%; left: 40%; animation: blobFloat 7s ease-in-out infinite 3s; }
  .grid-overlay { position: absolute; inset: 0; background-image: linear-gradient(rgba(96,165,250,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.04) 1px, transparent 1px); background-size: 60px 60px; pointer-events: none; z-index: 0; }
  @keyframes blobFloat { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(30px, -20px) scale(1.05); } 66% { transform: translate(-15px, 15px) scale(0.97); } }
  .dashboard-container { position: relative; z-index: 1; width: 100%; max-width: 1200px; margin: 0 auto; padding: 24px; opacity: 0; transform: translateY(20px); transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
  .page.mounted .dashboard-container { opacity: 1; transform: translateY(0); }
  .main-content { display: flex; flex-direction: column; gap: 24px; width: 100%; }
  .top-header { color: white; }
  .top-header h2 { font-family: 'Syne', sans-serif; font-size: 32px; margin-bottom: 4px; letter-spacing: -0.02em; }
  .top-header p { color: var(--blue-200); font-size: 16px; }
  .bento-grid { display: grid; grid-template-columns: 320px 1fr 1fr; grid-auto-rows: minmax(180px, auto); gap: 24px; width: 100%; padding-bottom: 24px; }
  .bento-card { background: rgba(255, 255, 255, 0.95); border-radius: 24px; padding: 24px; box-shadow: 0 4px 24px rgba(10, 22, 40, 0.2); display: flex; flex-direction: column; transition: transform 0.3s ease; }
  .bento-card:hover { transform: translateY(-4px); }
  .tall-card { grid-row: span 3; }
  .wide-card { grid-column: span 2; }
  .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .card-header h3 { font-family: 'Syne', sans-serif; font-size: 18px; color: #0a1628; }
  .badge { background: #dbeafe; color: var(--blue-600); padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; }
  .btn-interactiv { border: none; cursor: pointer; transition: background 0.2s; }
  .btn-interactiv:hover { background: #bfdbfe; }
  .card-body { flex: 1; display: flex; flex-direction: column; gap: 12px; }
  .task-item { display: flex; align-items: center; gap: 12px; font-size: 15px; color: #475569; padding: 12px; background: #f8fafc; border-radius: 12px; cursor: pointer; }
  .task-item input { width: 18px; height: 18px; accent-color: var(--blue-600); }
  .task-item span.tema { color: #2563eb; font-weight: bold; font-size: 12px; }
  .task-item span.test { color: #ef4444; font-weight: bold; font-size: 12px; }
  .timeline-flex { display: flex; flex-direction: row; gap: 12px; align-items: center; flex-wrap: wrap; }
  .timeline-item { text-align: center; background: #f8fafc; padding: 14px; border-radius: 16px; flex: 1; min-width: 100px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
  .timeline-item.active { background: var(--blue-600); color: white; }
  .timeline-item .time { display: block; font-size: 11px; opacity: 0.8; margin-bottom: 4px; font-weight: 600; }
  .timeline-item .subject { font-weight: 700; font-size: 14px; }
  .selector-orar { background: #f8fafc; padding: 16px; border-radius: 16px; width: 100%; }
  .materii-chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .chip-btn { padding: 6px 12px; border-radius: 20px; border: 1px solid #cbd5e1; background: white; font-size: 13px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.2s; }
  .chip-btn.selectat { background: var(--blue-600); color: white; border-color: var(--blue-600); }
  .placeholder-text { font-size: 14px; color: #475569; padding: 12px; border: 2px dashed #cbd5e1; border-radius: 12px; text-align: center; font-weight: 500; }
  .highlight { border-color: #ef4444; color: #ef4444; background: #fef2f2; }
  .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; text-align: center; }
  .cal-day-header { font-size: 11px; font-weight: 700; color: #94a3b8; padding-bottom: 4px; }
  .cal-day { padding: 10px 4px; font-size: 13px; color: #0a1628; border-radius: 10px; cursor: pointer; border: none; background: transparent; font-family: 'DM Sans', sans-serif; font-weight: 500; }
  .cal-day:not(.empty):hover { background: #eff6ff; color: var(--blue-600); }
  .cal-day.active { background: var(--blue-600) !important; color: white !important; font-weight: bold; }
  .cal-day.is-today { background: #dbeafe; color: var(--blue-600); font-weight: 700; }
  .cal-day.empty { pointer-events: none; }
  .nav-mini { background: #f1f5f9; border: none; width: 28px; height: 28px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold; color: #475569; }
  .nav-mini:hover { background: #e2e8f0; }
  @media (max-width: 1024px) { .bento-grid { grid-template-columns: 1fr; } .tall-card, .wide-card { grid-column: auto; grid-row: auto; } .timeline-flex { flex-direction: column; align-items: stretch; } }
</style>