<!-- src/routes/app/calendar/+page.svelte -->
<script lang="ts">
  import { browser } from '$app/environment';

  let { data } = $props();

  // ── Study items din DB grupate pe ISO date ──────────────────
  let studyByDate = $state<Record<string, any[]>>(data.studyByDate ?? {});

  // ── Panel studiu ────────────────────────────────────────────
  let studyPanelDate  = $state<string | null>(null);
  let studyPanelItems = $derived(studyPanelDate ? (studyByDate[studyPanelDate] ?? []) : []);
  let studyProgres    = $derived(
    studyPanelItems.length
      ? Math.round(studyPanelItems.filter((i: any) => i.bifat).length / studyPanelItems.length * 100)
      : 0
  );

  // ── Modal adăugare activitate studiu ────────────────────────
  let showStudyModal  = $state(false);
  let studyModalDate  = $state<string | null>(null);   // ISO "2026-06-15"
  let studyModalZi    = $state('');                     // "Duminică"
  let studyModalData  = $state('');                     // "15 iunie"
  let studyForm = $state({
    activitate: '',
    ora:        '16:00',
    durata:     '60 min',
    tip:        'studiu' as 'studiu' | 'recapitulare' | 'pauza',
  });
  let studySaving = $state(false);

  function openStudyModal(isoDate: string, ziNume: string, dataStr: string) {
    studyModalDate = isoDate;
    studyModalZi   = ziNume;
    studyModalData = dataStr;
    studyForm = { activitate: '', ora: '16:00', durata: '60 min', tip: 'studiu' };
    showStudyModal = true;
  }

  async function saveStudyItem() {
    if (!studyModalDate || !studyForm.activitate.trim()) return;
    studySaving = true;
    try {
      const res = await fetch('/api/program', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date:       studyModalDate,
          zi:         studyModalZi,
          ora:        studyForm.ora,
          activitate: studyForm.activitate.trim(),
          durata:     studyForm.durata,
          tip:        studyForm.tip,
        })
      });
      const json = await res.json();
      if (json.ok && json.item) {
        // Adaugă optimistic în state
        studyByDate = {
          ...studyByDate,
          [studyModalDate]: [...(studyByDate[studyModalDate] ?? []), json.item]
        };
        // Dacă panelul e deschis pe aceeași zi, rămâne deschis și arată noul item
        if (studyPanelDate !== studyModalDate) {
          studyPanelDate = studyModalDate;
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      studySaving  = false;
      showStudyModal = false;
    }
  }

  async function toggleStudyItem(item: any) {
    studyByDate = {
      ...studyByDate,
      [item.date]: studyByDate[item.date].map((i: any) =>
        i.id === item.id ? { ...i, bifat: !i.bifat } : i
      )
    };
    await fetch('/api/program', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, bifat: !item.bifat })
    });
  }

  async function deleteStudyItem(item: any) {
    studyByDate = {
      ...studyByDate,
      [item.date]: studyByDate[item.date].filter((i: any) => i.id !== item.id)
    };
    if ((studyByDate[item.date] ?? []).length === 0) {
      studyPanelDate = null;
    }
    await fetch('/api/program', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id })
    });
  }

  // ── Logica calendar ─────────────────────────────────────────
  const SCHOOL_MONTHS = [8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6];
  const MONTH_NAMES = [
    'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
    'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
  ];
  const LUNI_GEN = [
    'ianuarie','februarie','martie','aprilie','mai','iunie',
    'iulie','august','septembrie','octombrie','noiembrie','decembrie'
  ];
  const ZILE_NUME = ['Duminică','Luni','Marți','Miercuri','Joi','Vineri','Sâmbătă'];
  const DAY_NAMES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  const EVENT_TYPES = [
    { value: 'test',      label: 'Test',      color: '#ef4444', icon: '📝' },
    { value: 'tema',      label: 'Temă',      color: '#f59e0b', icon: '📚' },
    { value: 'proiect',   label: 'Proiect',   color: '#8b5cf6', icon: '🗂'  },
    { value: 'eveniment', label: 'Eveniment', color: '#10b981', icon: '🎉' },
    { value: 'altele',    label: 'Altele',    color: '#3b82f6', icon: '📌' },
  ];

  type CalEvent = { id: string; title: string; type: string; color: string };

  function loadEventsFromStorage(): Record<string, CalEvent[]> {
    if (!browser) return {};
    try {
      const s = localStorage.getItem('schedulify_calendar_events');
      return s ? JSON.parse(s) : {};
    } catch { return {}; }
  }
  function saveEventsToStorage(evts: Record<string, CalEvent[]>) {
    if (!browser) return;
    try { localStorage.setItem('schedulify_calendar_events', JSON.stringify(evts)); } catch {}
  }

  const today        = new Date();
  let currentMonth   = $state(today.getMonth());
  let currentYear    = $state(today.getFullYear());
  let events         = $state<Record<string, CalEvent[]>>(loadEventsFromStorage());

  // Modal eveniment manual
  let showEventModal = $state(false);
  let modalDate      = $state<{ year: number; month: number; day: number } | null>(null);
  let editEvent      = $state<CalEvent | null>(null);
  let formData       = $state({ title: '', type: EVENT_TYPES[0].value, color: EVENT_TYPES[0].color });

  function dateKey(year: number, month: number, day: number) {
    return `${year}-${month}-${day}`;
  }
  function isoKey(year: number, month: number, day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  function dataStr(year: number, month: number, day: number) {
    return `${day} ${LUNI_GEN[month]}`;
  }
  function ziNume(year: number, month: number, day: number) {
    return ZILE_NUME[new Date(year, month, day).getDay()];
  }

  function getEventsForDay(day: number): CalEvent[] {
    return events[dateKey(currentYear, currentMonth, day)] ?? [];
  }
  function getStudyForDay(day: number): any[] {
    return studyByDate[isoKey(currentYear, currentMonth, day)] ?? [];
  }

  // Click pe o zi:
  // - dacă are studiu și panelul e ÎNCHIS → deschide panelul
  // - dacă are studiu și panelul e DESCHIS pe aceeași zi → deschide modalul de adăugare
  // - dacă NU are studiu → deschide direct modalul de adăugare activitate (același design)
  function handleDayClick(day: number) {
    const iso = isoKey(currentYear, currentMonth, day);
    const hasStudy = (studyByDate[iso]?.length ?? 0) > 0;

    if (hasStudy) {
      if (studyPanelDate === iso) {
        // Al doilea click → modal adăugare activitate
        openStudyModal(iso, ziNume(currentYear, currentMonth, day), dataStr(currentYear, currentMonth, day));
      } else {
        // Primul click → deschide panelul
        studyPanelDate = iso;
      }
    } else {
      // Zi goală → același modal "Activitate nouă" ca la zilele cu activități
      studyPanelDate = null;
      openStudyModal(iso, ziNume(currentYear, currentMonth, day), dataStr(currentYear, currentMonth, day));
    }
  }

  function openEdit(day: number, ev: CalEvent, e: MouseEvent) {
    e.stopPropagation();
    modalDate  = { year: currentYear, month: currentMonth, day };
    editEvent  = ev;
    formData   = { title: ev.title, type: ev.type, color: ev.color };
    showEventModal = true;
  }

  function saveEvent() {
    if (!modalDate || !formData.title.trim()) return;
    const key  = dateKey(modalDate.year, modalDate.month, modalDate.day);
    const list = [...(events[key] ?? [])];
    if (editEvent) {
      const idx = list.findIndex(e => e.id === editEvent!.id);
      if (idx !== -1) list[idx] = { ...editEvent, title: formData.title.trim(), type: formData.type, color: formData.color };
    } else {
      list.push({ id: crypto.randomUUID(), title: formData.title.trim(), type: formData.type, color: formData.color });
    }
    events = { ...events, [key]: list };
    saveEventsToStorage(events);
    showEventModal = false;
  }

  function deleteEvent() {
    if (!modalDate || !editEvent) return;
    const key = dateKey(modalDate.year, modalDate.month, modalDate.day);
    events    = { ...events, [key]: (events[key] ?? []).filter(e => e.id !== editEvent!.id) };
    saveEventsToStorage(events);
    showEventModal = false;
  }

  function onTypeChange(type: string) {
    const found   = EVENT_TYPES.find(t => t.value === type);
    formData.type = type;
    if (found) formData.color = found.color;
  }

  function prevMonth() {
    if (currentMonth === 0) { currentMonth = 11; currentYear--; }
    else currentMonth--;
    studyPanelDate = null;
  }
  function nextMonth() {
    if (currentMonth === 11) { currentMonth = 0; currentYear++; }
    else currentMonth++;
    studyPanelDate = null;
  }

  function isToday(day: number) {
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  }
  function isSchoolMonth(month: number) { return SCHOOL_MONTHS.includes(month); }

  let cells = $derived((() => {
    const first = (() => { const d = new Date(currentYear, currentMonth, 1).getDay(); return d === 0 ? 6 : d - 1; })();
    const total = new Date(currentYear, currentMonth + 1, 0).getDate();
    const arr: (number | null)[] = Array(first).fill(null);
    for (let i = 1; i <= total; i++) arr.push(i);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  })());

  let totalEvents = $derived(Object.values(events).flat().length);

  const TIP_CULORI: Record<string, string> = {
    studiu:       '#2563eb',
    recapitulare: '#eab308',
    pauza:        '#22c55e',
  };
  const TIP_ICONS: Record<string, string> = {
    studiu:       '📖',
    recapitulare: '🔄',
    pauza:        '☕',
  };
</script>

<svelte:head>
  <title>Calendar — Schedulify</title>
</svelte:head>

<div class="cal-page">
  <header class="cal-header">
    <div>
      <h1 class="cal-title">Calendar</h1>
      <p class="cal-sub">
        {totalEvents > 0
          ? `${totalEvents} evenimente · Apasă o zi să adaugi`
          : 'Apasă pe orice zi ca să adaugi un eveniment'}
      </p>
    </div>
  </header>

  <div class="cal-card">
    <div class="cal-nav">
      <button class="nav-btn" onclick={prevMonth}>‹</button>
      <div class="cal-month-info">
        <span class="cal-month-name">{MONTH_NAMES[currentMonth]}</span>
        <span class="cal-year">{currentYear}</span>
        {#if !isSchoolMonth(currentMonth)}
          <span class="vacation-badge">Vacanță</span>
        {/if}
      </div>
      <button class="nav-btn" onclick={nextMonth}>›</button>
    </div>

    <div class="month-pills">
      {#each SCHOOL_MONTHS as m}
        <button
          class="month-pill"
          class:active={m === currentMonth}
          onclick={() => {
            currentMonth = m;
            currentYear = m < 8 ? today.getFullYear() : today.getFullYear() - (today.getMonth() >= 8 ? 0 : 1);
            studyPanelDate = null;
          }}
        >
          {MONTH_NAMES[m].slice(0, 3)}
        </button>
      {/each}
    </div>

    <div class="cal-grid">
      {#each DAY_NAMES as d}
        <div class="day-header">{d}</div>
      {/each}

      {#each cells as day}
        {#if day === null}
          <div class="day-cell empty"></div>
        {:else}
          {@const dayEvents  = getEventsForDay(day)}
          {@const dayStudy   = getStudyForDay(day)}
          {@const iso        = isoKey(currentYear, currentMonth, day)}
          {@const isStudySel = studyPanelDate === iso}
          {@const hasStudy   = dayStudy.length > 0}
          <button
            class="day-cell"
            class:today={isToday(day)}
            class:has-events={dayEvents.length > 0 || hasStudy}
            class:study-selected={isStudySel}
            class:study-day={hasStudy}
            onclick={() => handleDayClick(day)}
            title={hasStudy && isStudySel ? 'Click din nou pentru a adăuga o activitate' : hasStudy ? 'Click pentru a vedea programul' : 'Click pentru a adăuga'}
          >
            <span class="day-num">{day}</span>

            <!-- Hint al doilea click -->
            {#if hasStudy && isStudySel}
              <span class="second-click-hint">+ adaugă</span>
            {/if}

            <!-- Activități studiu -->
            {#if dayStudy.length > 0}
              <div class="event-pills">
                {#each dayStudy.slice(0, 2) as item}
                  <span
                    class="event-pill study-pill"
                    class:bifat={item.bifat}
                    style="background:{TIP_CULORI[item.tip] ?? '#2563eb'}"
                  >
                    {TIP_ICONS[item.tip] ?? '📖'} {item.activitate.length > 9 ? item.activitate.slice(0, 9) + '…' : item.activitate}
                  </span>
                {/each}
                {#if dayStudy.length > 2}
                  <span class="more-badge">+{dayStudy.length - 2}</span>
                {/if}
              </div>
            {/if}

            <!-- Evenimente manuale -->
            {#if dayEvents.length > 0}
              <div class="event-pills">
                {#each dayEvents.slice(0, 1) as ev}
                  <button
                    class="event-pill"
                    style="background:{ev.color}"
                    onclick={(e) => openEdit(day, ev, e)}
                  >{ev.title}</button>
                {/each}
                {#if dayEvents.length > 1}
                  <span class="more-badge">+{dayEvents.length - 1}</span>
                {/if}
              </div>
            {/if}
          </button>
        {/if}
      {/each}
    </div>

    {#if totalEvents > 0}
      <div class="selected-info">
        <span>{totalEvents} {totalEvents === 1 ? 'eveniment' : 'evenimente'}</span>
        <button class="clear-btn" onclick={() => { events = {}; saveEventsToStorage({}); }}>Șterge tot</button>
      </div>
    {/if}
  </div>

  <!-- ── Panel studiu zi selectată ──────────────────────────── -->
  {#if studyPanelDate && studyPanelItems.length > 0}
    {@const firstItem = studyPanelItems[0]}
    <div class="study-panel">
      <div class="study-panel-header">
        <div>
          <h3 class="study-panel-title">{firstItem.zi} — program de studiu</h3>
          <p class="study-panel-sub">{studyPanelItems.filter((i: any) => i.bifat).length}/{studyPanelItems.length} completate</p>
        </div>
        <div class="study-progres-wrap">
          <div class="study-progres-bar">
            <div class="study-progres-fill" style="width: {studyProgres}%"></div>
          </div>
          <span class="study-progres-pct">{studyProgres}%</span>
        </div>
        <button
          class="panel-add-btn"
          onclick={() => openStudyModal(studyPanelDate!, firstItem.zi, firstItem.date)}
          title="Adaugă activitate"
        >+ Adaugă</button>
        <button class="panel-close" onclick={() => studyPanelDate = null}>×</button>
      </div>

      <div class="study-panel-list">
        {#each studyPanelItems as item}
          <div class="study-item-row">
            <button
              class="study-item tip-{item.tip}"
              class:bifat={item.bifat}
              onclick={() => toggleStudyItem(item)}
            >
              <span class="study-checkbox">{item.bifat ? '✓' : ''}</span>
              <span class="study-ora">{item.ora}</span>
              <div class="study-info">
                <span class="study-activitate">{item.activitate}</span>
                <span class="study-durata">{item.durata}</span>
              </div>
            </button>
            <button
              class="delete-item-btn"
              onclick={() => deleteStudyItem(item)}
              title="Șterge"
            >×</button>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<!-- ── Modal adăugare activitate studiu ─────────────────────── -->
{#if showStudyModal}
  <div class="modal-backdrop" onclick={() => showStudyModal = false}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h2 class="modal-title">
          Activitate nouă · {studyModalData}
        </h2>
        <button class="modal-close" onclick={() => showStudyModal = false}>×</button>
      </div>
      <div class="modal-body">
        <div class="field">
          <label for="act-title">Activitate *</label>
          <input
            id="act-title"
            type="text"
            placeholder="ex: Studiu Matematică, Recapitulare Fizică…"
            bind:value={studyForm.activitate}
            onkeydown={(e) => e.key === 'Enter' && saveStudyItem()}
          />
        </div>
        <div class="field-row">
          <div class="field">
            <label for="act-ora">Ora start</label>
            <input id="act-ora" type="time" bind:value={studyForm.ora} />
          </div>
          <div class="field">
            <label for="act-durata">Durată</label>
            <select id="act-durata" bind:value={studyForm.durata}>
              <option value="15 min">15 min</option>
              <option value="30 min">30 min</option>
              <option value="45 min">45 min</option>
              <option value="60 min">60 min</option>
              <option value="90 min">90 min</option>
              <option value="120 min">120 min</option>
            </select>
          </div>
        </div>
        <div class="field">
          <label>Tip activitate</label>
          <div class="type-picker">
            {#each [
              { value: 'studiu',       label: 'Studiu',       color: '#2563eb', icon: '📖' },
              { value: 'recapitulare', label: 'Recapitulare', color: '#eab308', icon: '🔄' },
              { value: 'pauza',        label: 'Pauză',        color: '#22c55e', icon: '☕' },
            ] as t}
              <button
                class="type-btn"
                class:active={studyForm.tip === t.value}
                style={studyForm.tip === t.value ? `background:${t.color}22; border-color:${t.color}; color:${t.color}` : ''}
                onclick={() => { studyForm.tip = t.value as any; }}
              >
                {t.icon} {t.label}
              </button>
            {/each}
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <span></span>
        <div class="btn-group">
          <button class="btn-ghost" onclick={() => showStudyModal = false}>Anulează</button>
          <button
            class="btn-primary"
            onclick={saveStudyItem}
            disabled={!studyForm.activitate.trim() || studySaving}
          >
            {studySaving ? 'Se salvează…' : 'Salvează'}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- ── Modal eveniment manual ─────────────────────────────────  -->
{#if showEventModal}
  <div class="modal-backdrop" onclick={() => showEventModal = false}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <h2 class="modal-title">
          {editEvent ? 'Editează eveniment' : 'Eveniment nou'}
          {#if modalDate}· {modalDate.day} {MONTH_NAMES[modalDate.month]}{/if}
        </h2>
        <button class="modal-close" onclick={() => showEventModal = false}>×</button>
      </div>
      <div class="modal-body">
        <div class="field">
          <label for="ev-title">Titlu *</label>
          <input
            id="ev-title"
            type="text"
            placeholder="ex: Test la Matematică"
            bind:value={formData.title}
            onkeydown={(e) => e.key === 'Enter' && saveEvent()}
          />
        </div>
        <div class="field">
          <label>Tip</label>
          <div class="type-picker">
            {#each EVENT_TYPES as t}
              <button
                class="type-btn"
                class:active={formData.type === t.value}
                style={formData.type === t.value ? `background:${t.color}22; border-color:${t.color}; color:${t.color}` : ''}
                onclick={() => onTypeChange(t.value)}
              >
                {t.icon} {t.label}
              </button>
            {/each}
          </div>
        </div>
      </div>
      <div class="modal-footer">
        {#if editEvent}
          <button class="btn-danger" onclick={deleteEvent}>Șterge</button>
        {:else}
          <span></span>
        {/if}
        <div class="btn-group">
          <button class="btn-ghost" onclick={() => showEventModal = false}>Anulează</button>
          <button class="btn-primary" onclick={saveEvent} disabled={!formData.title.trim()}>Salvează</button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .cal-page {
    max-width: 780px; width: 100%;
    margin: 0 auto; padding: 2rem 0 3rem;
    display: flex; flex-direction: column; gap: 1.5rem;
  }

  .cal-title {
    font-family: 'Syne', sans-serif;
    font-size: 2rem; font-weight: 800;
    margin: 0 0 0.25rem; letter-spacing: -0.03em; color: white;
  }
  .cal-sub { font-size: 0.85rem; color: rgba(191,219,254,0.6); margin: 0; }

  .cal-card {
    background: rgba(255,255,255,0.95);
    border-radius: 24px;
    box-shadow: 0 0 0 1px rgba(37,99,235,0.1), 0 16px 40px rgba(10,22,40,0.4);
    padding: 1.5rem;
  }

  .cal-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.2rem; }
  .nav-btn {
    background: #eff6ff; border: 1px solid #bfdbfe; color: #2563eb;
    width: 36px; height: 36px; border-radius: 10px; font-size: 1.2rem;
    cursor: pointer; transition: background 0.2s;
    display: flex; align-items: center; justify-content: center;
  }
  .nav-btn:hover { background: #dbeafe; }
  .cal-month-info { display: flex; align-items: center; gap: 0.5rem; }
  .cal-month-name { font-family: 'Syne', sans-serif; font-size: 1.2rem; font-weight: 700; color: #0f2347; }
  .cal-year { font-size: 0.9rem; color: #94a3b8; }
  .vacation-badge { font-size: 0.65rem; padding: 0.15rem 0.5rem; border-radius: 100px; background: #fffbeb; color: #d97706; border: 1px solid #fde68a; }

  .month-pills { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 1.2rem; }
  .month-pill {
    font-size: 0.72rem; padding: 0.3rem 0.65rem; border-radius: 100px;
    background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b;
    cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif;
  }
  .month-pill:hover { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }
  .month-pill.active { background: #2563eb; border-color: #2563eb; color: white; }

  .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
  .day-header { text-align: center; font-size: 0.7rem; color: #94a3b8; padding: 0.4rem 0; font-weight: 600; }

  .day-cell {
    display: flex; flex-direction: column; align-items: center; gap: 2px;
    min-height: 76px; padding: 4px 2px;
    border-radius: 10px; border: none;
    background: transparent; color: #475569;
    cursor: pointer; transition: all 0.15s;
    font-family: 'DM Sans', sans-serif;
    position: relative;
  }
  .day-cell:not(.empty):hover { background: #eff6ff; color: #2563eb; }
  .day-cell.empty { cursor: default; pointer-events: none; }

  /* Zi cu studiu: bordură subtilă albastră */
  .day-cell.study-day { background: #f0f7ff; }
  .day-cell.study-day:hover { background: #dbeafe; }

  /* Zi selectată (panel deschis) */
  .day-cell.study-selected {
    background: #dbeafe !important;
    outline: 2px solid #2563eb;
  }

  .day-cell.today .day-num {
    background: #2563eb; color: white;
    border-radius: 50%; width: 24px; height: 24px;
    display: flex; align-items: center; justify-content: center; font-weight: 700;
  }
  .day-num { font-size: 0.82rem; font-weight: 500; line-height: 1; color: inherit; }

  /* Hint "click din nou = adaugă" */
  .second-click-hint {
    font-size: 0.55rem; font-weight: 700;
    color: #2563eb; background: #dbeafe;
    border-radius: 4px; padding: 1px 4px;
    position: absolute; top: 3px; right: 3px;
  }

  .event-pills { display: flex; flex-direction: column; gap: 1px; width: 100%; align-items: stretch; }
  .event-pill {
    font-size: 0.55rem; padding: 1px 4px; border-radius: 4px; border: none;
    color: white; cursor: pointer;
    text-overflow: ellipsis; overflow: hidden; white-space: nowrap;
    width: 100%; font-family: 'DM Sans', sans-serif; font-weight: 600;
    text-align: left; transition: opacity 0.15s;
  }
  .event-pill:hover { opacity: 0.8; }
  .study-pill { pointer-events: none; }
  .study-pill.bifat { opacity: 0.4; text-decoration: line-through; }
  .more-badge { font-size: 0.52rem; color: #94a3b8; font-weight: 600; text-align: center; }

  .selected-info {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;
    font-size: 0.8rem; color: #94a3b8;
  }
  .clear-btn { background: none; border: none; color: #ef4444; font-size: 0.78rem; cursor: pointer; padding: 0; font-family: 'DM Sans', sans-serif; }
  .clear-btn:hover { opacity: 0.7; }

  /* ── Study panel ─────────────────────────────────────────── */
  .study-panel {
    background: rgba(255,255,255,0.95);
    border-radius: 24px;
    box-shadow: 0 0 0 1px rgba(37,99,235,0.12), 0 12px 32px rgba(10,22,40,0.3);
    overflow: hidden;
    animation: fadeUp 0.3s cubic-bezier(0.16,1,0.3,1);
  }
  @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

  .study-panel-header {
    display: flex; align-items: center; gap: 12px;
    padding: 1.25rem 1.5rem;
    border-bottom: 2px solid #2563eb;
    background: #f8faff;
  }
  .study-panel-title { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 700; color: #0f2347; margin: 0; }
  .study-panel-sub { font-size: 0.78rem; color: #64748b; margin: 2px 0 0; }

  .study-progres-wrap { display: flex; align-items: center; gap: 8px; flex: 1; }
  .study-progres-bar { flex: 1; height: 6px; background: #e2e8f0; border-radius: 99px; overflow: hidden; }
  .study-progres-fill { height: 100%; background: #22c55e; border-radius: 99px; transition: width 0.35s ease; }
  .study-progres-pct { font-size: 0.78rem; font-weight: 700; color: #22c55e; min-width: 32px; text-align: right; }

  .panel-add-btn {
    background: #2563eb; color: white; border: none;
    padding: 6px 14px; border-radius: 8px; font-size: 0.78rem;
    font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif;
    transition: background 0.15s;
    white-space: nowrap;
  }
  .panel-add-btn:hover { background: #1d4ed8; }

  .panel-close {
    background: #f1f5f9; border: none; color: #94a3b8;
    width: 28px; height: 28px; border-radius: 8px; font-size: 1rem;
    cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .panel-close:hover { background: #e2e8f0; }

  .study-panel-list { display: flex; flex-direction: column; gap: 6px; padding: 1rem 1.25rem 1.25rem; }

  .study-item-row {
    display: flex; align-items: center; gap: 6px;
  }

  .study-item {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 14px; border-radius: 12px; border: none;
    cursor: pointer; flex: 1; text-align: left;
    transition: opacity 0.2s, transform 0.1s;
  }
  .study-item:active { transform: scale(0.99); }
  .study-item.bifat { opacity: 0.45; }

  .tip-studiu       { background: #eff6ff; border-left: 3px solid #2563eb; }
  .tip-recapitulare { background: #fefce8; border-left: 3px solid #eab308; }
  .tip-pauza        { background: #f0fdf4; border-left: 3px solid #22c55e; }

  .study-checkbox {
    min-width: 20px; height: 20px; border-radius: 6px;
    border: 2px solid #cbd5e1; background: white;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: #22c55e; flex-shrink: 0;
  }
  .bifat .study-checkbox { background: #dcfce7; border-color: #22c55e; }
  .study-ora { font-size: 12px; font-weight: 700; color: #94a3b8; min-width: 44px; }
  .study-info { display: flex; flex-direction: column; gap: 2px; }
  .study-activitate { font-size: 14px; font-weight: 600; color: #1e293b; }
  .study-durata { font-size: 12px; color: #94a3b8; }

  .delete-item-btn {
    background: none; border: none; color: #cbd5e1;
    width: 24px; height: 24px; border-radius: 6px;
    font-size: 1rem; cursor: pointer; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    transition: color 0.15s, background 0.15s;
  }
  .delete-item-btn:hover { color: #ef4444; background: #fef2f2; }

  /* ── Modals ──────────────────────────────────────────────── */
  .modal-backdrop {
    position: fixed; inset: 0; background: rgba(0,0,0,0.5);
    backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    z-index: 100; padding: 1rem;
  }
  .modal {
    width: 100%; max-width: 420px;
    background: rgba(255,255,255,0.98); border-radius: 24px;
    box-shadow: 0 0 0 1px rgba(37,99,235,0.1), 0 24px 60px rgba(10,22,40,0.4);
    overflow: hidden;
  }
  .modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1.25rem 1.5rem 0;
  }
  .modal-title { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 700; margin: 0; color: #0f2347; }
  .modal-close {
    background: #f1f5f9; border: none; color: #94a3b8;
    width: 28px; height: 28px; border-radius: 8px; font-size: 1rem;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
  }
  .modal-close:hover { background: #e2e8f0; }
  .modal-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
  .modal-footer {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 1.5rem 1.5rem; gap: 0.5rem;
  }
  .btn-group { display: flex; gap: 0.5rem; }

  .field { display: flex; flex-direction: column; gap: 0.35rem; }
  .field-row { display: flex; gap: 1rem; }
  .field-row .field { flex: 1; }

  label { font-size: 0.72rem; font-weight: 700; color: #64748b; letter-spacing: 0.06em; text-transform: uppercase; }
  input, select {
    background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
    padding: 0.6rem 0.85rem; font-size: 0.88rem; color: #0f2347;
    outline: none; transition: border-color 0.15s; width: 100%;
    box-sizing: border-box; font-family: 'DM Sans', sans-serif;
  }
  input:focus, select:focus { border-color: #2563eb; }
  input::placeholder { color: #cbd5e1; }

  .type-picker { display: flex; flex-wrap: wrap; gap: 0.4rem; }
  .type-btn {
    padding: 0.4rem 0.8rem; border-radius: 8px; border: 1px solid #e2e8f0;
    background: #f8fafc; color: #64748b; font-size: 0.78rem;
    cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; font-weight: 600;
  }
  .type-btn:hover { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }

  .btn-primary {
    background: #2563eb; border: none; color: white;
    padding: 0.55rem 1.2rem; border-radius: 10px; font-size: 0.83rem;
    font-weight: 600; cursor: pointer; transition: background 0.15s;
    font-family: 'DM Sans', sans-serif;
  }
  .btn-primary:hover:not(:disabled) { background: #1d4ed8; }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-ghost {
    background: #f1f5f9; border: 1px solid #e2e8f0; color: #64748b;
    padding: 0.55rem 1rem; border-radius: 10px; font-size: 0.83rem;
    cursor: pointer; transition: background 0.15s; font-family: 'DM Sans', sans-serif;
  }
  .btn-ghost:hover { background: #e2e8f0; }
  .btn-danger {
    background: none; border: none; color: #ef4444;
    font-size: 0.8rem; cursor: pointer; padding: 0; font-family: 'DM Sans', sans-serif;
  }
  .btn-danger:hover { opacity: 0.7; }
</style>