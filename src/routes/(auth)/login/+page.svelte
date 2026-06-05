<!-- src/routes/(auth)/login/+page.svelte -->
<!-- Login Page — glassmorphism form, animated, Better Auth     -->

<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { signIn } from '$auth/auth-client';
  import gsap from 'gsap';

  // ── State ─────────────────────────────────────────────────
  let email    = $state('');
  let password = $state('');
  let loading  = $state(false);
  let error    = $state('');
  let formEl: HTMLFormElement;

  // ── Entrance animation ────────────────────────────────────
  onMount(() => {
    gsap.fromTo(
      '.auth-card',
      { opacity: 0, y: 40, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'expo.out', delay: 0.1 }
    );
    gsap.fromTo(
      '.auth-field',
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.5, ease: 'expo.out', stagger: 0.1, delay: 0.4 }
    );
  });

  // ── Submit ────────────────────────────────────────────────
  async function handleSubmit() {
    error   = '';
    loading = true;

    const { data, error: authError } = await signIn.email({
      email,
      password,
      callbackURL: '/dashboard',
    });

    if (authError) {
      error   = authError.message ?? 'Autentificare eșuată. Verifică datele.';
      loading = false;

      // Shake animation on error
      gsap.fromTo(
        formEl,
        { x: -8 },
        { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' }
      );
      return;
    }

    await goto('/dashboard');
  }

  // ── Google sign in ────────────────────────────────────────
  async function handleGoogle() {
    await signIn.social({ provider: 'google', callbackURL: '/dashboard' });
  }
</script>

<svelte:head>
  <title>Intră în cont — StudyFlow</title>
</svelte:head>

<div class="auth-page">
  <!-- Ambient blobs -->
  <div class="blob blob-1" aria-hidden="true"></div>
  <div class="blob blob-2" aria-hidden="true"></div>

  <div class="auth-card glass" role="main">
    <!-- Logo -->
    <div class="auth-logo">
      <span class="logo-sf">SF</span>
    </div>

    <h1 class="auth-title">Bun venit înapoi</h1>
    <p class="auth-desc">Intră în contul tău StudyFlow</p>

    <!-- Form -->
    <form
      bind:this={formEl}
      onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}
      novalidate
    >
      <div class="auth-field">
        <label for="email" class="field-label">Email</label>
        <input
          id="email"
          type="email"
          bind:value={email}
          placeholder="elev@scoala.ro"
          required
          autocomplete="email"
          class="field-input"
          disabled={loading}
        />
      </div>

      <div class="auth-field">
        <label for="password" class="field-label">
          Parolă
          <a href="/forgot-password" class="forgot-link">Ai uitat?</a>
        </label>
        <input
          id="password"
          type="password"
          bind:value={password}
          placeholder="••••••••"
          required
          autocomplete="current-password"
          class="field-input"
          disabled={loading}
        />
      </div>

      {#if error}
        <div class="error-banner" role="alert">
          <span>⚠</span> {error}
        </div>
      {/if}

      <button type="submit" class="btn-auth" disabled={loading || !email || !password}>
        {#if loading}
          <span class="spinner" aria-hidden="true"></span>
          Se autentifică…
        {:else}
          Intră în cont
        {/if}
      </button>
    </form>

    <!-- Divider -->
    <div class="divider"><span>sau</span></div>

    <!-- Google -->
    <button class="btn-social" onclick={handleGoogle} type="button">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
      </svg>
      Continuă cu Google
    </button>

    <p class="auth-footer">
      Nu ai cont?
      <a href="/register" class="auth-link">Înregistrează-te</a>
    </p>
  </div>
</div>

<style>
  .auth-page {
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    position: relative;
    overflow: hidden;
  }

  .blob {
    position: fixed;
    border-radius: 50%;
    filter: blur(100px);
    pointer-events: none;
    z-index: 0;
  }

  .blob-1 {
    width: 500px;
    height: 500px;
    background: rgba(99, 102, 241, 0.2);
    top: -150px;
    right: -100px;
    animation: blobFloat 8s ease-in-out infinite;
  }

  .blob-2 {
    width: 400px;
    height: 400px;
    background: rgba(34, 211, 238, 0.12);
    bottom: -100px;
    left: -100px;
    animation: blobFloat 10s ease-in-out infinite reverse;
  }

  @keyframes blobFloat {
    0%, 100% { transform: translate(0, 0) scale(1); }
    50%       { transform: translate(20px, -20px) scale(1.05); }
  }

  .auth-card {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 420px;
    border-radius: var(--radius-xl);
    padding: clamp(1.8rem, 4vw, 2.8rem);
    opacity: 0; /* GSAP reveals */
  }

  .auth-logo {
    display: flex;
    justify-content: center;
    margin-bottom: 1.5rem;
  }

  .logo-sf {
    font-family: var(--font-display);
    font-size: 2rem;
    font-weight: 800;
    background: linear-gradient(135deg, #6366f1, #22d3ee);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background-color: rgba(99,102,241,0.1);
    border: 1px solid rgba(99,102,241,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .auth-title {
    font-family: var(--font-display);
    font-size: 1.6rem;
    font-weight: 700;
    text-align: center;
    margin: 0 0 0.4rem;
    color: rgba(255,255,255,0.92);
  }

  .auth-desc {
    text-align: center;
    font-size: 0.88rem;
    color: rgba(255,255,255,0.4);
    margin: 0 0 2rem;
  }

  .auth-field {
    margin-bottom: 1.1rem;
    opacity: 0; /* GSAP reveals */
  }

  .field-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8rem;
    font-weight: 500;
    color: rgba(255,255,255,0.5);
    margin-bottom: 0.5rem;
  }

  .forgot-link {
    font-size: 0.75rem;
    color: var(--accent-violet);
    text-decoration: none;
    transition: color 0.2s;
  }

  .forgot-link:hover {
    color: var(--accent-cyan);
  }

  .field-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.9);
    font-family: var(--font-body);
    font-size: 0.92rem;
    outline: none;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  }

  .field-input::placeholder {
    color: rgba(255,255,255,0.2);
  }

  .field-input:focus {
    border-color: var(--accent-violet);
    background: rgba(99,102,241,0.06);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
  }

  .field-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error-banner {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 0.9rem;
    border-radius: 10px;
    background: rgba(244,63,94,0.1);
    border: 1px solid rgba(244,63,94,0.25);
    color: var(--accent-rose);
    font-size: 0.82rem;
    margin-bottom: 1rem;
  }

  .btn-auth {
    width: 100%;
    padding: 0.85rem;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--accent-violet), #4f52d3);
    border: none;
    color: #fff;
    font-family: var(--font-display);
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: opacity 0.2s, transform 0.2s var(--ease-spring), box-shadow 0.2s;
    margin-top: 0.5rem;
  }

  .btn-auth:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(99,102,241,0.4);
  }

  .btn-auth:active:not(:disabled) {
    transform: translateY(0);
  }

  .btn-auth:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .divider {
    position: relative;
    text-align: center;
    margin: 1.4rem 0;
  }

  .divider::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: rgba(255,255,255,0.07);
  }

  .divider span {
    position: relative;
    background: transparent;
    padding: 0 0.8rem;
    font-size: 0.75rem;
    color: rgba(255,255,255,0.3);
  }

  .btn-social {
    width: 100%;
    padding: 0.75rem;
    border-radius: 12px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.7);
    font-family: var(--font-body);
    font-size: 0.88rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.65rem;
    transition: background 0.2s, border-color 0.2s;
  }

  .btn-social:hover {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.18);
  }

  .auth-footer {
    text-align: center;
    font-size: 0.82rem;
    color: rgba(255,255,255,0.35);
    margin: 1.2rem 0 0;
  }

  .auth-link {
    color: var(--accent-violet);
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s;
  }

  .auth-link:hover {
    color: var(--accent-cyan);
  }
</style>