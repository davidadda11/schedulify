<!-- src/routes/(auth)/register/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { signUp } from '$auth/auth-client';
  import gsap from 'gsap';

  let name       = $state('');
  let email      = $state('');
  let password   = $state('');
  let confirm    = $state('');
  let gradeLevel = $state('');
  let school     = $state('');
  let edu24User  = $state('');
  let loading    = $state(false);
  let error      = $state('');
  let step       = $state(1);
  let formEl: HTMLFormElement;

  onMount(() => {
    gsap.fromTo('.card', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' });
    gsap.fromTo('.f', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, ease: 'expo.out', stagger: 0.09, delay: 0.2 });
  });

  function nextStep() {
    error = '';
    if (!name || !email || !password) { error = 'Completează toate câmpurile.'; return; }
    if (password.length < 8) { error = 'Parola trebuie să aibă minim 8 caractere.'; return; }
    if (password !== confirm) { error = 'Parolele nu coincid.'; return; }
    step = 2;
    gsap.fromTo('.s2 .f', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, ease: 'expo.out', stagger: 0.09 });
  }

  function prevStep() { step = 1; error = ''; }

  async function handleSubmit() {
    error = ''; loading = true;
    const { error: authError } = await signUp.email({ email, password, name, callbackURL: '/dashboard' });
    if (authError) {
      error = authError.message ?? 'Înregistrare eșuată.';
      loading = false;
      gsap.fromTo(formEl, { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' });
      return;
    }
    await goto('/dashboard');
  }
</script>

<svelte:head><title>Cont nou — Schedulify</title></svelte:head>

<div class="page">
  <div class="card">
    <!-- diagonal color block top -->
    <div class="top-block">
      <div class="top-text">
        <p class="step-label">{step === 1 ? 'Pasul 1 din 2' : 'Pasul 2 din 2'}</p>
        <h1>{step === 1 ? 'Bun venit!' : 'Spune-ne despre tine'}</h1>
        <p class="top-sub">{step === 1 ? 'Creează-ți contul Schedulify' : 'Câteva detalii în plus'}</p>
      </div>
      <!-- step dots -->
      <div class="dots">
        <div class="dot" class:active={step===1} class:done={step>1}></div>
        <div class="dot" class:active={step===2}></div>
      </div>
    </div>

    <!-- form area -->
    <div class="body">
      <form bind:this={formEl} onsubmit={(e) => { e.preventDefault(); step === 1 ? nextStep() : handleSubmit(); }} novalidate>

        {#if step === 1}
          <div class="f">
            <label for="name">Numele tău</label>
            <input id="name" type="text" bind:value={name} placeholder="Ion Popescu" autocomplete="name" disabled={loading} />
          </div>
          <div class="f">
            <label for="email">Adresă de email</label>
            <input id="email" type="email" bind:value={email} placeholder="elev@scoala.ro" autocomplete="email" disabled={loading} />
          </div>
          <div class="f row2">
            <div>
              <label for="pw">Parolă</label>
              <input id="pw" type="password" bind:value={password} placeholder="minim 8 caractere" autocomplete="new-password" disabled={loading} />
            </div>
            <div>
              <label for="cpw">Confirmă</label>
              <input id="cpw" type="password" bind:value={confirm} placeholder="••••••••" autocomplete="new-password" disabled={loading} />
            </div>
          </div>
        {/if}

        {#if step === 2}
          <div class="s2">
            <div class="f">
              <label for="grade">Clasa</label>
              <select id="grade" bind:value={gradeLevel} disabled={loading}>
                <option value="" disabled selected>Selectează clasa ta</option>
                {#each Array.from({length: 8}, (_, i) => i + 5) as g}
                  <option value={g}>Clasa {g}</option>
                {/each}
              </select>
            </div>
            <div class="f">
              <label for="school">Școala / Liceul</label>
              <input id="school" type="text" bind:value={school} placeholder="ex: Colegiul National Mihai Eminescu" disabled={loading} />
            </div>
            <div class="f">
              <label for="edu24">Username 24edu <span class="opt">— opțional</span></label>
              <input id="edu24" type="text" bind:value={edu24User} placeholder="username-ul tău" disabled={loading} />
            </div>
          </div>
        {/if}

        {#if error}
          <div class="err">{error}</div>
        {/if}

        <div class="btns">
          {#if step === 2}
            <button type="button" class="back" onclick={prevStep} disabled={loading}>← Înapoi</button>
          {/if}
          <button type="submit" class="go" disabled={loading || (step===1 && (!name||!email||!password||!confirm))}>
            {#if loading}<span class="spin"></span>{/if}
            {loading ? 'Se creează…' : step === 1 ? 'Continuă' : 'Creează cont'}
          </button>
        </div>
      </form>

      <p class="foot">Ai deja cont? <a href="/login">Intră în cont</a></p>
    </div>
  </div>
</div>

<style>
  :global(body) { background: #eef2f7; }

  .page {
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    font-family: 'DM Sans', sans-serif;
  }

  .card {
    width: 100%;
    max-width: 420px;
    background: #fff;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.04), 0 16px 48px rgba(0,0,0,0.10);
    opacity: 0;
  }

  /* ── colored top block with diagonal cut ── */
  .top-block {
    background: #2563eb;
    padding: 2rem 2rem 3.5rem;
    position: relative;
    clip-path: polygon(0 0, 100% 0, 100% 75%, 0 100%);
  }

  .top-text h1 {
    font-family: 'Syne', sans-serif;
    font-size: 1.8rem;
    font-weight: 800;
    color: #fff;
    margin: 0.2rem 0 0.3rem;
    letter-spacing: -0.02em;
  }

  .step-label {
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: rgba(255,255,255,0.6);
    margin: 0 0 0.2rem;
  }

  .top-sub {
    font-size: 0.875rem;
    color: rgba(255,255,255,0.75);
    margin: 0;
  }

  .dots {
    display: flex;
    gap: 0.4rem;
    margin-top: 1rem;
  }

  .dot {
    width: 28px;
    height: 5px;
    border-radius: 999px;
    background: rgba(255,255,255,0.25);
    transition: background 0.3s, width 0.3s;
  }

  .dot.active { background: #fff; width: 40px; }
  .dot.done   { background: rgba(255,255,255,0.6); }

  /* ── form body ── */
  .body {
    padding: 1.8rem 2rem 2rem;
    margin-top: -0.5rem;
  }

  .f {
    margin-bottom: 1.1rem;
    opacity: 0;
  }

  .f label {
    display: block;
    font-size: 0.78rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.4rem;
    letter-spacing: 0.01em;
  }

  .opt {
    font-weight: 400;
    color: #9ca3af;
  }

  .f input, .f select {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 10px;
    border: 1.5px solid #e5e7eb;
    background: #f9fafb;
    color: #111827;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    box-sizing: border-box;
  }

  .f input::placeholder { color: #d1d5db; }

  .f input:focus, .f select:focus {
    border-color: #2563eb;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
  }

  .f input:disabled, .f select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .row2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .row2 label {
    display: block;
    font-size: 0.78rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.4rem;
  }

  .err {
    padding: 0.65rem 0.9rem;
    border-radius: 10px;
    background: #fef2f2;
    border: 1.5px solid #fecaca;
    color: #dc2626;
    font-size: 0.82rem;
    margin-bottom: 1rem;
  }

  .btns {
    display: flex;
    gap: 0.6rem;
    margin-top: 0.5rem;
  }

  .go {
    flex: 1;
    padding: 0.85rem;
    border-radius: 10px;
    background: #2563eb;
    border: none;
    color: #fff;
    font-family: 'Syne', sans-serif;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
    letter-spacing: 0.01em;
  }

  .go:hover:not(:disabled) {
    background: #1d4ed8;
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(37,99,235,0.35);
  }

  .go:active:not(:disabled) { transform: translateY(0); }
  .go:disabled { opacity: 0.4; cursor: not-allowed; }

  .back {
    padding: 0.85rem 1.1rem;
    border-radius: 10px;
    background: #f3f4f6;
    border: none;
    color: #6b7280;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
    white-space: nowrap;
  }

  .back:hover { background: #e5e7eb; color: #374151; }

  .spin {
    width: 14px; height: 14px;
    border: 2px solid rgba(255,255,255,0.35);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .foot {
    text-align: center;
    font-size: 0.82rem;
    color: #9ca3af;
    margin: 1.2rem 0 0;
  }

  .foot a {
    color: #2563eb;
    font-weight: 600;
    text-decoration: none;
  }

  .foot a:hover { text-decoration: underline; }
</style>
