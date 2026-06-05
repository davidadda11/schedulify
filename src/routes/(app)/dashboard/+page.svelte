<!-- src/routes/(app)/dashboard/+page.svelte -->
<!-- Dashboard — subject cards, stats, today's schedule        -->

<script lang="ts">
  import { onMount } from 'svelte';
  import gsap from 'gsap';
  import CourseCard from '$components/CourseCard.svelte';

  let { data } = $props();

  // ── Mock data (replace with DB queries) ──────────────────
  const subjects = [
    { id: '1', userId: '1', name: 'Matematică',   colorHex: '#6366f1', icon: '∑', hoursPerWeek: 4, priority: 5, edu24Id: null, createdAt: new Date() },
    { id: '2', userId: '1', name: 'Fizică',       colorHex: '#22d3ee', icon: '⚛', hoursPerWeek: 3, priority: 4, edu24Id: null, createdAt: new Date() },
    { id: '3', userId: '1', name: 'Română',       colorHex: '#f43f5e', icon: '✍', hoursPerWeek: 2, priority: 3, edu24Id: null, createdAt: new Date() },
    { id: '4', userId: '1', name: 'Informatică',  colorHex: '#10b981', icon: '⌨', hoursPerWeek: 3, priority: 4, edu24Id: null, createdAt: new Date() },
    { id: '5', userId: '1', name: 'Biologie',     colorHex: '#f59e0b', icon: '🧬', hoursPerWeek: 2, priority: 2, edu24Id: null, createdAt: new Date() },
  ];

  const progresses = [72, 45, 88, 61, 33];
  const taskCounts = [3, 1, 0, 2, 4];

  // ── Today's schedule (mock) ───────────────────────────────
  const todayBlocks = [
    { time: '08:00 – 09:50', label: 'Matematică',  type: 'school', color: '#6366f1' },
    { time: '10:00 – 10:25', label: 'Pomodoro #1', type: 'study',  color: '#22d3ee' },
    { time: '14:00 – 16:00', label: 'Informatică', type: 'school', color: '#10b981' },
    { time: '17:00 – 18:30', label: 'Studiu Fizică', type: 'study', color: '#22d3ee' },
  ];

  // ── Stats ─────────────────────────────────────────────────
  const stats = [
    { label: 'Ore studiate azi',  value: '3.5h', delta: '+0.5h', up: true  },
    { label: 'Streak activ',      value: '7 zile', delta: 'record!', up: true  },
    { label: 'Teme restante',     value: '5',   delta: '-2',     up: true  },
    { label: 'Medie generală',    value: '9.2', delta: '+0.3',   up: true  },
  ];

  // ── Entrance animation ────────────────────────────────────
  onMount(() => {
    gsap.fromTo(
      '.dash-stat',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'expo.out', delay: 0.2 }
    );
    gsap.fromTo(
      '.course-card-wrap',
      { opacity: 0, y: 30, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.1, ease: 'expo.out', delay: 0.4 }
    );
  });
</script>

<svelte:head>
  <title>Dashboard — StudyFlow</title>
</svelte:head>

<div class="dashboard">

  <!-- Header -->
  <header class="dash-header">
    <div>
      <p class="dash-greeting">Bună ziua, {data?.user?.name?.split(' ')[0] ?? 'elev'} 👋</p>
      <h1 class="dash-title">Dashboard</h1>
    </div>
    <div class="dash-date">
      <span>{new Date().toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
    </div>
  </header>

  <!-- Stats row -->
  <div class="stats-grid">
    {#each stats as stat}
      <div class="dash-stat glass glass-hover">
        <p class="stat-value">{stat.value}</p>
        <p class="stat-label">{stat.label}</p>
        <span class="stat-delta" class:up={stat.up}>{stat.delta}</span>
      </div>
    {/each}
  </div>

  <!-- Two column layout -->
  <div class="dash-body">

    <!-- Subjects column -->
    <section class="subjects-section" aria-label="Materiile mele">
      <div class="section-header">
        <h2 class="section-title">Materiile mele</h2>
        <a href="/subjects/new" class="section-action">+ Adaugă</a>
      </div>

      <div class="cards-grid">
        {#each subjects as subject, i}
          <div class="course-card-wrap">
            <CourseCard
              {subject}
              progress={progresses[i]}
              tasksCount={taskCounts[i]}
              nextSession={new Date(Date.now() + (i+1) * 3_600_000).toISOString()}
              onStart={() => console.log('Start study:', subject.name)}
              onDetails={() => console.log('Details:', subject.name)}
            />
          </div>
        {/each}
      </div>
    </section>

    <!-- Right column: today's schedule -->
    <aside class="today-section">
      <div class="section-header">
        <h2 class="section-title">Programul de azi</h2>
        <a href="/calendar" class="section-action">Complet →</a>
      </div>

      <div class="today-list">
        {#each todayBlocks as block, i}
          <div
            class="today-block"
            class:school={block.type === 'school'}
            class:study={block.type === 'study'}
            style="--block-color: {block.color}; animation-delay: {i * 0.07}s"
          >
            <div class="block-dot" style="background: {block.color};"></div>
            <div class="block-info">
              <p class="block-label">{block.label}</p>
              <p class="block-time">{block.time}</p>
            </div>
            <span class="block-type-badge">{block.type === 'school' ? 'Școală' : 'Studiu'}</span>
          </div>
        {/each}
      </div>

      <!-- Quick start pomodoro -->
      <div class="quick-pomodoro glass glass-hover">
        <div class="pomodoro-icon">⏱</div>
        <div>
          <p class="pomodoro-title">Pornește Pomodoro</p>
          <p class="pomodoro-desc">25 min focus • 5 min pauză</p>
        </div>
        <button class="pomodoro-btn" aria-label="Pornește timer">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 4.5l6 3.5-6 3.5V4.5Z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </aside>
  </div>
</div>

<style>
  .dashboard {
    max-width: 1200px;
    padding-bottom: 3rem;
  }

  /* Header */
  .dash-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 2rem;
  }

  .dash-greeting {
    font-size: 0.9rem;
    color: rgba(255,255,255,0.4);
    margin: 0 0 0.2rem;
  }

  .dash-title {
    font-family: var(--font-display);
    font-size: 2rem;
    font-weight: 800;
    margin: 0;
    letter-spacing: -0.03em;
  }

  .dash-date {
    font-size: 0.82rem;
    color: rgba(255,255,255,0.35);
    text-transform: capitalize;
  }

  /* Stats */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .dash-stat {
    border-radius: var(--radius-lg);
    padding: 1.2rem;
    position: relative;
    overflow: hidden;
    opacity: 0;
  }

  .stat-value {
    font-family: var(--font-display);
    font-size: 1.8rem;
    font-weight: 800;
    margin: 0 0 0.2rem;
    color: rgba(255,255,255,0.92);
    letter-spacing: -0.03em;
  }

  .stat-label {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.4);
    margin: 0 0 0.5rem;
  }

  .stat-delta {
    font-size: 0.72rem;
    padding: 0.15rem 0.5rem;
    border-radius: 100px;
    background: rgba(244,63,94,0.1);
    color: var(--accent-rose);
    border: 1px solid rgba(244,63,94,0.15);
  }

  .stat-delta.up {
    background: rgba(16,185,129,0.1);
    color: var(--accent-emerald);
    border-color: rgba(16,185,129,0.2);
  }

  /* Body layout */
  .dash-body {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 2rem;
    align-items: start;
  }

  /* Section header */
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.2rem;
  }

  .section-title {
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0;
    color: rgba(255,255,255,0.85);
  }

  .section-action {
    font-size: 0.78rem;
    color: var(--accent-violet);
    text-decoration: none;
    transition: color 0.2s;
  }

  .section-action:hover {
    color: var(--accent-cyan);
  }

  /* Cards grid */
  .cards-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 1.2rem;
  }

  .course-card-wrap {
    opacity: 0;
  }

  /* Today's schedule */
  .today-list {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    margin-bottom: 1.2rem;
  }

  .today-block {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.8rem;
    border-radius: var(--radius-md);
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-left: 3px solid var(--block-color);
    animation: blockIn 0.4s ease-out both;
  }

  @keyframes blockIn {
    from { opacity: 0; transform: translateX(-10px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .block-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .block-info { flex: 1; }

  .block-label {
    font-size: 0.85rem;
    font-weight: 500;
    color: rgba(255,255,255,0.8);
    margin: 0 0 0.15rem;
  }

  .block-time {
    font-size: 0.72rem;
    color: rgba(255,255,255,0.35);
    margin: 0;
  }

  .block-type-badge {
    font-size: 0.65rem;
    padding: 0.15rem 0.5rem;
    border-radius: 100px;
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.3);
    border: 1px solid rgba(255,255,255,0.07);
    white-space: nowrap;
  }

  /* Pomodoro quick start */
  .quick-pomodoro {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 1rem;
    border-radius: var(--radius-md);
    cursor: pointer;
  }

  .pomodoro-icon {
    font-size: 1.4rem;
  }

  .pomodoro-title {
    font-size: 0.88rem;
    font-weight: 600;
    color: rgba(255,255,255,0.8);
    margin: 0 0 0.15rem;
  }

  .pomodoro-desc {
    font-size: 0.72rem;
    color: rgba(255,255,255,0.35);
    margin: 0;
  }

  .pomodoro-btn {
    margin-left: auto;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--accent-violet);
    border: none;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s var(--ease-spring), box-shadow 0.2s;
    flex-shrink: 0;
  }

  .pomodoro-btn:hover {
    transform: scale(1.12);
    box-shadow: 0 0 20px rgba(99,102,241,0.5);
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
    .dash-body  { grid-template-columns: 1fr; }
  }

  @media (max-width: 640px) {
    .stats-grid { grid-template-columns: repeat(2, 1fr); }
    .dash-header { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
  }
</style>