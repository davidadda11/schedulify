<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { signIn } from '$lib/auth/auth-client';

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state('');
	let mounted = $state(false);
	let focusedField = $state('');

	onMount(() => {
		setTimeout(() => {
			mounted = true;
		}, 100);
	});

	async function handleSubmit() {
		error = '';
		loading = true;

		const { data, error: authError } = await signIn.email({
			email,
			password,
			callbackURL: '/app/dashboard'
		});

		if (authError) {
			error = authError.message ?? 'Autentificare eșuată. Verifică datele.';
			loading = false;
			return;
		}

		// Ensure settings exist in localStorage
		if (typeof window !== 'undefined') {
			const hasSettings = localStorage.getItem('schedulify_profile');
			if (!hasSettings) {
				const defaultSettings = {
					profile: { name: '', school: '', grade: '', avatar: '' },
					subjects: [
						{ id: '1', name: 'Matematică', teacher: '', color: '#6366f1' },
						{ id: '2', name: 'Română', teacher: '', color: '#ec4899' },
						{ id: '3', name: 'Fizică', teacher: '', color: '#06b6d4' },
					],
					notifs: {
						remindersEnabled: true,
						reminderTime: '08:00',
						homeworkAlert: true,
						testAlert: true,
						weeklyReport: false,
					},
					appearance: {
						compactMode: false,
						showMotivation: true,
						language: 'ro',
					}
				};
				localStorage.setItem('schedulify_profile', JSON.stringify(defaultSettings.profile));
				localStorage.setItem('schedulify_subjects', JSON.stringify(defaultSettings.subjects));
				localStorage.setItem('schedulify_notifs', JSON.stringify(defaultSettings.notifs));
				localStorage.setItem('schedulify_appearance', JSON.stringify(defaultSettings.appearance));
			}
		}

		await goto('/app/dashboard');
	}

	async function handleGoogle() {
		await signIn.social({ provider: 'google', callbackURL: '/app/dashboard' });
	}

	function handleFocus(field) {
		focusedField = field;
	}

	function handleBlur() {
		focusedField = '';
	}
</script>

<svelte:head>
	<title>Intră în cont — Schedulify</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="page" class:mounted>
	<div class="bg-blob blob-1"></div>
	<div class="bg-blob blob-2"></div>
	<div class="bg-blob blob-3"></div>
	<div class="grid-overlay"></div>

	<div class="container">
		<div class="branding">
			<div class="logo-mark">
				<svg viewBox="0 0 120 120" width="80" height="80">
					<!-- Cercuri -->
					<circle
						cx="60"
						cy="60"
						r="50"
						stroke="rgba(255,255,255,0.15)"
						stroke-width="1"
						fill="none"
					/>
					<circle
						cx="60"
						cy="60"
						r="35"
						stroke="rgba(255,255,255,0.25)"
						stroke-width="1"
						fill="none"
					/>

					<!-- Puncte centrale -->
					<circle cx="60" cy="60" r="1.5" fill="rgba(255,255,255,0.9)" />
					<circle cx="63" cy="63" r="1.5" fill="rgba(255,255,255,0.9)" />
					<circle cx="66" cy="61" r="1.5" fill="rgba(255,255,255,0.9)" />

					<!-- Numere pe cercul exterior (0-12) -->
					{#each Array(13) as _, i}
						{@const angle = (((i * 360) / 13) * Math.PI) / 180}
						{@const x = 60 + 48 * Math.sin(angle)}
						{@const y = 60 - 48 * Math.cos(angle)}
						<text
							{x}
							{y}
							text-anchor="middle"
							dominant-baseline="middle"
							fill="rgba(255,255,255,0.7)"
							font-size="7"
							font-family="DM Sans"
						>
							{i}
						</text>
					{/each}

					<!-- Litere pe cercul interior -->
					{#each ['F', 'R', 'I', 'D', 'A', 'Y', 'J', 'U', 'N', 'E', '8', '9', '10'] as letter, i}
						{@const angle = (((i * 360) / 13) * Math.PI) / 180}
						{@const x = 60 + 33 * Math.sin(angle)}
						{@const y = 60 - 33 * Math.cos(angle)}
						<text
							{x}
							{y}
							text-anchor="middle"
							dominant-baseline="middle"
							fill="rgba(96,165,250,0.8)"
							font-size="6"
							font-family="DM Sans"
						>
							{letter}
						</text>
					{/each}

					<!-- Ace ceas -->
					<line
						x1="60"
						y1="60"
						x2="60"
						y2="30"
						stroke="white"
						stroke-width="1.5"
						stroke-linecap="round"
						opacity="0.8"
					/>
					<line
						x1="60"
						y1="60"
						x2="72"
						y2="67"
						stroke="white"
						stroke-width="1"
						stroke-linecap="round"
						opacity="0.6"
					/>
				</svg>
			</div>
			<h1 class="brand-title">Schedulify</h1>
			<p class="brand-tagline">Timpul tău,<br /><em>orchestrat.</em></p>

			<div class="features">
				<div class="feature-item">
					<span class="feat-icon">◈</span>
					<span>Planificare inteligentă</span>
				</div>
				<div class="feature-item">
					<span class="feat-icon">◎</span>
					<span>Alerte în timp real</span>
				</div>
				<div class="feature-item">
					<span class="feat-icon">◉</span>
					<span>Sincronizare perfectă</span>
				</div>
			</div>
		</div>

		<div class="card-wrap">
			<div class="card">
				<div class="card-header">
					<h2>Bun venit înapoi</h2>
					<p class="card-sub">Intră în contul tău Schedulify</p>
				</div>

				<div class="form">
					<div
						class="field"
						class:focused={focusedField === 'email'}
						class:filled={email.length > 0}
					>
						<label for="email">Email</label>
						<div class="input-wrap">
							<span class="input-icon">
								<svg viewBox="0 0 20 20" fill="none">
									<rect
										x="2"
										y="5"
										width="16"
										height="12"
										rx="2"
										stroke="currentColor"
										stroke-width="1.5"
									/>
									<path
										d="M2 7l8 5 8-5"
										stroke="currentColor"
										stroke-width="1.5"
										stroke-linecap="round"
									/>
								</svg>
							</span>
							<input
								id="email"
								type="email"
								placeholder="tu@exemplu.ro"
								bind:value={email}
								onfocus={() => handleFocus('email')}
								onblur={handleBlur}
								disabled={loading}
							/>
							<div class="input-line"></div>
						</div>
					</div>

					<div
						class="field"
						class:focused={focusedField === 'password'}
						class:filled={password.length > 0}
					>
						<label for="password">
							<span>Parolă</span>
							<a href="/forgot-password" class="forgot-link">Ai uitat?</a>
						</label>
						<div class="input-wrap">
							<span class="input-icon">
								<svg viewBox="0 0 20 20" fill="none">
									<rect
										x="4"
										y="9"
										width="12"
										height="9"
										rx="2"
										stroke="currentColor"
										stroke-width="1.5"
									/>
									<path
										d="M7 9V6a3 3 0 016 0v3"
										stroke="currentColor"
										stroke-width="1.5"
										stroke-linecap="round"
									/>
								</svg>
							</span>
							<input
								id="password"
								type="password"
								placeholder="••••••••"
								bind:value={password}
								onfocus={() => handleFocus('password')}
								onblur={handleBlur}
								disabled={loading}
							/>
							<div class="input-line"></div>
						</div>
					</div>

					{#if error}
						<div class="error-banner">
							<span>⚠</span>
							{error}
						</div>
					{/if}

					<button
						class="btn-primary"
						onclick={handleSubmit}
						disabled={loading || !email || !password}
					>
						{#if loading}
							<span class="spinner"></span>
							<span>Se autentifică…</span>
						{:else}
							<span>Intră în cont</span>
							<span class="btn-arrow">→</span>
						{/if}
					</button>
				</div>

				<div class="divider"><span>sau</span></div>

				<button class="btn-social" onclick={handleGoogle} type="button">
					<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
						<path
							d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
							fill="#4285F4"
						/>
						<path
							d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
							fill="#34A853"
						/>
						<path
							d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
							fill="#FBBC05"
						/>
						<path
							d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
							fill="#EA4335"
						/>
					</svg>
					Continuă cu Google
				</button>

				<div class="card-footer">
					<span>Nu ai cont?</span>
					<a href="/register" class="link">Înregistrează-te</a>
				</div>
			</div>
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
		--blue-600: #2563eb;
		--blue-500: #3b82f6;
		--blue-400: #60a5fa;
		--blue-200: #bfdbfe;
		--blue-50: #eff6ff;

		font-family: 'DM Sans', sans-serif;
		min-height: 100vh;
		background: var(--blue-950);
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		overflow: hidden;
	}

	.bg-blob {
		position: absolute;
		border-radius: 50%;
		filter: blur(80px);
		pointer-events: none;
	}
	.blob-1 {
		width: 600px;
		height: 600px;
		background: radial-gradient(circle, rgba(37, 99, 235, 0.35) 0%, transparent 70%);
		top: -200px;
		left: -100px;
		animation: blobFloat 9s ease-in-out infinite;
	}
	.blob-2 {
		width: 400px;
		height: 400px;
		background: radial-gradient(circle, rgba(96, 165, 250, 0.2) 0%, transparent 70%);
		bottom: -100px;
		right: 200px;
		animation: blobFloat 12s ease-in-out infinite reverse;
	}
	.blob-3 {
		width: 300px;
		height: 300px;
		background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
		top: 50%;
		left: 50%;
		animation: blobFloat 7s ease-in-out infinite 3s;
	}

	.grid-overlay {
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(rgba(96, 165, 250, 0.04) 1px, transparent 1px),
			linear-gradient(90deg, rgba(96, 165, 250, 0.04) 1px, transparent 1px);
		background-size: 60px 60px;
		pointer-events: none;
	}

	@keyframes blobFloat {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		33% {
			transform: translate(30px, -20px) scale(1.05);
		}
		66% {
			transform: translate(-15px, 15px) scale(0.97);
		}
	}

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
		transition:
			opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
			transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.page.mounted .container {
		opacity: 1;
		transform: translateY(0);
	}

	.branding {
		color: white;
	}

	.logo-mark {
		width: 80px;
		height: 80px;
		margin-bottom: 24px;
		opacity: 0.9;
	}

	@keyframes spinSlow {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
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

	.page.mounted .feature-item:nth-child(1) {
		opacity: 1;
		transform: none;
		transition-delay: 0.4s;
	}
	.page.mounted .feature-item:nth-child(2) {
		opacity: 1;
		transform: none;
		transition-delay: 0.55s;
	}
	.page.mounted .feature-item:nth-child(3) {
		opacity: 1;
		transform: none;
		transition-delay: 0.7s;
	}

	.feat-icon {
		color: var(--blue-400);
		font-size: 18px;
	}

	.card-wrap {
		position: relative;
	}

	.card {
		background: rgba(255, 255, 255, 0.97);
		border-radius: 24px;
		padding: 40px;
		box-shadow:
			0 0 0 1px rgba(37, 99, 235, 0.1),
			0 32px 80px rgba(10, 22, 40, 0.6),
			0 0 60px rgba(37, 99, 235, 0.15);
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
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}
	.field {
		position: relative;
	}

	.field label {
		display: flex;
		justify-content: space-between;
		align-items: center;
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

	.forgot-link {
		font-size: 11px;
		color: var(--blue-600);
		text-decoration: none;
		text-transform: none;
		letter-spacing: 0;
		font-weight: 600;
	}
	.forgot-link:hover {
		text-decoration: underline;
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
		box-shadow:
			0 0 0 4px rgba(37, 99, 235, 0.08),
			0 4px 16px rgba(37, 99, 235, 0.1);
		transform: translateY(-1px);
	}

	input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
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

	.error-banner {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.65rem 0.9rem;
		border-radius: 10px;
		background: rgba(239, 68, 68, 0.08);
		border: 1px solid rgba(239, 68, 68, 0.2);
		color: #ef4444;
		font-size: 0.82rem;
	}

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
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		position: relative;
		overflow: hidden;
		transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
		margin-top: 8px;
		box-shadow: 0 8px 24px rgba(37, 99, 235, 0.35);
	}

	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 12px 32px rgba(37, 99, 235, 0.45);
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
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
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
		background: rgba(0, 0, 0, 0.08);
	}
	.divider span {
		position: relative;
		background: rgba(255, 255, 255, 0.97);
		padding: 0 0.8rem;
		font-size: 0.75rem;
		color: #94a3b8;
	}

	.btn-social {
		width: 100%;
		padding: 0.75rem;
		border-radius: 12px;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		color: #475569;
		font-family: 'DM Sans', sans-serif;
		font-size: 0.88rem;
		font-weight: 500;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.65rem;
		transition:
			background 0.2s,
			border-color 0.2s;
	}

	.btn-social:hover {
		background: #eff6ff;
		border-color: var(--blue-200);
	}

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
	}
	.link:hover {
		text-decoration: underline;
	}

	@media (max-width: 768px) {
		:global(body) {
			overflow: auto;
		}
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
	}
</style>
