<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';

  let { data } = $props();

  let mounted = $state(false);

  const MONTH_NAMES = [
    'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
    'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
  ];
  const DAY_NAMES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  const today = new Date();
  let currentMonth = $state(today.getMonth());
  let currentYear  = $state(today.getFullYear());
  let selectedDay  = $state(today.getDate());

  function loadFromStorage<T>(key: string, fallback: T): T {
    if (!browser) return fallback;
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  let studyByDate = $state<Record<string, any[]>>(data.studyByDate ?? {});
  const todayIso = today.toISOString().slice(0, 10);

  let studyAziReactiv = $derived(studyByDate[todayIso] ?? []);
  let progresAzi = $derived(
    studyAziReactiv.length
      ? Math.round(studyAziReactiv.filter((i: any) => i.bifat).length / studyAziReactiv.length * 100)
      : 0
  );

  // ── Program viitor din localStorage ─────────────────────────
  let programViitor = $state<any[]>([]);

  async function toggleStudyItem(item: any) {
    studyByDate = {
      ...studyByDate,
      [item.date]: (studyByDate[item.date] ?? []).map((i: any) =>
        i.id === item.id ? { ...i, bifat: !i.bifat } : i
      )
    };
    await fetch('/api/program', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, bifat: !item.bifat })
    });
  }

  function dateKey(year: number, month: number, day: number) {
    return `${year}-${month}-${day}`;
  }

  const DAYS_RO = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri'];

  type Entry = {
    id: string;
    subject: string;
    teacher: string;
    room: string;
    color: string;
  };

  let timetable = $state<Record<string, Record<number, Entry | null>>>({});
  let slotTimes = $state<{ start: string; end: string }[]>(
    Array.from({ length: 9 }, (_, i) => ({
      start: `${String(8 + i).padStart(2, '0')}:00`,
      end: `${String(9 + i).padStart(2, '0')}:00`
    }))
  );

  let calendarEvents = $state<Record<string, any[]>>({});

  let oreleZileiCurente = $derived((() => {
    const date = new Date(currentYear, currentMonth, selectedDay);
    const dayOfWeekNum = date.getDay();
    const dayIndex = dayOfWeekNum === 0 ? -1 : dayOfWeekNum - 1;

    if (dayIndex < 0 || dayIndex > 4) {
      return [{ subject: 'Weekend – fără program', time: null, color: null }];
    }

    const dayName = DAYS_RO[dayIndex];
    const daySchedule = timetable[dayName];
    if (!daySchedule) return [{ subject: 'Nicio oră configurată', time: null, color: null }];

    const slots = Object.entries(daySchedule)
      .filter(([_, entry]) => entry !== null)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([slotIdx, entry]) => ({
        subject: (entry as Entry).subject,
        teacher: (entry as Entry).teacher,
        color: (entry as Entry).color,
        time: slotTimes[Number(slotIdx)]?.start ?? null
      }));

    return slots.length > 0 ? slots : [{ subject: 'Nicio oră configurată', time: null, color: null }];
  })());

  let evenimenteZilei = $derived(
    calendarEvents[dateKey(currentYear, currentMonth, selectedDay)] ?? []
  );
  let temeZilei  = $derived(evenimenteZilei.filter((e: any) => e.type === 'tema'));
  let testeZilei = $derived(evenimenteZilei.filter((e: any) => e.type === 'test'));

  let cells = $derived((() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const first = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const arr: (number | null)[] = Array(first).fill(null);
    for (let i = 1; i <= totalDays; i++) arr.push(i);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  })());

  // Număr task-uri viitoare nebifate (maxim 3 zile)
  let nrTaskuriActive = $derived(
    programViitor.slice(0, 3).reduce(
      (s: number, z: any) => s + (z.activitati ?? []).filter((a: any) => !a.bifat && a.tip !== 'pauza').length,
      0
    )
  );

  onMount(() => {
    setTimeout(() => { mounted = true; }, 100);

    const reloadStorage = () => {
      timetable = loadFromStorage('schedulify_timetable', {});

      const rawProgram = loadFromStorage<any[]>('schedulify_program', []);
      const acum = new Date();
      programViitor = rawProgram
        .map((z: any) => ({
          ...z,
          dateObj: z.dateObj ? new Date(z.dateObj) : null
        }))
        .filter((z: any) => {
          if (!z.dateObj) return false;
          const ziData = new Date(z.dateObj);
          // includem azi și zilele viitoare
          ziData.setHours(23, 59, 59, 999);
          return ziData >= acum;
        });

      const savedTimes = loadFromStorage<any[]>('schedulify_slot_times', []);
      slotTimes = Array.from({ length: 9 }, (_, i) => savedTimes[i] ?? {
        start: `${String(8 + i).padStart(2, '0')}:00`,
        end: `${String(9 + i).padStart(2, '0')}:00`
      });

      calendarEvents = loadFromStorage('schedulify_calendar_events', {});
    };

    reloadStorage();

    // BroadcastChannel prinde și schimbările din același tab (creare-program)
    const bc = new BroadcastChannel('schedulify_program_update');
    bc.onmessage = () => reloadStorage();

    window.addEventListener('storage', reloadStorage);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) reloadStorage();
    });

    return () => {
      window.removeEventListener('storage', reloadStorage);
      bc.close();
    };
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

        <!-- ── Task-uri viitoare ── -->
        <div class="bento-card tall-card">
          <div class="card-header">
            <h3>Task-uri viitoare</h3>
            <span class="badge" class:badge-blue={nrTaskuriActive > 0}>{nrTaskuriActive} active</span>
          </div>
          <div class="card-body">
            {#if programViitor.length === 0}
              <p class="placeholder-text">Nu ai program generat.</p>
              <a href="/sali-pregatire/creare-program" class="link-creare">📅 Creează program →</a>
            {:else}
              {#each programViitor.slice(0, 3) as zi}
                {@const activitatiStudiu = (zi.activitati ?? []).filter((a: any) => a.tip !== 'pauza')}
                {@const bifate = activitatiStudiu.filter((a: any) => a.bifat).length}
                {@const progres = activitatiStudiu.length
                  ? Math.round(bifate / activitatiStudiu.length * 100)
                  : 0}
                <div class="viitor-zi-card">
                  <div class="viitor-zi-header">
                    <span class="viitor-zi-nume">{zi.zi} — {zi.data}</span>
                    <span class="viitor-zi-progres" class:progres-done={progres === 100}>{progres}%</span>
                  </div>
                  <div class="progres-mini">
                    <div
                      class="progres-mini-fill"
                      class:progres-mini-green={progres === 100}
                      style="width: {progres}%"
                    ></div>
                  </div>
                  <div class="viitor-activitati">
                    {#each (zi.activitati ?? []).filter((a: any) => a.tip !== 'pauza').slice(0, 3) as act}
                      <div class="viitor-act tip-{act.tip}" class:bifat={act.bifat}>
                        <span class="study-check">{act.bifat ? '✓' : ''}</span>
                        <span class="study-ora-mini">{act.ora}</span>
                        <span class="study-act-mini">{act.activitate}</span>
                      </div>
                    {/each}
                    {#if activitatiStudiu.length > 3}
                      <span class="viitor-more">+{activitatiStudiu.length - 3} mai multe</span>
                    {/if}
                  </div>
                </div>
              {/each}
              {#if programViitor.length > 3}
                <a href="/sali-pregatire/creare-program" class="link-creare">
                  Vezi toate ({programViitor.length} zile) →
                </a>
              {/if}
            {/if}
          </div>
        </div>

        <!-- ── Orar ── -->
        <div class="bento-card wide-card">
          <div class="card-header">
            <h3>Orarul din {selectedDay} {MONTH_NAMES[currentMonth].slice(0, 3)}</h3>
          </div>
          <div class="card-body">
            <div class="timeline-flex">
              {#each oreleZileiCurente as slot, index}
                <div
                  class="timeline-item"
                  class:active={index === 0 && slot.subject !== 'Nicio oră configurată' && slot.subject !== 'Weekend – fără program'}
                  class:weekend={slot.subject === 'Weekend – fără program'}
                  style={slot.color ? `--slot-color: ${slot.color}` : ''}
                >
                  {#if slot.time}
                    <span class="time">{slot.time}</span>
                  {:else}
                    <span class="time">—</span>
                  {/if}
                  <div class="subject">{slot.subject}</div>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <!-- ── Teme ── -->
        <div class="bento-card">
          <div class="card-header"><h3>Teme din această zi</h3></div>
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

        <!-- ── Teste ── -->
        <div class="bento-card">
          <div class="card-header"><h3>Teste din această zi</h3></div>
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

        <!-- ── Program studiu azi ── -->
        <div class="bento-card wide-card">
          <div class="card-header">
            <h3>Program studiu azi</h3>
            <span class="badge" class:badge-green={progresAzi === 100}>{progresAzi}% completat</span>
          </div>
          <div class="card-body">
            {#if studyAziReactiv.length === 0}
              <p class="placeholder-text">Nu ai un program generat pentru azi.</p>
              <a href="/sali-pregatire/creare-program" class="link-creare">📅 Creează program →</a>
            {:else}
              <div class="progres-mini">
                <div class="progres-mini-fill" class:progres-mini-green={progresAzi === 100} style="width: {progresAzi}%"></div>
              </div>
              <div class="study-list">
                {#each studyAziReactiv as item}
                  <button
                    class="study-row tip-{item.tip}"
                    class:bifat={item.bifat}
                    onclick={() => toggleStudyItem(item)}
                  >
                    <span class="study-check">{item.bifat ? '✓' : ''}</span>
                    <span class="study-ora-mini">{item.ora}</span>
                    <span class="study-act-mini">{item.activitate}</span>
                    <span class="study-dur-mini">{item.durata}</span>
                  </button>
                {/each}
              </div>
            {/if}
          </div>
        </div>

        <!-- ── Calendar ── -->
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
                {@const hasEvents = (calendarEvents[dateKey(currentYear, currentMonth, day)] ?? []).length > 0}
                <button
                  class="cal-day"
                  class:active={selectedDay === day}
                  class:is-today={day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()}
                  class:has-events={hasEvents}
                  onclick={() => { selectedDay = day; }}
                >
                  <span>{day}</span>
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

  .page {
    --blue-950: #0a1628; --blue-600: #2563eb; --blue-200: #bfdbfe;
    font-family: 'DM Sans', sans-serif;
    width: 100%;
    background: transparent;
    position: relative; overflow: visible;
  }

  .bg-blob { position: fixed; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0; display: none; }
  .blob-1 { width: 600px; height: 600px; background: radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 70%); top: -100px; left: -100px; animation: blobFloat 9s ease-in-out infinite; }
  .blob-2 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(96,165,250,0.15) 0%, transparent 70%); bottom: -100px; right: 10%; animation: blobFloat 12s ease-in-out infinite reverse; }
  .blob-3 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%); top: 40%; left: 40%; animation: blobFloat 7s ease-in-out infinite 3s; }
  .grid-overlay { position: fixed; inset: 0; background-image: linear-gradient(rgba(96,165,250,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.04) 1px, transparent 1px); background-size: 60px 60px; pointer-events: none; z-index: 0; display: none; }
  @keyframes blobFloat { 0%, 100% { transform: translate(0,0) scale(1); } 33% { transform: translate(30px,-20px) scale(1.05); } 66% { transform: translate(-15px,15px) scale(0.97); } }

  .dashboard-container { position: relative; z-index: 1; width: 100%; padding: 24px; opacity: 0; transform: translateY(20px); transition: all 0.8s cubic-bezier(0.16,1,0.3,1); }
  .page.mounted .dashboard-container { opacity: 1; transform: translateY(0); }

  .main-content { display: flex; flex-direction: column; gap: 24px; width: 100%; }
  .top-header { color: white; }
  .top-header h2 { font-family: 'Syne', sans-serif; font-size: 32px; margin-bottom: 4px; letter-spacing: -0.02em; }
  .top-header p { color: var(--blue-200); font-size: 16px; }

  .bento-grid { display: grid; grid-template-columns: 320px 1fr 1fr; grid-auto-rows: minmax(180px, auto); gap: 24px; width: 100%; padding-bottom: 24px; }
  .bento-card { background: rgba(255,255,255,0.95); border-radius: 24px; padding: 24px; box-shadow: 0 4px 24px rgba(10,22,40,0.2); display: flex; flex-direction: column; transition: transform 0.3s ease; }
  .bento-card:hover { transform: translateY(-4px); }
  .tall-card { grid-row: span 3; }
  .wide-card { grid-column: span 2; }

  .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .card-header h3 { font-family: 'Syne', sans-serif; font-size: 18px; color: #0a1628; }
  .badge { background: #f1f5f9; color: #64748b; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; }
  .badge-blue { background: #dbeafe; color: var(--blue-600); }
  .badge-green { background: #dcfce7; color: #16a34a; }

  .card-body { flex: 1; display: flex; flex-direction: column; gap: 12px; }

  /* ── Task-uri viitoare ── */
  .viitor-zi-card {
    display: flex; flex-direction: column; gap: 8px;
    padding: 12px; background: #f8fafc; border-radius: 14px;
    border: 1px solid #e2e8f0;
  }
  .viitor-zi-header { display: flex; justify-content: space-between; align-items: center; }
  .viitor-zi-nume { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; color: #0a1628; }
  .viitor-zi-progres { font-size: 12px; font-weight: 700; color: #2563eb; }
  .viitor-zi-progres.progres-done { color: #16a34a; }

  .viitor-activitati { display: flex; flex-direction: column; gap: 4px; }
  .viitor-act {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 10px; border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
  }
  .viitor-act.tip-studiu       { background: #eff6ff; border-left: 3px solid #2563eb; }
  .viitor-act.tip-recapitulare { background: #fefce8; border-left: 3px solid #eab308; }
  .viitor-act.tip-pauza        { background: #f0fdf4; border-left: 3px solid #22c55e; }
  .viitor-act.bifat { opacity: 0.4; }
  .viitor-more { font-size: 11px; color: #94a3b8; padding: 2px 4px; }

  /* ── Timeline orar ── */
  .timeline-flex { display: flex; flex-direction: row; gap: 10px; align-items: stretch; flex-wrap: wrap; }
  .timeline-item { text-align: center; background: #f8fafc; padding: 12px 10px; border-radius: 14px; flex: 1; min-width: 90px; box-shadow: 0 2px 8px rgba(0,0,0,0.03); border-top: 3px solid transparent; transition: transform 0.15s; color: #0a1628; }
  .timeline-item:not(.weekend) { border-top-color: var(--slot-color, #2563eb); }
  .timeline-item.active { background: var(--blue-600); color: white; border-top-color: transparent; }
  .timeline-item.weekend { background: #eff6ff; border-top-color: #bfdbfe; }
  .timeline-item .time { display: block; font-size: 11px; opacity: 0.7; margin-bottom: 4px; font-weight: 600; }
  .timeline-item .subject { font-weight: 700; font-size: 13px; }

  .placeholder-text { font-size: 14px; color: #475569; padding: 12px; border: 2px dashed #cbd5e1; border-radius: 12px; text-align: center; font-weight: 500; }
  .highlight { border-color: #ef4444; color: #ef4444; background: #fef2f2; }

  /* ── Program studiu azi ── */
  .progres-mini { height: 6px; background: #e2e8f0; border-radius: 99px; overflow: hidden; }
  .progres-mini-fill { height: 100%; background: #2563eb; border-radius: 99px; transition: width 0.35s ease; }
  .progres-mini-fill.progres-mini-green { background: #22c55e; }

  .study-list { display: flex; flex-direction: column; gap: 6px; }
  .study-row { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 10px; border: none; cursor: pointer; width: 100%; text-align: left; transition: opacity 0.2s; font-family: 'DM Sans', sans-serif; }
  .study-row.bifat { opacity: 0.4; }
  .study-row.tip-studiu       { background: #eff6ff; border-left: 3px solid #2563eb; }
  .study-row.tip-recapitulare { background: #fefce8; border-left: 3px solid #eab308; }
  .study-row.tip-pauza        { background: #f0fdf4; border-left: 3px solid #22c55e; }

  .study-check { min-width: 18px; height: 18px; border-radius: 5px; border: 2px solid #cbd5e1; background: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #22c55e; flex-shrink: 0; }
  .bifat .study-check { background: #dcfce7; border-color: #22c55e; }
  .study-ora-mini  { font-size: 11px; font-weight: 700; color: #94a3b8; min-width: 40px; }
  .study-act-mini  { flex: 1; font-size: 13px; font-weight: 600; color: #1e293b; }
  .study-dur-mini  { font-size: 11px; color: #94a3b8; }
  .link-creare { display: inline-block; margin-top: 4px; color: #2563eb; font-weight: 600; text-decoration: none; font-size: 14px; }
  .link-creare:hover { text-decoration: underline; }

  /* ── Calendar ── */
  .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; text-align: center; }
  .cal-day-header { font-size: 11px; font-weight: 700; color: #94a3b8; padding-bottom: 4px; }
  .cal-day { padding: 10px 4px; font-size: 13px; color: #0a1628; border-radius: 10px; cursor: pointer; border: none; background: transparent; font-family: 'DM Sans', sans-serif; font-weight: 500; position: relative; display: flex; align-items: center; justify-content: center; flex-direction: column; }
  .cal-day:not(.empty):hover { background: #eff6ff; color: var(--blue-600); }
  .cal-day.active { background: var(--blue-600) !important; color: white !important; font-weight: bold; }
  .cal-day.is-today { background: #dbeafe; color: var(--blue-600); font-weight: 700; }
  .cal-day.has-events::after { content: ''; position: absolute; bottom: 2px; width: 6px; height: 6px; background: #ef4444; border-radius: 50%; }
  .cal-day.empty { pointer-events: none; }
  .nav-mini { background: #f1f5f9; border: none; width: 28px; height: 28px; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold; color: #475569; }
  .nav-mini:hover { background: #e2e8f0; }

  @media (max-width: 1024px) {
    .bento-grid { grid-template-columns: 1fr; }
    .tall-card, .wide-card { grid-column: auto; grid-row: auto; }
    .timeline-flex { flex-direction: column; align-items: stretch; }
  }
</style>