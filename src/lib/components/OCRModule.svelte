<!-- src/lib/components/OCRModule.svelte -->
<!-- OCR Module — drag & drop / camera / upload, Tesseract.js   -->
<!-- Svelte 5 runes + GSAP reveal + AI analysis integration     -->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import gsap from 'gsap';
  import { createWorker, type Worker as TesseractWorker } from 'tesseract.js';

  // ── Props ────────────────────────────────────────────────────
  interface Props {
    onTextExtracted?: (text: string) => void;
    onAnalysisReady?: (analysis: AIAnalysis) => void;
  }

  export interface AIAnalysis {
    subject:     string;
    mistakes:    Mistake[];
    suggestions: string[];
    difficulty:  'easy' | 'medium' | 'hard';
    score:       number;
  }

  interface Mistake {
    original:    string;
    correction:  string;
    explanation: string;
  }

  let { onTextExtracted, onAnalysisReady }: Props = $props();

  // ── State ─────────────────────────────────────────────────
  type Stage = 'idle' | 'loading_ocr' | 'ocr_done' | 'analyzing' | 'done' | 'error';

  let stage     = $state<Stage>('idle');
  let isDragOver = $state(false);
  let imageUrl   = $state<string | null>(null);
  let ocrText    = $state('');
  let ocrProgress = $state(0);
  let analysis   = $state<AIAnalysis | null>(null);
  let errorMsg   = $state('');

  // ── Refs ──────────────────────────────────────────────────
  let dropzoneEl: HTMLDivElement;
  let fileInputEl: HTMLInputElement;
  let worker: TesseractWorker | null = null;

  // ── Tesseract Worker init ─────────────────────────────────
  async function getWorker(): Promise<TesseractWorker> {
    if (worker) return worker;
    worker = await createWorker('ron+eng', 1, {  // Romanian + English
      logger: m => {
        if (m.status === 'recognizing text') {
          ocrProgress = Math.round(m.progress * 100);
        }
      }
    });
    return worker;
  }

  onDestroy(() => {
    worker?.terminate();
  });

  // ── File Processing ───────────────────────────────────────
  async function processFile(file: File) {
    if (!file.type.startsWith('image/')) {
      errorMsg = 'Te rugăm să încarci o imagine (JPG, PNG, WEBP).';
      stage = 'error';
      return;
    }

    // Preview
    imageUrl = URL.createObjectURL(file);
    stage    = 'loading_ocr';
    ocrProgress = 0;

    try {
      const w = await getWorker();
      const { data: { text } } = await w.recognize(file);

      ocrText = text.trim();
      stage   = 'ocr_done';
      ocrProgress = 100;
      onTextExtracted?.(ocrText);

      // Animate result in
      gsap.fromTo(
        '#ocr-result',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }
      );

      // Auto-trigger AI analysis
      await analyzeWithAI(ocrText);

    } catch (e) {
      errorMsg = `Eroare la scanare: ${(e as Error).message}`;
      stage = 'error';
    }
  }

  // ── AI Analysis via Anthropic API ────────────────────────
  async function analyzeWithAI(text: string) {
    stage = 'analyzing';

    try {
      const res = await fetch('/api/analyze-homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: AIAnalysis = await res.json();
      analysis = data;
      stage    = 'done';
      onAnalysisReady?.(data);

      gsap.fromTo(
        '#ai-analysis',
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', delay: 0.1 }
      );

    } catch (e) {
      // Analysis is optional — don't block on error
      console.error('AI analysis failed:', e);
      stage = 'ocr_done';
    }
  }

  // ── Drag & Drop ───────────────────────────────────────────
  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragOver = false;
    const file = e.dataTransfer?.files[0];
    if (file) processFile(file);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    isDragOver = true;
  }

  function handleDragLeave() {
    isDragOver = false;
  }

  function handleFileInput(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) processFile(file);
  }

  function handlePaste(e: ClipboardEvent) {
    const item = Array.from(e.clipboardData?.items ?? [])
      .find(i => i.type.startsWith('image/'));
    if (item) {
      const file = item.getAsFile();
      if (file) processFile(file);
    }
  }

  function reset() {
    stage       = 'idle';
    imageUrl    = null;
    ocrText     = '';
    analysis    = null;
    ocrProgress = 0;
    errorMsg    = '';
    if (fileInputEl) fileInputEl.value = '';
  }

  // ── Keyboard paste support ───────────────────────────────
  onMount(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  });
</script>

<section class="ocr-module" aria-label="Modul OCR Teme">

  <!-- Header -->
  <header class="ocr-header">
    <div class="ocr-icon">
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <rect x="2" y="3" width="13" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/>
        <path d="M6 7h5M6 10h8M6 13h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <circle cx="16" cy="16" r="4" fill="var(--accent-violet)"/>
        <path d="M14.5 16l1 1 2-2" stroke="white" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <div>
      <h2 class="ocr-title">Scanare Teme & Teste</h2>
      <p class="ocr-subtitle">Încarcă o poză, obții analiză AI instantă</p>
    </div>
    {#if stage !== 'idle'}
      <button class="reset-btn" onclick={reset} aria-label="Resetează">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2.5 8A5.5 5.5 0 1 1 8 13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M2.5 4.5v3.5H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    {/if}
  </header>

  <!-- ── IDLE: Dropzone ── -->
  {#if stage === 'idle'}
    <div
      class="dropzone"
      class:drag-active={isDragOver}
      bind:this={dropzoneEl}
      ondrop={handleDrop}
      ondragover={handleDragOver}
      ondragleave={handleDragLeave}
      role="button"
      tabindex="0"
      aria-label="Zonă de upload"
      onclick={() => fileInputEl.click()}
      onkeydown={e => e.key === 'Enter' && fileInputEl.click()}
    >
      <input
        type="file"
        accept="image/*"
        capture="environment"
        bind:this={fileInputEl}
        onchange={handleFileInput}
        class="sr-only"
        aria-hidden="true"
      />

      <div class="dropzone-icon" aria-hidden="true">
        {#if isDragOver}
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M20 8v16M13 15l7-7 7 7" stroke="var(--accent-violet)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 28h24" stroke="var(--accent-violet)" stroke-width="2" stroke-linecap="round"/>
          </svg>
        {:else}
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect x="6" y="8" width="28" height="22" rx="3" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 2"/>
            <circle cx="15" cy="17" r="3" stroke="currentColor" stroke-width="1.5"/>
            <path d="M6 26l8-6 6 4 5-5 9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        {/if}
      </div>

      <p class="dropzone-text">
        {isDragOver ? 'Lasă imaginea aici!' : 'Trage imaginea sau apasă pentru a selecta'}
      </p>
      <p class="dropzone-hint">JPG, PNG, WEBP • sau Ctrl+V pentru a lipi din clipboard</p>

      <div class="dropzone-actions">
        <span class="drop-chip">📂 Fișier</span>
        <span class="drop-chip">📸 Cameră</span>
        <span class="drop-chip">📋 Clipboard</span>
      </div>
    </div>
  {/if}

  <!-- ── LOADING / OCR ── -->
  {#if stage === 'loading_ocr'}
    <div class="ocr-processing">
      <div class="preview-wrap">
        <img src={imageUrl!} alt="Imagine încărcată" class="preview-img"/>
      </div>
      <div class="progress-section">
        <div class="progress-label-row">
          <span>Scanare text…</span>
          <span class="progress-pct">{ocrProgress}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: {ocrProgress}%;"></div>
        </div>
        <p class="progress-hint">Tesseract.js procesează imaginea în browser (privat)</p>
      </div>
    </div>
  {/if}

  <!-- ── OCR DONE + ANALYSIS ── -->
  {#if stage === 'ocr_done' || stage === 'analyzing' || stage === 'done'}
    <div class="results-layout">

      <!-- Image preview -->
      {#if imageUrl}
        <div class="result-preview">
          <img src={imageUrl} alt="Imagine scanată" class="preview-img-sm"/>
        </div>
      {/if}

      <!-- Extracted text -->
      <div id="ocr-result" class="result-panel">
        <div class="panel-header">
          <span class="panel-badge">OCR</span>
          <span class="panel-title">Text extras</span>
        </div>
        <pre class="ocr-text-output">{ocrText || 'Niciun text detectat.'}</pre>
      </div>

      <!-- AI Analysis -->
      {#if stage === 'analyzing'}
        <div class="analysis-loading">
          <div class="pulse-dots" aria-label="Se analizează cu AI...">
            <span></span><span></span><span></span>
          </div>
          <p>Analiza AI în curs…</p>
        </div>
      {/if}

      {#if analysis && stage === 'done'}
        <div id="ai-analysis" class="analysis-panel">
          <div class="panel-header">
            <span class="panel-badge ai-badge">AI</span>
            <span class="panel-title">Analiză greșeli</span>
            <span
              class="difficulty-chip"
              class:easy={analysis.difficulty === 'easy'}
              class:medium={analysis.difficulty === 'medium'}
              class:hard={analysis.difficulty === 'hard'}
            >
              {analysis.difficulty === 'easy' ? '🟢 Ușor' : analysis.difficulty === 'medium' ? '🟡 Mediu' : '🔴 Dificil'}
            </span>
          </div>

          <!-- Score -->
          <div class="score-display">
            <span class="score-num">{analysis.score}</span>
            <span class="score-den">/10</span>
          </div>

          <!-- Mistakes -->
          {#if analysis.mistakes.length > 0}
            <div class="mistakes-list">
              <h4 class="mistakes-title">Greșeli identificate</h4>
              {#each analysis.mistakes as mistake, i}
                <div class="mistake-item" style="--delay: {i * 0.08}s">
                  <div class="mistake-top">
                    <span class="mistake-wrong">✗ {mistake.original}</span>
                    <span class="mistake-arrow">→</span>
                    <span class="mistake-correct">✓ {mistake.correction}</span>
                  </div>
                  <p class="mistake-explanation">{mistake.explanation}</p>
                </div>
              {/each}
            </div>
          {/if}

          <!-- Suggestions -->
          {#if analysis.suggestions.length > 0}
            <div class="suggestions">
              <h4 class="suggestions-title">💡 Recomandări</h4>
              <ul>
                {#each analysis.suggestions as s}
                  <li>{s}</li>
                {/each}
              </ul>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}

  <!-- ── ERROR ── -->
  {#if stage === 'error'}
    <div class="error-state">
      <span class="error-icon">⚠</span>
      <p>{errorMsg}</p>
      <button class="reset-btn-full" onclick={reset}>Încearcă din nou</button>
    </div>
  {/if}
</section>

<style>
  .ocr-module {
    background: var(--bg-glass);
    border: 1px solid var(--border-glass);
    border-radius: var(--radius-xl);
    padding: 1.6rem;
    backdrop-filter: blur(20px);
  }

  /* Header */
  .ocr-header {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    margin-bottom: 1.4rem;
  }

  .ocr-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: rgba(99,102,241,0.12);
    border: 1px solid rgba(99,102,241,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--accent-violet);
    flex-shrink: 0;
  }

  .ocr-title {
    font-family: var(--font-display);
    font-size: 1.05rem;
    font-weight: 700;
    margin: 0 0 0.15rem;
    color: rgba(255,255,255,0.92);
  }

  .ocr-subtitle {
    font-size: 0.78rem;
    color: rgba(255,255,255,0.4);
    margin: 0;
  }

  .reset-btn {
    margin-left: auto;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.4);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .reset-btn:hover {
    background: rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.8);
  }

  /* Dropzone */
  .dropzone {
    border: 2px dashed rgba(255,255,255,0.1);
    border-radius: var(--radius-lg);
    padding: 2.5rem 1.5rem;
    text-align: center;
    cursor: pointer;
    transition:
      border-color 0.25s,
      background 0.25s,
      transform 0.2s var(--ease-spring);
  }

  .dropzone:hover,
  .dropzone.drag-active {
    border-color: var(--accent-violet);
    background: rgba(99,102,241,0.06);
    transform: scale(1.01);
  }

  .dropzone-icon {
    color: rgba(255,255,255,0.25);
    margin-bottom: 1rem;
    transition: color 0.25s;
  }

  .dropzone:hover .dropzone-icon,
  .dropzone.drag-active .dropzone-icon {
    color: var(--accent-violet);
  }

  .dropzone-text {
    font-size: 0.9rem;
    color: rgba(255,255,255,0.6);
    margin: 0 0 0.4rem;
    font-weight: 500;
  }

  .dropzone-hint {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.3);
    margin: 0 0 1.2rem;
  }

  .dropzone-actions {
    display: flex;
    justify-content: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .drop-chip {
    padding: 0.3rem 0.8rem;
    border-radius: 100px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    font-size: 0.75rem;
    color: rgba(255,255,255,0.45);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0,0,0,0);
  }

  /* Processing */
  .ocr-processing {
    display: flex;
    gap: 1.2rem;
    align-items: flex-start;
  }

  .preview-wrap {
    flex-shrink: 0;
    width: 100px;
  }

  .preview-img {
    width: 100%;
    border-radius: 10px;
    object-fit: cover;
    border: 1px solid rgba(255,255,255,0.1);
  }

  .progress-section {
    flex: 1;
  }

  .progress-label-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.82rem;
    color: rgba(255,255,255,0.6);
    margin-bottom: 0.6rem;
  }

  .progress-pct {
    color: var(--accent-cyan);
    font-weight: 600;
  }

  .progress-track {
    height: 4px;
    background: rgba(255,255,255,0.07);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 0.6rem;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent-violet), var(--accent-cyan));
    border-radius: 2px;
    transition: width 0.2s;
  }

  .progress-hint {
    font-size: 0.72rem;
    color: rgba(255,255,255,0.25);
    margin: 0;
  }

  /* Results */
  .results-layout {
    display: grid;
    gap: 1rem;
  }

  .result-preview .preview-img-sm {
    width: 100%;
    max-height: 200px;
    object-fit: contain;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.08);
  }

  .result-panel,
  .analysis-panel {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: var(--radius-md);
    padding: 1rem;
  }

  .panel-header {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 0.8rem;
  }

  .panel-badge {
    padding: 0.2rem 0.55rem;
    border-radius: 6px;
    background: rgba(99,102,241,0.15);
    border: 1px solid rgba(99,102,241,0.25);
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--accent-violet);
    text-transform: uppercase;
  }

  .ai-badge {
    background: rgba(34,211,238,0.12);
    border-color: rgba(34,211,238,0.25);
    color: var(--accent-cyan);
  }

  .panel-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: rgba(255,255,255,0.7);
  }

  .ocr-text-output {
    font-family: 'DM Mono', 'Fira Code', monospace;
    font-size: 0.78rem;
    line-height: 1.7;
    color: rgba(255,255,255,0.6);
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
    max-height: 180px;
    overflow-y: auto;
  }

  /* Score */
  .score-display {
    display: flex;
    align-items: baseline;
    gap: 0.2rem;
    margin-bottom: 1rem;
  }

  .score-num {
    font-family: var(--font-display);
    font-size: 2.5rem;
    font-weight: 800;
    color: var(--accent-cyan);
  }

  .score-den {
    font-size: 1rem;
    color: rgba(255,255,255,0.4);
  }

  /* Mistakes */
  .mistakes-title,
  .suggestions-title {
    font-size: 0.8rem;
    font-weight: 600;
    color: rgba(255,255,255,0.5);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 0 0 0.7rem;
  }

  .mistake-item {
    background: rgba(244,63,94,0.06);
    border: 1px solid rgba(244,63,94,0.15);
    border-radius: 10px;
    padding: 0.7rem;
    margin-bottom: 0.5rem;
    animation: fadeUp 0.4s ease-out var(--delay, 0s) both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .mistake-top {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 0.35rem;
  }

  .mistake-wrong {
    color: var(--accent-rose);
    font-size: 0.82rem;
    font-weight: 500;
    text-decoration: line-through;
    opacity: 0.8;
  }

  .mistake-arrow {
    color: rgba(255,255,255,0.3);
    font-size: 0.8rem;
  }

  .mistake-correct {
    color: var(--accent-emerald);
    font-size: 0.82rem;
    font-weight: 600;
  }

  .mistake-explanation {
    font-size: 0.75rem;
    color: rgba(255,255,255,0.45);
    margin: 0;
    line-height: 1.5;
  }

  /* Suggestions */
  .suggestions {
    margin-top: 0.8rem;
  }

  .suggestions ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .suggestions li {
    font-size: 0.8rem;
    color: rgba(255,255,255,0.6);
    padding-left: 1rem;
    position: relative;
    line-height: 1.5;
  }

  .suggestions li::before {
    content: '→';
    position: absolute;
    left: 0;
    color: var(--accent-cyan);
  }

  /* Difficulty chip */
  .difficulty-chip {
    margin-left: auto;
    font-size: 0.72rem;
    padding: 0.2rem 0.6rem;
    border-radius: 100px;
    border: 1px solid;
  }

  .difficulty-chip.easy   { border-color: rgba(16,185,129,0.3); background: rgba(16,185,129,0.08); color: #10b981; }
  .difficulty-chip.medium { border-color: rgba(245,158,11,0.3); background: rgba(245,158,11,0.08); color: #f59e0b; }
  .difficulty-chip.hard   { border-color: rgba(244,63,94,0.3);  background: rgba(244,63,94,0.08);  color: var(--accent-rose); }

  /* Analysis loading */
  .analysis-loading {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 1rem;
    color: rgba(255,255,255,0.4);
    font-size: 0.82rem;
  }

  .pulse-dots {
    display: flex;
    gap: 4px;
  }

  .pulse-dots span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent-violet);
    animation: dot-pulse 1.2s infinite ease-in-out;
  }

  .pulse-dots span:nth-child(2) { animation-delay: 0.2s; }
  .pulse-dots span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes dot-pulse {
    0%, 100% { transform: scale(0.6); opacity: 0.4; }
    50%       { transform: scale(1);   opacity: 1;   }
  }

  /* Error */
  .error-state {
    text-align: center;
    padding: 2rem;
    color: rgba(255,255,255,0.5);
  }

  .error-icon {
    font-size: 2rem;
    display: block;
    margin-bottom: 0.5rem;
    color: var(--accent-rose);
  }

  .reset-btn-full {
    margin-top: 1rem;
    padding: 0.5rem 1.5rem;
    border-radius: 8px;
    background: rgba(244,63,94,0.12);
    border: 1px solid rgba(244,63,94,0.25);
    color: var(--accent-rose);
    cursor: pointer;
    font-size: 0.85rem;
    transition: background 0.2s;
  }

  .reset-btn-full:hover {
    background: rgba(244,63,94,0.2);
  }
</style>