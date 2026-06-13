<script lang="ts">
  import { onMount } from 'svelte';
 
  let mounted = $state(false);
  onMount(() => setTimeout(() => { mounted = true; }, 100));
 
  let materie = $state('');
  let observatii = $state('');
  let loading = $state(false);
  let eroare = $state('');
 
  // Upload
  let fisierImagine = $state<File | null>(null);
  let previewUrl = $state<string | null>(null);
  let dragOver = $state(false);
 
  type Analiza = {
    nota_estimata: string;
    mesaj: string;
    culoare: string;
    ce_a_vazut: string;
    puncteTari: string[];
    puncteSlabe: string[];
    recomandari: string[];
    capitoleRepetare: string[];
  };
  let analiza = $state<Analiza | null>(null);
 
  function handleFisier(file: File) {
    if (!file.type.startsWith('image/')) {
      eroare = 'Te rog încarcă o imagine (JPG, PNG, WEBP).';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      eroare = 'Imaginea este prea mare (max 10MB).';
      return;
    }
    eroare = '';
    fisierImagine = file;
    previewUrl = URL.createObjectURL(file);
    analiza = null;
  }
 
  function onInputChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.[0]) handleFisier(input.files[0]);
  }
 
  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    if (e.dataTransfer?.files?.[0]) handleFisier(e.dataTransfer.files[0]);
  }
 
  function eliminaImagine() {
    fisierImagine = null;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    analiza = null;
    eroare = '';
  }
 
  async function analizeaza() {
    if (!fisierImagine) return;
    loading = true;
    analiza = null;
    eroare = '';
 
    try {
      const fd = new FormData();
      fd.append('imagine', fisierImagine);
      fd.append('materie', materie);
      fd.append('observatii', observatii);
 
      const res = await fetch('/api/analiza-test', { method: 'POST', body: fd });
      const data = await res.json();
 
      if (data.error) {
        eroare = data.error;
      } else {
        analiza = data.analiza;
      }
    } catch (e) {
      eroare = 'Eroare de conexiune. Verifică că serverul rulează.';
    } finally {
      loading = false;
    }
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
      <h2>Analiză test</h2>
      <p>Încarcă o poză cu testul tău și primești o analiză detaliată.</p>
    </header>
 
    <div class="bento-card">
      <div class="card-header">
        <h3>Încarcă testul</h3>
        <span class="badge">AI Vision</span>
      </div>
      <div class="card-body">
 
        <!-- Upload zone -->
        {#if !previewUrl}
          <label
            class="upload-zone"
            class:drag-over={dragOver}
            ondragover={(e) => { e.preventDefault(); dragOver = true; }}
            ondragleave={() => dragOver = false}
            ondrop={onDrop}
          >
            <input type="file" accept="image/*" class="upload-input" onchange={onInputChange} />
            <div class="upload-icon">📷</div>
            <div class="upload-text">
              <strong>Trage poza aici sau apasă să selectezi</strong>
              <span>JPG, PNG, WEBP — max 10MB</span>
            </div>
          </label>
        {:else}
          <div class="preview-wrap">
            <img src={previewUrl} alt="Test încărcat" class="preview-img" />
            <button class="preview-remove" onclick={eliminaImagine} title="Șterge imaginea">✕</button>
            <div class="preview-label">
              <span class="preview-icon">✅</span>
              <span>{fisierImagine?.name}</span>
            </div>
          </div>
        {/if}
 
        {#if eroare}
          <div class="eroare-box">{eroare}</div>
        {/if}
 
        <!-- Câmpuri opționale -->
        <div class="form-grid">
          <div class="field">
            <label for="materie">Materie (opțional)</label>
            <input id="materie" type="text" placeholder="ex: Matematică, Fizică…" bind:value={materie} />
          </div>
          <div class="field">
            <label for="obs">Observații (opțional)</label>
            <input id="obs" type="text" placeholder="ex: Am greșit la fracții" bind:value={observatii} />
          </div>
        </div>
 
        <button class="action-btn" onclick={analizeaza} disabled={!fisierImagine || loading}>
          {#if loading}
            <span class="spinner"></span> Se analizează… (poate dura 30-60s)
          {:else}
            📊 Analizează testul
          {/if}
        </button>
 
        {#if loading}
          <div class="loading-hint">
            <span class="loading-dot"></span>
            moondream scanează imaginea → qwen generează feedback…
          </div>
        {/if}
      </div>
    </div>
 
    {#if analiza}
      <div class="analiza-wrapper">
 
        <!-- Scor + ce a văzut AI-ul -->
        <div class="scor-card">
          <div class="scor-circle" style="border-color: {analiza.culoare}; color: {analiza.culoare}">
            {analiza.nota_estimata}
          </div>
          <div class="scor-info">
            {#if materie}<div class="scor-materie">{materie}</div>{/if}
            <p class="scor-mesaj">{analiza.mesaj}</p>
            <div class="ce-a-vazut">
              <span class="ce-icon">🔍</span>
              <span>{analiza.ce_a_vazut}</span>
            </div>
          </div>
        </div>
 
        <div class="results-grid">
          <!-- Puncte tari -->
          <div class="result-card tip-verde">
            <div class="result-header">
              <span class="result-icon">✅</span>
              <h4>Puncte forte</h4>
            </div>
            <ul class="result-list">
              {#each analiza.puncteTari as p}
                <li>{p}</li>
              {/each}
            </ul>
          </div>
 
          <!-- Puncte slabe -->
          <div class="result-card tip-rosu">
            <div class="result-header">
              <span class="result-icon">⚠️</span>
              <h4>Puncte slabe</h4>
            </div>
            <ul class="result-list">
              {#each analiza.puncteSlabe as p}
                <li>{p}</li>
              {/each}
            </ul>
          </div>
 
          <!-- Recomandări -->
          <div class="result-card tip-albastru">
            <div class="result-header">
              <span class="result-icon">💡</span>
              <h4>Recomandări</h4>
            </div>
            <ul class="result-list">
              {#each analiza.recomandari as r}
                <li>{r}</li>
              {/each}
            </ul>
          </div>
 
          <!-- Capitole -->
          <div class="result-card tip-galben">
            <div class="result-header">
              <span class="result-icon">📚</span>
              <h4>Capitole de repetat</h4>
            </div>
            <div class="badges-list">
              {#each analiza.capitoleRepetare as c}
                <span class="chip">{c}</span>
              {/each}
            </div>
          </div>
        </div>
 
        <!-- Buton re-analiză -->
        <button class="secondary-btn" onclick={eliminaImagine}>
          ↩ Încarcă alt test
        </button>
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
 
  .grid-overlay { position: fixed; inset: 0; z-index: 0; pointer-events: none; background-image: linear-gradient(rgba(96,165,250,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(96,165,250,0.04) 1px,transparent 1px); background-size: 60px 60px; }
 
  .main-content { position: relative; z-index: 1; max-width: 900px; margin: 0 auto; padding: 48px 32px 64px; display: flex; flex-direction: column; gap: 32px; }
 
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
 
  /* Upload zone */
  .upload-zone {
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
    border: 2px dashed #cbd5e1; border-radius: 16px; padding: 40px 24px;
    cursor: pointer; transition: border-color 0.2s, background 0.2s;
    background: #f8fafc; position: relative;
  }
  .upload-zone:hover, .upload-zone.drag-over { border-color: var(--blue-500); background: #eff6ff; }
  .upload-input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
  .upload-icon { font-size: 40px; line-height: 1; }
  .upload-text { display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; }
  .upload-text strong { font-size: 15px; color: #1e293b; }
  .upload-text span { font-size: 13px; color: #94a3b8; }
 
  /* Preview */
  .preview-wrap { position: relative; border-radius: 16px; overflow: hidden; border: 2px solid #e2e8f0; background: #f8fafc; }
  .preview-img { width: 100%; max-height: 360px; object-fit: contain; display: block; }
  .preview-remove { position: absolute; top: 10px; right: 10px; background: rgba(15,35,71,0.8); color: white; border: none; border-radius: 50%; width: 32px; height: 32px; cursor: pointer; font-size: 14px; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
  .preview-remove:hover { background: #ef4444; }
  .preview-label { display: flex; align-items: center; gap: 8px; padding: 10px 14px; font-size: 13px; color: #475569; background: white; border-top: 1px solid #e2e8f0; }
  .preview-icon { font-size: 16px; }
 
  .eroare-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 12px 16px; color: #dc2626; font-size: 14px; }
 
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .field { display: flex; flex-direction: column; gap: 8px; }
  .field label { font-size: 13px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
  .field input { padding: 12px 16px; border: 2px solid #e2e8f0; border-radius: 12px; font-family: 'DM Sans', sans-serif; font-size: 15px; color: var(--blue-950); background: #f8fafc; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
  .field input:focus { border-color: var(--blue-500); box-shadow: 0 0 0 3px rgba(59,130,246,0.15); background: white; }
 
  .action-btn { display: inline-flex; align-items: center; gap: 10px; background: var(--blue-600); color: white; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 600; padding: 14px 28px; border-radius: 14px; border: none; cursor: pointer; align-self: flex-start; transition: background 0.2s, transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s; }
  .action-btn:hover:not(:disabled) { background: var(--blue-500); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(37,99,235,0.35); }
  .action-btn:disabled { opacity: 0.55; cursor: not-allowed; }
 
  .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
  @keyframes spin { to { transform: rotate(360deg); } }
 
  .loading-hint { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b; }
  .loading-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--blue-500); animation: pulse 1.2s ease-in-out infinite; flex-shrink: 0; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
 
  /* Analiza */
  .analiza-wrapper { display: flex; flex-direction: column; gap: 24px; animation: fadeUp 0.5s cubic-bezier(0.16,1,0.3,1); }
  @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
 
  .scor-card { background: rgba(255,255,255,0.95); border-radius: 24px; padding: 28px 32px; box-shadow: 0 4px 24px rgba(10,22,40,0.2); display: flex; align-items: flex-start; gap: 28px; }
  .scor-circle { min-width: 90px; height: 90px; border-radius: 50%; border: 4px solid; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; flex-shrink: 0; text-align: center; padding: 4px; }
  .scor-info { display: flex; flex-direction: column; gap: 8px; }
  .scor-materie { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; color: var(--blue-950); }
  .scor-mesaj { font-size: 15px; color: #475569; line-height: 1.5; }
  .ce-a-vazut { display: flex; align-items: flex-start; gap: 8px; background: #f1f5f9; border-radius: 10px; padding: 10px 14px; font-size: 13px; color: #475569; line-height: 1.5; margin-top: 4px; }
  .ce-icon { flex-shrink: 0; font-size: 15px; }
 
  .results-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .result-card { background: rgba(255,255,255,0.95); border-radius: 20px; padding: 24px; box-shadow: 0 4px 16px rgba(10,22,40,0.15); display: flex; flex-direction: column; gap: 16px; border-left: 4px solid transparent; }
  .tip-verde  { border-left-color: #22c55e; }
  .tip-rosu   { border-left-color: #ef4444; }
  .tip-albastru { border-left-color: var(--blue-600); }
  .tip-galben { border-left-color: #eab308; }
 
  .result-header { display: flex; align-items: center; gap: 10px; }
  .result-icon { font-size: 20px; }
  .result-header h4 { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: var(--blue-950); }
 
  .result-list { list-style: none; display: flex; flex-direction: column; gap: 8px; padding: 0; }
  .result-list li { font-size: 14px; color: #475569; padding-left: 14px; position: relative; line-height: 1.5; }
  .result-list li::before { content: '—'; position: absolute; left: 0; color: #94a3b8; }
 
  .badges-list { display: flex; flex-wrap: wrap; gap: 8px; }
  .chip { background: #fef9c3; color: #854d0e; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; border: 1px solid #fde047; }
 
  .secondary-btn { display: inline-flex; align-items: center; gap: 8px; background: transparent; color: var(--blue-400); font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; padding: 10px 20px; border-radius: 12px; border: 2px solid rgba(96,165,250,0.3); cursor: pointer; align-self: flex-start; transition: border-color 0.2s, color 0.2s; }
  .secondary-btn:hover { border-color: var(--blue-400); color: white; }
 
  @media (max-width: 768px) {
    .main-content { padding: 32px 20px 48px; }
    .top-header h2 { font-size: 26px; }
    .form-grid { grid-template-columns: 1fr; }
    .results-grid { grid-template-columns: 1fr; }
    .scor-card { flex-direction: column; }
  }
</style>
 