<!-- src/routes/(app)/ocr/+page.svelte -->
<!-- OCR Page — wraps the OCRModule component                   -->

<script lang="ts">
  import OCRModule from '$components/OCRModule.svelte';
  import type { AIAnalysis } from '$components/OCRModule.svelte';

  let lastText     = $state('');
  let lastAnalysis = $state<AIAnalysis | null>(null);

  function handleText(text: string) {
    lastText = text;
  }

  function handleAnalysis(analysis: AIAnalysis) {
    lastAnalysis = analysis;
  }
</script>

<svelte:head>
  <title>Scanare Teme — StudyFlow</title>
</svelte:head>

<div class="ocr-page">
  <header class="page-header">
    <h1 class="page-title">Scanare Teme & Teste</h1>
    <p class="page-desc">
      Fotografiază sau încarcă o temă/test și primește analiză AI instantă cu corectarea greșelilor.
    </p>
  </header>

  <div class="ocr-layout">
    <OCRModule
      onTextExtracted={handleText}
      onAnalysisReady={handleAnalysis}
    />

    <!-- Tip panel -->
    <div class="tips-panel glass">
      <h3 class="tips-title">💡 Sfaturi pentru scanare bună</h3>
      <ul class="tips-list">
        <li>Fotografiază pe fundal uniform, bine iluminat</li>
        <li>Ținea telefonul paralel cu foaia</li>
        <li>Asigură-te că textul este clar și nelegănat</li>
        <li>Funcționează offline — textul nu părăsește browserul tău</li>
      </ul>

      <div class="supported-langs">
        <span class="lang-chip">🇷🇴 Română</span>
        <span class="lang-chip">🇬🇧 Engleză</span>
        <span class="lang-chip">∑ Formule</span>
      </div>
    </div>
  </div>
</div>

<style>
  .ocr-page { max-width: 800px; }

  .page-header { margin-bottom: 2rem; }

  .page-title {
    font-family: var(--font-display);
    font-size: 1.8rem;
    font-weight: 800;
    margin: 0 0 0.5rem;
    letter-spacing: -0.03em;
  }

  .page-desc {
    font-size: 0.9rem;
    color: rgba(255,255,255,0.45);
    margin: 0;
    line-height: 1.6;
  }

  .ocr-layout {
    display: grid;
    gap: 1.2rem;
  }

  .tips-panel {
    border-radius: var(--radius-lg);
    padding: 1.2rem;
  }

  .tips-title {
    font-family: var(--font-display);
    font-size: 0.9rem;
    font-weight: 700;
    margin: 0 0 0.8rem;
    color: rgba(255,255,255,0.7);
  }

  .tips-list {
    list-style: none;
    padding: 0;
    margin: 0 0 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .tips-list li {
    font-size: 0.8rem;
    color: rgba(255,255,255,0.45);
    padding-left: 1rem;
    position: relative;
  }

  .tips-list li::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: var(--accent-emerald);
    font-size: 0.75rem;
  }

  .supported-langs {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .lang-chip {
    padding: 0.25rem 0.65rem;
    border-radius: 100px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    font-size: 0.72rem;
    color: rgba(255,255,255,0.4);
  }
</style>