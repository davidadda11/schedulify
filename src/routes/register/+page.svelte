<script>
  import { onMount } from 'svelte';

  let name = $state('');
  let email = $state('');
  let password = $state('');
  let isLoading = $state(false);
  let showSuccess = $state(false);
  let mounted = $state(false);
  let focusedField = $state('');
  let showBubble = $state(false);

  onMount(() => {
    setTimeout(() => { mounted = true; }, 100);
    setTimeout(() => { showBubble = true; }, 1800);
  });

  import { authClient } from '$lib/auth/auth-client';

  async function handleSubmit() {
  if (!name || !email || !password) return;
  isLoading = true;
  
  const { error } = await authClient.signUp.email({
    name,
    email,
    password
  });
  
  isLoading = false;
  if (error) {
    alert(error.message);
  } else {
    showSuccess = true;
  }
}
  function handleFocus(field) {
    focusedField = field;
  }

  function handleBlur() {
    focusedField = '';
  }
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap" rel="stylesheet" />
</svelte:head>

<div class="page" class:mounted>
  <!-- Animated background blobs -->
  <div class="bg-blob blob-1"></div>
  <div class="bg-blob blob-2"></div>
  <div class="bg-blob blob-3"></div>
  <div class="grid-overlay"></div>

  <div class="container">
    <!-- Left side: branding -->
    <div class="branding">
      <div class="logo-mark">
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="20" stroke="white" stroke-width="2" opacity="0.3"/>
          <circle cx="24" cy="24" r="12" stroke="white" stroke-width="2" opacity="0.6"/>
          <line x1="24" y1="24" x2="24" y2="10" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          <line x1="24" y1="24" x2="33" y2="28" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <circle cx="24" cy="24" r="2.5" fill="white"/>
        </svg>
      </div>
      <h1 class="brand-title">Schedulify</h1>
      <p class="brand-tagline">Your time,<br/><em>orchestrated.</em></p>

      <div class="features">
        <div class="feature-item">
          <span class="feat-icon">◈</span>
          <span>Smart scheduling AI</span>
        </div>
        <div class="feature-item">
          <span class="feat-icon">◎</span>
          <span>Real-time alerts</span>
        </div>
        <div class="feature-item">
          <span class="feat-icon">◉</span>
          <span>Seamless sync</span>
        </div>
      </div>
    </div>

    <!-- Right side: form card -->
    <div class="card-wrap">
      <!-- Motion alert bubble -->
      {#if showBubble}
        <div class="bubble" class:visible={showBubble}>
          <div class="bubble-dot"></div>
          <span>Your motion alerts going up <strong>NOW</strong></span>
        </div>
      {/if}

      {#if showSuccess}
        <div class="success-state">
          <div class="success-icon">
            <svg viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="30" stroke="#2563eb" stroke-width="2"/>
              <path d="M18 32l10 10 18-18" stroke="#2563eb" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="check-path"/>
            </svg>
          </div>
          <h2>Welcome aboard!</h2>
          <p>Your account has been created. Let's get scheduling.</p>
          <button class="btn-primary" onclick={() => {
            showSuccess = false;
            window.location.href = "/app/dashboard";
          }}>
            Go to Dashboard →
          </button>
        </div>
      {:else}
        <div class="card">
          <div class="card-header">
            <h2>Create account</h2>
            <p class="card-sub">Join thousands organizing smarter</p>
          </div>

          <div class="form">
            <!-- Name field -->
            <div class="field" class:focused={focusedField === 'name'} class:filled={name.length > 0}>
              <label for="name">Name</label>
              <div class="input-wrap">
                <span class="input-icon">
                  <svg viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="7" r="3.5" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </span>
                <input
                  id="name"
                  type="text"
                  placeholder="Your full name"
                  bind:value={name}
                  onfocus={() => handleFocus('name')}
                  onblur={handleBlur}
                />
                <div class="input-line"></div>
              </div>
            </div>

            <!-- Email field -->
            <div class="field" class:focused={focusedField === 'email'} class:filled={email.length > 0}>
              <label for="email">Email</label>
              <div class="input-wrap">
                <span class="input-icon">
                  <svg viewBox="0 0 20 20" fill="none">
                    <rect x="2" y="5" width="16" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M2 7l8 5 8-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </span>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  bind:value={email}
                  onfocus={() => handleFocus('email')}
                  onblur={handleBlur}
                />
                <div class="input-line"></div>
              </div>
            </div>

            <!-- Password field -->
            <div class="field" class:focused={focusedField === 'password'} class:filled={password.length > 0}>
              <label for="password">Password</label>
              <div class="input-wrap">
                <span class="input-icon">
                  <svg viewBox="0 0 20 20" fill="none">
                    <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M7 9V6a3 3 0 016 0v3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </span>
                <input
                  id="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  bind:value={password}
                  onfocus={() => handleFocus('password')}
                  onblur={handleBlur}
                />
                <div class="input-line"></div>
              </div>
            </div>

            <!-- Submit button -->
            <button
              class="btn-primary"
              class:loading={isLoading}
              onclick={handleSubmit}
              disabled={isLoading || !name || !email || !password}
            >
              {#if isLoading}
                <span class="spinner"></span>
                <span>Creating account…</span>
              {:else}
                <span>Connect</span>
                <span class="btn-arrow">→</span>
              {/if}
            </button>
          </div>

          <div class="card-footer">
            <span>Already have an account?</span>
            <a href="/login" class="link">Sign in</a>
          </div>
        </div>
      {/if}
    </div>
  </div>
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
    --blue-100: #dbeafe;
    --blue-50: #eff6ff;
    --white: #ffffff;
    --glass: rgba(255,255,255,0.07);

    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
    background: var(--blue-950);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  /* ---- Background ---- */
  .bg-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
  }

  .blob-1 {
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(37,99,235,0.35) 0%, transparent 70%);
    top: -200px;
    left: -100px;
    animation: blobFloat 9s ease-in-out infinite;
  }

  .blob-2 {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(96,165,250,0.2) 0%, transparent 70%);
    bottom: -100px;
    right: 200px;
    animation: blobFloat 12s ease-in-out infinite reverse;
  }

  .blob-3 {
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%);
    top: 50%;
    left: 50%;
    animation: blobFloat 7s ease-in-out infinite 3s;
  }

  .grid-overlay {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(96,165,250,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(96,165,250,0.04) 1px, transparent 1px);
    background-size: 60px 60px;
    pointer-events: none;
  }

  @keyframes blobFloat {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(30px, -20px) scale(1.05); }
    66% { transform: translate(-15px, 15px) scale(0.97); }
  }

  /* ---- Layout ---- */
  .container {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: 1fr 480px;
    gap: 80px;
    align-items: center;
    max-width: 960px;
    width: 100%;
    padding: 40px;

    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .page.mounted .container {
    opacity: 1;
    transform: translateY(0);
  }

  /* ---- Branding ---- */
  .branding {
    color: var(--white);
  }

  .logo-mark {
    width: 52px;
    height: 52px;
    margin-bottom: 24px;
    animation: spinSlow 20s linear infinite;
    opacity: 0.9;
  }

  @keyframes spinSlow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .brand-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(42px, 5vw, 64px);
    font-weight: 800;
    letter-spacing: -2px;
    line-height: 1;
    background: linear-gradient(135deg, #fff 0%, var(--blue-400) 50%, var(--blue-200) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 16px;
  }

  .brand-tagline {
    font-size: 20px;
    font-weight: 300;
    line-height: 1.5;
    color: var(--blue-200);
    margin-bottom: 48px;
    opacity: 0.85;
  }

  .brand-tagline em {
    font-style: italic;
    color: var(--blue-400);
    font-weight: 500;
  }

  .features {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .feature-item {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    color: var(--blue-200);
    opacity: 0;
    transform: translateX(-20px);
    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .page.mounted .feature-item:nth-child(1) { opacity: 1; transform: none; transition-delay: 0.4s; }
  .page.mounted .feature-item:nth-child(2) { opacity: 1; transform: none; transition-delay: 0.55s; }
  .page.mounted .feature-item:nth-child(3) { opacity: 1; transform: none; transition-delay: 0.7s; }

  .feat-icon {
    color: var(--blue-400);
    font-size: 18px;
  }

  /* ---- Card ---- */
  .card-wrap {
    position: relative;
  }

  .card {
    background: rgba(255, 255, 255, 0.97);
    border-radius: 24px;
    padding: 40px;
    box-shadow:
      0 0 0 1px rgba(37,99,235,0.1),
      0 32px 80px rgba(10, 22, 40, 0.6),
      0 0 60px rgba(37,99,235,0.15);
    backdrop-filter: blur(20px);
    transform: perspective(1000px) rotateY(-3deg);
    transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .card:hover {
    transform: perspective(1000px) rotateY(0deg);
  }

  .card-header {
    margin-bottom: 32px;
  }

  .card-header h2 {
    font-family: 'Syne', sans-serif;
    font-size: 28px;
    font-weight: 700;
    color: var(--blue-950);
    letter-spacing: -0.5px;
    margin-bottom: 6px;
  }

  .card-sub {
    font-size: 14px;
    color: #64748b;
    font-weight: 400;
  }

  /* ---- Form ---- */
  .form {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .field {
    position: relative;
  }

  .field label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #94a3b8;
    margin-bottom: 8px;
    transition: color 0.3s;
  }

  .field.focused label,
  .field.filled label {
    color: var(--blue-600);
  }

  .input-wrap {
    position: relative;
  }

  .input-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    color: #94a3b8;
    transition: color 0.3s;
    display: flex;
    align-items: center;
  }

  .field.focused .input-icon,
  .field.filled .input-icon {
    color: var(--blue-600);
  }

  input {
    width: 100%;
    padding: 14px 14px 14px 44px;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    color: var(--blue-950);
    background: #f8fafc;
    outline: none;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  input::placeholder {
    color: #cbd5e1;
  }

  input:focus {
    border-color: var(--blue-500);
    background: white;
    box-shadow: 0 0 0 4px rgba(37,99,235,0.08), 0 4px 16px rgba(37,99,235,0.1);
    transform: translateY(-1px);
  }

  .input-line {
    position: absolute;
    bottom: 0;
    left: 12px;
    right: 12px;
    height: 2px;
    background: linear-gradient(90deg, var(--blue-600), var(--blue-400));
    border-radius: 0 0 2px 2px;
    transform: scaleX(0);
    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    transform-origin: left;
  }

  .field.focused .input-line {
    transform: scaleX(1);
  }

  /* ---- Button ---- */
  .btn-primary {
    width: 100%;
    padding: 16px 24px;
    background: linear-gradient(135deg, var(--blue-600) 0%, var(--blue-500) 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-family: 'Syne', sans-serif;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.3px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    position: relative;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    margin-top: 8px;
    box-shadow: 0 8px 24px rgba(37,99,235,0.35);
  }

  .btn-primary::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%);
    opacity: 0;
    transition: opacity 0.3s;
  }

  .btn-primary:hover:not(:disabled)::before {
    opacity: 1;
  }

  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(37,99,235,0.45);
  }

  .btn-primary:active:not(:disabled) {
    transform: translateY(0);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
  }

  .btn-arrow {
    transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .btn-primary:hover:not(:disabled) .btn-arrow {
    transform: translateX(4px);
  }

  .spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* ---- Card footer ---- */
  .card-footer {
    margin-top: 24px;
    text-align: center;
    font-size: 14px;
    color: #94a3b8;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  .link {
    color: var(--blue-600);
    font-weight: 600;
    text-decoration: none;
    transition: color 0.2s;
  }

  .link:hover {
    color: var(--blue-500);
    text-decoration: underline;
  }

  /* ---- Motion alert bubble ---- */
  .bubble {
    position: absolute;
    top: -60px;
    right: -20px;
    background: white;
    border: 2px solid var(--blue-200);
    border-radius: 18px 18px 18px 4px;
    padding: 12px 16px;
    font-size: 13px;
    color: var(--blue-950);
    white-space: nowrap;
    box-shadow: 0 8px 32px rgba(37,99,235,0.2);
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 10;

    opacity: 0;
    transform: translateY(10px) scale(0.9);
    transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .bubble.visible {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  .bubble-dot {
    width: 8px;
    height: 8px;
    background: var(--blue-500);
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
    flex-shrink: 0;
  }

  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.5); }
    50% { box-shadow: 0 0 0 6px rgba(59,130,246,0); }
  }

  /* ---- Success state ---- */
  .success-state {
    background: rgba(255,255,255,0.97);
    border-radius: 24px;
    padding: 48px 40px;
    text-align: center;
    box-shadow:
      0 0 0 1px rgba(37,99,235,0.1),
      0 32px 80px rgba(10, 22, 40, 0.6);
    animation: successIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  @keyframes successIn {
    from { opacity: 0; transform: scale(0.8) translateY(20px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }

  .success-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 24px;
  }

  .success-icon svg {
    width: 100%;
    height: 100%;
  }

  .check-path {
    stroke-dasharray: 50;
    stroke-dashoffset: 50;
    animation: drawCheck 0.6s ease forwards 0.3s;
  }

  @keyframes drawCheck {
    to { stroke-dashoffset: 0; }
  }

  .success-state h2 {
    font-family: 'Syne', sans-serif;
    font-size: 28px;
    font-weight: 700;
    color: var(--blue-950);
    margin-bottom: 10px;
  }

  .success-state p {
    color: #64748b;
    font-size: 15px;
    margin-bottom: 28px;
  }

  /* ---- Responsive ---- */
  @media (max-width: 768px) {
    :global(body) { overflow: auto; }

    .container {
      grid-template-columns: 1fr;
      gap: 40px;
      padding: 24px;
    }

    .branding {
      text-align: center;
    }

    .features {
      align-items: center;
    }

    .card {
      transform: none;
    }

    .bubble {
      right: 0;
      top: -56px;
      font-size: 12px;
    }
  }
</style>