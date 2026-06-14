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
 
	let clockHours = $state(0);
	let clockMinutes = $state(0);
	let clockSeconds = $state(0);
 
	let hourAngle = $derived(((clockHours + clockMinutes / 60) * 30 * Math.PI) / 180);
	let minuteAngle = $derived(((clockMinutes + clockSeconds / 60) * 6 * Math.PI) / 180);
	let secondAngle = $derived((clockSeconds * 6 * Math.PI) / 180);
 
	// Date dinamică pentru cercul interior
	const CLOCK_DAYS = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
	const CLOCK_MONTHS = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
	const _cn = new Date();
	const dateChars = `${CLOCK_DAYS[_cn.getDay()]} ${_cn.getDate()} ${CLOCK_MONTHS[_cn.getMonth()]} ${_cn.getFullYear()}`.split('');
 
	onMount(() => {
		setTimeout(() => {
			mounted = true;
		}, 100);
		setTimeout(() => {
			showBubble = true;
		}, 1800);
 
		function updateClock() {
			const now = new Date();
			clockHours = now.getHours() % 12;
			clockMinutes = now.getMinutes();
			clockSeconds = now.getSeconds();
		}
		updateClock();
		const clockInterval = setInterval(updateClock, 1000);
 
		return () => clearInterval(clockInterval);
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
			// Initialize default settings for new user
			if (typeof window !== 'undefined') {
				const defaultSettings = {
					profile: { name: name, school: '', grade: '', avatar: '' },
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
 
	<!-- CEAS ANALOG FUNCTIONAL — ace punctate, dată dinamică -->
	<div class="wall-clock">
		<svg viewBox="0 0 300 300" width="240" height="240">
 
			<!-- Numere 1-12 pe cerc exterior -->
			{#each Array(12) as _, i}
				{@const a = (((i + 1) * 30) * Math.PI) / 180}
				<text
					x={150 + 130 * Math.sin(a)}
					y={150 - 130 * Math.cos(a)}
					text-anchor="middle"
					dominant-baseline="middle"
					fill="rgba(255,255,255,0.88)"
					font-size="15"
					font-family="DM Sans, sans-serif"
					font-weight="300"
				>{i + 1}</text>
			{/each}
 
			<!-- Litere dată curentă pe cerc interior (ex: SUNDAY 7 JUNE 2026) -->
			{#each dateChars as char, i}
				{@const a = (((i * 360) / dateChars.length) * Math.PI) / 180}
				{#if char.trim() !== ''}
					<text
						x={150 + 95 * Math.sin(a)}
						y={150 - 95 * Math.cos(a)}
						text-anchor="middle"
						dominant-baseline="middle"
						fill="rgba(96,165,250,0.92)"
						font-size="11"
						font-family="DM Sans, sans-serif"
						font-weight="600"
					>{char}</text>
				{/if}
			{/each}
 
			<!-- AC ORE — puncte albe mari (6 puncte) -->
			{#each Array(6) as _, i}
				{@const t = (i + 1) * 7}
				{@const x = 150 + t * Math.sin(hourAngle)}
				{@const y = 150 - t * Math.cos(hourAngle)}
				<circle cx={x} cy={y} r={3 - i * 0.12} fill="rgba(255,255,255,0.95)" />
			{/each}
 
			<!-- AC MINUTE — puncte albe medii (9 puncte, mai lungi) -->
			{#each Array(9) as _, i}
				{@const t = (i + 1) * 7}
				{@const x = 150 + t * Math.sin(minuteAngle)}
				{@const y = 150 - t * Math.cos(minuteAngle)}
				<circle cx={x} cy={y} r={2.2 - i * 0.08} fill="rgba(255,255,255,0.85)" />
			{/each}
 
			<!-- AC SECUNDE — puncte roșii (8 puncte) -->
			{#each Array(8) as _, i}
				{@const t = (i + 1) * 8}
				{@const x = 150 + t * Math.sin(secondAngle)}
				{@const y = 150 - t * Math.cos(secondAngle)}
				<circle cx={x} cy={y} r="1.8" fill="#ef4444" opacity="0.9" />
			{/each}
 
			<!-- Punct central -->
			<circle cx="150" cy="150" r="4" fill="rgba(255,255,255,0.95)" />
			<circle cx="150" cy="150" r="2" fill="#60a5fa" />
		</svg>
	</div>
 
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
			{#if showBubble}
				<div class="bubble" class:visible={showBubble}>
					<div class="bubble-dot"></div>
					<span>Alertele tale sunt active <strong>ACUM</strong></span>
				</div>
			{/if}
 
			{#if showSuccess}
				<div class="success-state">
					<div class="success-icon">
						<svg viewBox="0 0 64 64" fill="none">
							<circle cx="32" cy="32" r="30" stroke="#2563eb" stroke-width="2" />
							<path
								d="M18 32l10 10 18-18"
								stroke="#2563eb"
								stroke-width="3"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="check-path"
							/>
						</svg>
					</div>
					<h2>Bun venit!</h2>
					<p>Contul tău a fost creat. Să începem!</p>
					<button class="btn-primary" onclick={() => (showSuccess = false)}>
						Mergi la Dashboard →
					</button>
				</div>
			{:else}
				<div class="card">
					<div class="card-header">
						<h2>Creează cont</h2>
						<p class="card-sub">Alătură-te și organizează-te mai smart</p>
					</div>
 
					<div class="form">
						<div
							class="field"
							class:focused={focusedField === 'name'}
							class:filled={name.length > 0}
						>
							<label for="name">Nume</label>
							<div class="input-wrap">
								<span class="input-icon">
									<svg viewBox="0 0 20 20" fill="none">
										<circle cx="10" cy="7" r="3.5" stroke="currentColor" stroke-width="1.5" />
										<path
											d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6"
											stroke="currentColor"
											stroke-width="1.5"
											stroke-linecap="round"
										/>
									</svg>
								</span>
								<input
									id="name"
									type="text"
									placeholder="Numele tău complet"
									bind:value={name}
									onfocus={() => handleFocus('name')}
									onblur={handleBlur}
								/>
								<div class="input-line"></div>
							</div>
						</div>
 
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
								/>
								<div class="input-line"></div>
							</div>
						</div>
 
						<div
							class="field"
							class:focused={focusedField === 'password'}
							class:filled={password.length > 0}
						>
							<label for="password">Parolă</label>
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
									placeholder="Min. 8 caractere"
									bind:value={password}
									onfocus={() => handleFocus('password')}
									onblur={handleBlur}
								/>
								<div class="input-line"></div>
							</div>
						</div>
 
						<button
							class="btn-primary"
							class:loading={isLoading}
							onclick={handleSubmit}
							disabled={isLoading || !name || !email || !password}
						>
							{#if isLoading}
								<span class="spinner"></span>
								<span>Se creează contul…</span>
							{:else}
								<span>Conectează-te</span>
								<span class="btn-arrow">→</span>
							{/if}
						</button>
					</div>
 
					<div class="card-footer">
						<span>Ai deja cont?</span>
						<a href="/login" class="link">Intră în cont</a>
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
		--glass: rgba(255, 255, 255, 0.07);
 
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
 
	/* ===== WALL CLOCK ===== */
	.wall-clock {
		position: fixed;
		top: 16px;
		left: 16px;
		z-index: 10;
		opacity: 0;
		transform: scale(0.8) rotate(-6deg);
		transition:
			opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s,
			transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s;
		filter:
			drop-shadow(0 0 18px rgba(96, 165, 250, 0.5))
			drop-shadow(0 0 50px rgba(37, 99, 235, 0.25));
	}
 
	.page.mounted .wall-clock {
		opacity: 1;
		transform: scale(1) rotate(0deg);
	}
 
	@media (max-width: 768px) {
		.wall-clock {
			top: 8px;
			left: 8px;
		}
		.wall-clock svg {
			width: 140px;
			height: 140px;
		}
	}
	/* ===================== */
 
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
		color: var(--white);
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
		box-shadow:
			0 0 0 4px rgba(37, 99, 235, 0.08),
			0 4px 16px rgba(37, 99, 235, 0.1);
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
		box-shadow: 0 8px 24px rgba(37, 99, 235, 0.35);
	}
 
	.btn-primary::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, transparent 50%);
		opacity: 0;
		transition: opacity 0.3s;
	}
 
	.btn-primary:hover:not(:disabled)::before {
		opacity: 1;
	}
	.btn-primary:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 12px 32px rgba(37, 99, 235, 0.45);
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
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.7s linear infinite;
		flex-shrink: 0;
	}
 
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
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
		transition: color 0.2s;
	}
	.link:hover {
		color: var(--blue-500);
		text-decoration: underline;
	}
 
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
		box-shadow: 0 8px 32px rgba(37, 99, 235, 0.2);
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
		0%,
		100% {
			box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5);
		}
		50% {
			box-shadow: 0 0 0 6px rgba(59, 130, 246, 0);
		}
	}
 
	.success-state {
		background: rgba(255, 255, 255, 0.97);
		border-radius: 24px;
		padding: 48px 40px;
		text-align: center;
		box-shadow:
			0 0 0 1px rgba(37, 99, 235, 0.1),
			0 32px 80px rgba(10, 22, 40, 0.6);
		animation: successIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
	}
 
	@keyframes successIn {
		from {
			opacity: 0;
			transform: scale(0.8) translateY(20px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
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
		to {
			stroke-dashoffset: 0;
		}
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
		.bubble {
			right: 0;
			top: -56px;
			font-size: 12px;
		}
	}
</style>