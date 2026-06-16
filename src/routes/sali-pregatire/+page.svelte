<script lang="ts">
  import { onMount } from 'svelte';

  let mounted = $state(false);

  onMount(() => {
    setTimeout(() => { mounted = true; }, 100);
  });

  const cards = [
    {
      title: 'Întrebări pregătitoare',
      description: 'Generează întrebări personalizate pentru lecțiile și testele tale, ca să verifici rapid ce ai înțeles.',
      buttonLabel: 'Începe pregătirea',
      href: '/sali-pregatire/intrebari-pregatitoare',
      icon: '❓',
    },
    {
      title: 'Creare program',
      description: 'Construiește un program de învățare organizat în funcție de materii, deadline-uri și timpul disponibil.',
      buttonLabel: 'Creează program',
      href: '/sali-pregatire/creare-program',
      icon: '📅',
    },
    {
      title: 'Analiză test',
      description: 'Încarcă sau introdu rezultatele unui test, iar aplicația îți arată ce ai greșit și ce trebuie să repeți.',
      buttonLabel: 'Analizează testul',
      href: '/sali-pregatire/analiza-test',
      icon: '📊',
    },
    {
      title: 'Analiză temă',
      description: 'Primește feedback pentru tema ta, verifică structura, greșelile și zonele unde poți îmbunătăți răspunsul.',
      buttonLabel: 'Analizează tema',
      href: '/sali-pregatire/analiza-tema',
      icon: '📝',
    },
  ];
</script>

<div class="page" class:mounted>
  <div class="bg-blob blob-1"></div>
  <div class="bg-blob blob-2"></div>
  <div class="bg-blob blob-3"></div>
  <div class="grid-overlay"></div>

  <main class="main-content">
    <header class="top-header">
      <a href="/app/dashboard" class="back-link">← Înapoi la dashboard</a>
      <h2>Săli de pregătire</h2>
      <p>Alege instrumentul de care ai nevoie pentru a te pregăti mai eficient.</p>
    </header>

    <div class="bento-grid">
      {#each cards as card}
        <div class="bento-card">
          <div class="card-icon">{card.icon}</div>
          <h3>{card.title}</h3>
          <p class="card-desc">{card.description}</p>
          <a href={card.href} class="action-btn">
            {card.buttonLabel} <span class="btn-arrow">→</span>
          </a>
        </div>
      {/each}
    </div>
  </main>
</div>

<style>
  .page {
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
    width: 100%;
    background: var(--bg-base, #0a1628);
    position: relative;
    opacity: 0;
    transform: translateY(16px);
    transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1);
  }
  .page.mounted { opacity: 1; transform: translateY(0); }

  /* Light mode */
  :global([data-theme="light"]) .page { background: #f0f4f8; }
  :global([data-theme="light"]) .top-header h2 { color: #0f172a; }
  :global([data-theme="light"]) .top-header p  { color: #475569; }
  :global([data-theme="light"]) .back-link      { color: #2563eb; }
  :global([data-theme="light"]) .back-link:hover { color: #0f172a; }
  :global([data-theme="light"]) .bento-card {
    background: #ffffff;
    box-shadow: 0 2px 16px rgba(10,22,40,0.08), 0 0 0 1px rgba(37,99,235,0.07);
  }
  :global([data-theme="light"]) .bento-card:hover {
    box-shadow: 0 8px 32px rgba(10,22,40,0.14), 0 0 0 1px rgba(37,99,235,0.12);
  }
  :global([data-theme="light"]) .bento-card h3   { color: #0f172a; }
  :global([data-theme="light"]) .card-desc        { color: #475569; }
  :global([data-theme="light"]) .grid-overlay {
    background-image:
      linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px);
  }

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
    position: fixed; inset: 0;
    background-image: linear-gradient(rgba(96,165,250,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.04) 1px, transparent 1px);
    background-size: 60px 60px; pointer-events: none; z-index: 0;
  }

  .main-content { position: relative; z-index: 1; max-width: 1100px; margin: 0 auto; padding: 48px 32px 64px; display: flex; flex-direction: column; gap: 40px; }

  .top-header { display: flex; flex-direction: column; gap: 8px; }
  .top-header h2 { font-family: 'Syne', sans-serif; font-size: 38px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.1; color: white; margin: 0; }
  .top-header p  { color: #bfdbfe; font-size: 17px; margin: 0; }

  .back-link { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 500; color: #60a5fa; text-decoration: none; margin-bottom: 8px; transition: color 0.2s; width: fit-content; }
  .back-link:hover { color: white; }

  .bento-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 24px; }

  .bento-card {
    background: rgba(255,255,255,0.95);
    border-radius: 24px;
    padding: 32px;
    box-shadow: 0 4px 24px rgba(10,22,40,0.25), 0 0 0 1px rgba(37,99,235,0.08);
    display: flex; flex-direction: column; gap: 16px;
    transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
  }
  .bento-card:hover { transform: translateY(-6px); box-shadow: 0 16px 40px rgba(10,22,40,0.35), 0 0 0 1px rgba(37,99,235,0.15); }

  .card-icon { font-size: 36px; line-height: 1; }
  .bento-card h3 { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: #0a1628; margin: 0; }
  .card-desc { font-size: 15px; color: #475569; line-height: 1.6; flex: 1; margin: 0; }

  .action-btn { display: inline-flex; align-items: center; gap: 8px; background: #2563eb; color: white; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600; padding: 12px 22px; border-radius: 14px; text-decoration: none; transition: background 0.2s, transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s; margin-top: 8px; }
  .action-btn:hover { background: #3b82f6; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.35); }
  .btn-arrow { transition: transform 0.2s; }
  .action-btn:hover .btn-arrow { transform: translateX(3px); }

  @media (max-width: 768px) {
    .main-content { padding: 32px 20px 48px; }
    .top-header h2 { font-size: 28px; }
    .bento-grid { grid-template-columns: 1fr; }
  }
</style>