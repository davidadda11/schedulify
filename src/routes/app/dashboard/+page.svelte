<script>
  import { onMount } from 'svelte';

  let mounted = $state(false);
  let coins = $state(25);

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

    <main class="main-content">
      <header class="top-header">
        <h2>Salut! Săptămâna ta arată excelent.</h2>
        <p>Ai 3 task-uri noi pentru astăzi.</p>
      </header>

      <div class="bento-grid">
        <div class="bento-card tall-card">
          <div class="card-header">
            <h3>Task-uri viitoare</h3>
            <span class="badge">3 active</span>
          </div>
          <div class="card-body">
            <label class="task-item"><input type="checkbox" /> Citește capitolul 4 la Istorie</label>
            <label class="task-item"><input type="checkbox" /> Exercițiile 1-5 la Mate</label>
            <label class="task-item"><input type="checkbox" /> Trimite eseul la Engleză</label>
          </div>
        </div>

        <div class="bento-card wide-card">
          <div class="card-header">
            <h3>Orarul de azi</h3>
          </div>
          <div class="card-body timeline-flex">
            <div class="timeline-item"><span class="time">08:00</span><div class="subject">Matematică</div></div>
            <div class="timeline-item"><span class="time">09:00</span><div class="subject">Fizică</div></div>
            <div class="timeline-item"><span class="time">10:00</span><div class="subject">Informatică</div></div>
            <div class="timeline-item active"><span class="time">11:00</span><div class="subject">Pauză Mare</div></div>
          </div>
        </div>

        <div class="bento-card">
          <div class="card-header">
            <h3>Teme viitoare</h3>
          </div>
          <div class="card-body">
            <p class="placeholder-text">Geografie - Proiect (Vineri)</p>
          </div>
        </div>

        <div class="bento-card">
          <div class="card-header">
            <h3>Teste viitoare</h3>
          </div>
          <div class="card-body">
            <p class="placeholder-text highlight">Test Info - Luni</p>
          </div>
        </div>

        <div class="bento-card wide-card">
          <div class="card-header">
            <h3>Calendar Mini</h3>
          </div>
          <div class="card-body calendar-grid">
            {#each ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as day}
              <div class="cal-day-header">{day}</div>
            {/each}
            {#each Array(14) as _, i}
              <div class="cal-day" class:active={i === 4}>{i + 1}</div>
            {/each}
          </div>
        </div>
      </div>
    </main>
  </div>


<style>
  :global(*, *::before, *::after) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  :global(body) {
    overflow: hidden;
  }

  .page {
    --blue-950: #0a1628;
    --blue-900: #0f2347;
    --blue-800: #1a3a6b;
    --blue-600: #2563eb;
    --blue-500: #3b82f6;
    --blue-400: #60a5fa;
    --blue-200: #bfdbfe;
    --white: #ffffff;

    font-family: 'DM Sans', sans-serif;
    height: 100vh;
    width: 100vw;
    background: var(--blue-950);
    position: relative;
    overflow: hidden;
  }

  .bg-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
  }

  .blob-1 { width: 600px; height: 600px; background: radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 70%); top: -100px; left: -100px; animation: blobFloat 9s ease-in-out infinite; }
  .blob-2 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(96,165,250,0.15) 0%, transparent 70%); bottom: -100px; right: 10%; animation: blobFloat 12s ease-in-out infinite reverse; }
  .blob-3 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%); top: 40%; left: 40%; animation: blobFloat 7s ease-in-out infinite 3s; }

  .grid-overlay {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(rgba(96,165,250,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.04) 1px, transparent 1px);
    background-size: 60px 60px;
    pointer-events: none;
  }

  @keyframes blobFloat {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(30px, -20px) scale(1.05); }
    66% { transform: translate(-15px, 15px) scale(0.97); }
  }

  .dashboard-layout {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: 260px 1fr;
    height: 100%;
    gap: 32px;
    padding: 24px;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .page.mounted .dashboard-layout {
    opacity: 1;
    transform: translateY(0);
  }

  .card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 24px;
    box-shadow: 0 0 0 1px rgba(37,99,235,0.1), 0 16px 40px rgba(10, 22, 40, 0.4);
    backdrop-filter: blur(20px);
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    padding: 32px 24px;
    height: 100%;
  }

  .branding {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 40px;
    color: var(--blue-600);
  }

  .logo-mark { width: 36px; height: 36px; }

  .brand-title {
    font-family: 'Syne', sans-serif;
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -1px;
    background: linear-gradient(135deg, var(--blue-950) 0%, var(--blue-600) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .menu {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    border: none;
    background: transparent;
    border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 600;
    color: #64748b;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
  }

  .menu-item:hover {
    background: #eff6ff;
    color: var(--blue-600);
  }

  .menu-item.active {
    background: var(--blue-600);
    color: white;
  }

  .sidebar-footer {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .coin-badge {
    background: #fffbeb;
    color: #d97706;
    padding: 12px 16px;
    border-radius: 12px;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid #fde68a;
  }

  .account-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 12px;
    background: #eff6ff;
    color: var(--blue-950);
    font-weight: 600;
    cursor: pointer;
  }

  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--blue-400), var(--blue-600));
  }

  .main-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
    height: 100%;
    overflow-y: auto;
    padding-right: 12px;
  }

  .main-content::-webkit-scrollbar { width: 6px; }
  .main-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }

  .top-header { color: white; }

  .top-header h2 {
    font-family: 'Syne', sans-serif;
    font-size: 32px;
    margin-bottom: 4px;
  }

  .top-header p { color: var(--blue-200); font-size: 16px; }

  .bento-grid {
    display: grid;
    grid-template-columns: 300px 1fr 1fr;
    grid-auto-rows: minmax(180px, auto);
    gap: 24px;
    flex: 1;
  }

  .bento-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 24px;
    padding: 24px;
    box-shadow: 0 4px 24px rgba(10, 22, 40, 0.2);
    display: flex;
    flex-direction: column;
    transition: transform 0.3s ease;
  }

  .bento-card:hover { transform: translateY(-4px); }
  .tall-card { grid-row: span 3; }
  .wide-card { grid-column: span 2; }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .card-header h3 {
    font-family: 'Syne', sans-serif;
    font-size: 18px;
    color: var(--blue-950);
  }

  .badge {
    background: #dbeafe;
    color: var(--blue-600);
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
  }

  .card-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .task-item {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 15px;
    color: #475569;
    padding: 12px;
    background: #f8fafc;
    border-radius: 12px;
    cursor: pointer;
  }

  .task-item input { width: 18px; height: 18px; accent-color: var(--blue-600); }

  .timeline-flex {
    flex-direction: row;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
  }

  .timeline-item {
    text-align: center;
    background: #f8fafc;
    padding: 16px;
    border-radius: 16px;
    flex: 1;
  }

  .timeline-item.active { background: var(--blue-600); color: white; }
  .timeline-item .time { display: block; font-size: 12px; opacity: 0.8; margin-bottom: 4px; font-weight: 600; }
  .timeline-item .subject { font-weight: 700; font-size: 15px; }

  .placeholder-text {
    font-size: 15px;
    color: #475569;
    padding: 16px;
    border: 2px dashed #cbd5e1;
    border-radius: 12px;
    text-align: center;
  }

  .highlight { border-color: #ef4444; color: #ef4444; background: #fef2f2; }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;
    text-align: center;
  }

  .cal-day-header { font-size: 12px; font-weight: 700; color: #94a3b8; }
  .cal-day { padding: 8px; font-size: 14px; color: var(--blue-950); border-radius: 8px; cursor: pointer; }
  .cal-day:hover { background: #eff6ff; }
  .cal-day.active { background: var(--blue-600); color: white; font-weight: bold; }

  @media (max-width: 1024px) {
    .dashboard-layout { grid-template-columns: 1fr; }
    .sidebar { flex-direction: row; height: auto; padding: 16px; align-items: center; justify-content: space-between; }
    .menu { flex-direction: row; }
    .sidebar-footer { flex-direction: row; }
    .bento-grid { grid-template-columns: 1fr; }
    .tall-card, .wide-card { grid-column: auto; grid-row: auto; }
    .timeline-flex { flex-direction: column; }
    :global(body) { overflow: auto; }
  }
</style>