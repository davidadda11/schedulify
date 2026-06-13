<script lang="ts">
    const SCHOOL_MONTHS = [8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6];
    const MONTH_NAMES = [
        'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
        'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
    ];
    const DAY_NAMES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

    const EVENT_TYPES = [
        { value: 'test', label: 'Test', color: '#ef4444', icon: '📝' },
        { value: 'tema', label: 'Temă', color: '#f59e0b', icon: '📚' },
        { value: 'proiect', label: 'Proiect', color: '#8b5cf6', icon: '🗂' },
        { value: 'eveniment', label: 'Eveniment', color: '#10b981', icon: '🎉' },
        { value: 'altele', label: 'Altele', color: '#3b82f6', icon: '📌' },
    ];

    type CalEvent = {
        id: string;
        title: string;
        type: string;
        color: string;
    };

    const today = new Date();
    let currentMonth = $state(today.getMonth());
    let currentYear = $state(today.getFullYear());
    let events = $state<Record<string, CalEvent[]>>({});

    let showModal = $state(false);
    let modalDate = $state<{ year: number; month: number; day: number } | null>(null);
    let editEvent = $state<CalEvent | null>(null);
    let formData = $state({ title: '', type: EVENT_TYPES[0].value, color: EVENT_TYPES[0].color });

    function dateKey(year: number, month: number, day: number) {
        return `${year}-${month}-${day}`;
    }

    function getEventsForDay(day: number): CalEvent[] {
        return events[dateKey(currentYear, currentMonth, day)] ?? [];
    }

    function openAdd(day: number) {
        modalDate = { year: currentYear, month: currentMonth, day };
        editEvent = null;
        formData = { title: '', type: EVENT_TYPES[0].value, color: EVENT_TYPES[0].color };
        showModal = true;
    }

    function openEdit(day: number, ev: CalEvent, e: MouseEvent) {
        e.stopPropagation();
        modalDate = { year: currentYear, month: currentMonth, day };
        editEvent = ev;
        formData = { title: ev.title, type: ev.type, color: ev.color };
        showModal = true;
    }

    function saveEvent() {
        if (!modalDate || !formData.title.trim()) return;
        const key = dateKey(modalDate.year, modalDate.month, modalDate.day);
        const list = [...(events[key] ?? [])];
        if (editEvent) {
            const idx = list.findIndex(e => e.id === editEvent!.id);
            if (idx !== -1) list[idx] = { ...editEvent, title: formData.title.trim(), type: formData.type, color: formData.color };
        } else {
            list.push({ id: crypto.randomUUID(), title: formData.title.trim(), type: formData.type, color: formData.color });
        }
        events = { ...events, [key]: list };
        showModal = false;
    }

    function deleteEvent() {
        if (!modalDate || !editEvent) return;
        const key = dateKey(modalDate.year, modalDate.month, modalDate.day);
        events = { ...events, [key]: (events[key] ?? []).filter(e => e.id !== editEvent!.id) };
        showModal = false;
    }

    function onTypeChange(type: string) {
        const found = EVENT_TYPES.find(t => t.value === type);
        formData.type = type;
        if (found) formData.color = found.color;
    }

    function prevMonth() {
        if (currentMonth === 0) { currentMonth = 11; currentYear--; }
        else currentMonth--;
    }

    function nextMonth() {
        if (currentMonth === 11) { currentMonth = 0; currentYear++; }
        else currentMonth++;
    }

    function getDaysInMonth(month: number, year: number) {
        return new Date(year, month + 1, 0).getDate();
    }

    function getFirstDayOfMonth(month: number, year: number) {
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1;
    }

    function isToday(day: number) {
        return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
    }

    function isSchoolMonth(month: number) {
        return SCHOOL_MONTHS.includes(month);
    }

    let cells = $derived((() => {
        const first = getFirstDayOfMonth(currentMonth, currentYear);
        const total = getDaysInMonth(currentMonth, currentYear);
        const arr: (number | null)[] = Array(first).fill(null);
        for (let i = 1; i <= total; i++) arr.push(i);
        while (arr.length % 7 !== 0) arr.push(null);
        return arr;
    })());

    let totalEvents = $derived(Object.values(events).flat().length);
</script>

<svelte:head>
    <title>Calendar — Schedulify</title>
</svelte:head>

<div class="cal-page">
    <header class="cal-header">
        <div>
            <h1 class="cal-title">Calendar</h1>
            <p class="cal-sub">
                {totalEvents > 0 ? `${totalEvents} evenimente · Apasă o zi ca să adaugi` : 'Apasă pe orice zi ca să adaugi un eveniment'}
            </p>
        </div>
    </header>

    <div class="cal-card">
        <div class="cal-nav">
            <button class="nav-btn" onclick={prevMonth} aria-label="Luna anterioară">‹</button>
            <div class="cal-month-info">
                <span class="cal-month-name">{MONTH_NAMES[currentMonth]}</span>
                <span class="cal-year">{currentYear}</span>
                {#if !isSchoolMonth(currentMonth)}
                    <span class="vacation-badge">Vacanță</span>
                {/if}
            </div>
            <button class="nav-btn" onclick={nextMonth} aria-label="Luna următoare">›</button>
        </div>

        <div class="month-pills">
            {#each SCHOOL_MONTHS as m}
                <button
                    class="month-pill"
                    class:active={m === currentMonth}
                    onclick={() => {
                        currentMonth = m;
                        if (m < 8) currentYear = today.getFullYear();
                        else currentYear = today.getFullYear() - (today.getMonth() >= 8 ? 0 : 1);
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
                    {@const dayEvents = getEventsForDay(day)}
                    <button
                        class="day-cell"
                        class:today={isToday(day)}
                        class:has-events={dayEvents.length > 0}
                        onclick={() => openAdd(day)}
                    >
                        <span class="day-num">{day}</span>
                        {#if dayEvents.length > 0}
                            <div class="event-pills">
                                {#each dayEvents.slice(0, 2) as ev}
                                    <button
                                        class="event-pill"
                                        style="background:{ev.color}"
                                        onclick={(e) => openEdit(day, ev, e)}
                                        title={ev.title}
                                    >{ev.title}</button>
                                {/each}
                                {#if dayEvents.length > 2}
                                    <span class="more-badge">+{dayEvents.length - 2}</span>
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
                <button class="clear-btn" onclick={() => events = {}}>Șterge tot</button>
            </div>
        {/if}
    </div>
</div>

{#if showModal}
    <div class="modal-backdrop" onclick={() => showModal = false}>
        <div class="modal" onclick={(e) => e.stopPropagation()}>
            <div class="modal-header">
                <h2 class="modal-title">
                    {editEvent ? 'Editează eveniment' : 'Eveniment nou'}
                    {#if modalDate}· {modalDate.day} {MONTH_NAMES[modalDate.month]}{/if}
                </h2>
                <button class="modal-close" onclick={() => showModal = false}>×</button>
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
                    <button class="btn-ghost" onclick={() => showModal = false}>Anulează</button>
                    <button class="btn-primary" onclick={saveEvent} disabled={!formData.title.trim()}>Salvează</button>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .cal-page {
        max-width: 680px;
        width: 100%;
        margin: 0 auto;
        padding-top: 2rem;
        padding-bottom: 3rem;
    }

    .cal-header {
        margin-bottom: 2rem;
    }

    .cal-title {
        font-family: 'Syne', sans-serif;
        font-size: 2rem;
        font-weight: 800;
        margin: 0 0 0.25rem;
        letter-spacing: -0.03em;
        color: white;
    }

    .cal-sub {
        font-size: 0.85rem;
        color: rgba(191, 219, 254, 0.6);
        margin: 0;
    }

    .cal-card {
        background: rgba(255, 255, 255, 0.95);
        border-radius: 24px;
        box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.1), 0 16px 40px rgba(10, 22, 40, 0.4);
        padding: 1.5rem;
    }

    .cal-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1.2rem;
    }

    .nav-btn {
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        color: #2563eb;
        width: 36px;
        height: 36px;
        border-radius: 10px;
        font-size: 1.2rem;
        cursor: pointer;
        transition: background 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .nav-btn:hover { background: #dbeafe; }

    .cal-month-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .cal-month-name {
        font-family: 'Syne', sans-serif;
        font-size: 1.2rem;
        font-weight: 700;
        color: #0f2347;
    }

    .cal-year {
        font-size: 0.9rem;
        color: #94a3b8;
    }

    .vacation-badge {
        font-size: 0.65rem;
        padding: 0.15rem 0.5rem;
        border-radius: 100px;
        background: #fffbeb;
        color: #d97706;
        border: 1px solid #fde68a;
    }

    .month-pills {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
        margin-bottom: 1.2rem;
    }

    .month-pill {
        font-size: 0.72rem;
        padding: 0.3rem 0.65rem;
        border-radius: 100px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        color: #64748b;
        cursor: pointer;
        transition: all 0.15s;
        font-family: 'DM Sans', sans-serif;
    }

    .month-pill:hover { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }

    .month-pill.active {
        background: #2563eb;
        border-color: #2563eb;
        color: white;
    }

    .cal-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 4px;
    }

    .day-header {
        text-align: center;
        font-size: 0.7rem;
        color: #94a3b8;
        padding: 0.4rem 0;
        font-weight: 600;
    }

    .day-cell {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        min-height: 52px;
        padding: 4px 2px;
        border-radius: 10px;
        border: none;
        background: transparent;
        color: #475569;
        cursor: pointer;
        transition: all 0.15s;
        font-family: 'DM Sans', sans-serif;
    }

    .day-cell:not(.empty):hover { background: #eff6ff; color: #2563eb; }
    .day-cell.empty { cursor: default; pointer-events: none; }

    .day-cell.today .day-num {
        background: #2563eb;
        color: white;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
    }

    .day-num {
        font-size: 0.82rem;
        font-weight: 500;
        line-height: 1;
        color: inherit;
    }

    .event-pills {
        display: flex;
        flex-direction: column;
        gap: 1px;
        width: 100%;
        align-items: stretch;
    }

    .event-pill {
        font-size: 0.55rem;
        padding: 1px 4px;
        border-radius: 4px;
        border: none;
        color: white;
        cursor: pointer;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
        width: 100%;
        font-family: 'DM Sans', sans-serif;
        font-weight: 600;
        text-align: left;
        transition: opacity 0.15s;
    }

    .event-pill:hover { opacity: 0.8; }

    .more-badge {
        font-size: 0.52rem;
        color: #94a3b8;
        font-weight: 600;
        text-align: center;
    }

    .selected-info {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #e2e8f0;
        font-size: 0.8rem;
        color: #94a3b8;
    }

    .clear-btn {
        background: none;
        border: none;
        color: #ef4444;
        font-size: 0.78rem;
        cursor: pointer;
        padding: 0;
        font-family: 'DM Sans', sans-serif;
    }

    .clear-btn:hover { opacity: 0.7; }

    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        padding: 1rem;
    }

    .modal {
        width: 100%;
        max-width: 420px;
        background: rgba(255, 255, 255, 0.98);
        border-radius: 24px;
        box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.1), 0 24px 60px rgba(10, 22, 40, 0.4);
        overflow: hidden;
    }

    .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.25rem 1.5rem 0;
    }

    .modal-title {
        font-family: 'Syne', sans-serif;
        font-size: 1rem;
        font-weight: 700;
        margin: 0;
        color: #0f2347;
    }

    .modal-close {
        background: #f1f5f9;
        border: none;
        color: #94a3b8;
        width: 28px;
        height: 28px;
        border-radius: 8px;
        font-size: 1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .modal-close:hover { background: #e2e8f0; }

    .modal-body {
        padding: 1.25rem 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .field {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
    }

    label {
        font-size: 0.72rem;
        font-weight: 700;
        color: #64748b;
        letter-spacing: 0.06em;
        text-transform: uppercase;
    }

    input {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 0.6rem 0.85rem;
        font-size: 0.88rem;
        color: #0f2347;
        outline: none;
        transition: border-color 0.15s;
        width: 100%;
        box-sizing: border-box;
        font-family: 'DM Sans', sans-serif;
    }

    input:focus { border-color: #2563eb; }
    input::placeholder { color: #cbd5e1; }

    .type-picker {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
    }

    .type-btn {
        padding: 0.4rem 0.8rem;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        background: #f8fafc;
        color: #64748b;
        font-size: 0.78rem;
        cursor: pointer;
        transition: all 0.15s;
        font-family: 'DM Sans', sans-serif;
        font-weight: 600;
    }

    .type-btn:hover { background: #eff6ff; color: #2563eb; border-color: #bfdbfe; }

    .modal-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 1.5rem 1.5rem;
        gap: 0.5rem;
    }

    .btn-group { display: flex; gap: 0.5rem; }

    .btn-primary {
        background: #2563eb;
        border: none;
        color: white;
        padding: 0.55rem 1.2rem;
        border-radius: 10px;
        font-size: 0.83rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s;
        font-family: 'DM Sans', sans-serif;
    }

    .btn-primary:hover:not(:disabled) { background: #1d4ed8; }
    .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

    .btn-ghost {
        background: #f1f5f9;
        border: 1px solid #e2e8f0;
        color: #64748b;
        padding: 0.55rem 1rem;
        border-radius: 10px;
        font-size: 0.83rem;
        cursor: pointer;
        transition: background 0.15s;
        font-family: 'DM Sans', sans-serif;
    }

    .btn-ghost:hover { background: #e2e8f0; }

    .btn-danger {
        background: none;
        border: none;
        color: #ef4444;
        font-size: 0.8rem;
        cursor: pointer;
        padding: 0;
        font-family: 'DM Sans', sans-serif;
    }

    .btn-danger:hover { opacity: 0.7; }
</style>