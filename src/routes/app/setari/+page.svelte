<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	type Theme = 'dark' | 'light';
	type Accent = 'blue' | 'violet' | 'emerald' | 'rose' | 'amber';

	const DEFAULT_PROFILE = { name: '', school: '', grade: '' };
	const DEFAULT_SUBJECTS: Array<{ id: string; name: string; teacher: string; color: string }> = [
		{ id: '1', name: 'Matematică', teacher: '', color: '#6366f1' },
		{ id: '2', name: 'Română',     teacher: '', color: '#ec4899' },
		{ id: '3', name: 'Fizică',     teacher: '', color: '#06b6d4' },
	];
	const DEFAULT_PREFS = { theme: 'dark' as Theme, accent: 'blue' as Accent };

	const ACCENTS: { id: Accent; label: string; hex: string }[] = [
		{ id: 'blue',    label: 'Albastru',   hex: '#2563eb' },
		{ id: 'violet',  label: 'Violet',     hex: '#7c3aed' },
		{ id: 'emerald', label: 'Verde',      hex: '#059669' },
		{ id: 'rose',    label: 'Roșu',       hex: '#e11d48' },
		{ id: 'amber',   label: 'Portocaliu', hex: '#d97706' },
	];
	const COLORS = ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#f59e0b','#10b981','#06b6d4','#3b82f6'];
	const GRADES = ['V','VI','VII','VIII','IX','X','XI','XII'];

	function load<T>(key: string, fallback: T): T {
		if (!browser) return fallback;
		try { const r = localStorage.getItem(key); return r ? { ...fallback as any, ...JSON.parse(r) } : fallback; }
		catch { return fallback; }
	}
	function save(key: string, val: unknown) {
		if (!browser) return;
		try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
	}

	function applyAll(p: typeof DEFAULT_PREFS) {
		if (!browser) return;
		document.documentElement.setAttribute('data-theme', p.theme);
		const hex = ACCENTS.find(x => x.id === p.accent)?.hex ?? '#2563eb';
		document.documentElement.style.setProperty('--color-accent', hex);
	}

	let profile  = $state(load('schedulify_profile', DEFAULT_PROFILE));
	let subjects = $state<Array<{ id: string; name: string; teacher: string; color: string }>>(load('schedulify_subjects', DEFAULT_SUBJECTS));
	let prefs    = $state(load('schedulify_prefs_v2', DEFAULT_PREFS));
	let addingSubject  = $state(false);
	let newSubject     = $state({ name: '', teacher: '', color: COLORS[0] });
	let saved          = $state(false);
	let resetConfirmed = $state(false);

	function addSubject() {
		if (!newSubject.name.trim()) return;
		subjects = [...subjects, { id: crypto.randomUUID(), name: newSubject.name.trim(), teacher: newSubject.teacher.trim(), color: newSubject.color }];
		newSubject = { name: '', teacher: '', color: COLORS[Math.floor(Math.random() * COLORS.length)] };
		addingSubject = false;
		save('schedulify_subjects', subjects);
	}
	function removeSubject(id: string) { subjects = subjects.filter(s => s.id !== id); save('schedulify_subjects', subjects); }

	function saveAll() {
		save('schedulify_profile', profile);
		save('schedulify_subjects', subjects);
		save('schedulify_prefs_v2', prefs);
		applyAll(prefs);
		saved = true;
		setTimeout(() => (saved = false), 2000);
	}

	function resetData() {
		if (!resetConfirmed) { resetConfirmed = true; setTimeout(() => (resetConfirmed = false), 3000); return; }
		['schedulify_profile','schedulify_subjects','schedulify_prefs_v2','schedulify_timetable','schedulify_slot_times','schedulify_calendar_events'].forEach(k => localStorage.removeItem(k));
		profile = { ...DEFAULT_PROFILE }; subjects = [...DEFAULT_SUBJECTS]; prefs = { ...DEFAULT_PREFS };
		applyAll(prefs); resetConfirmed = false; saved = true; setTimeout(() => (saved = false), 2000);
	}

	let initials = $derived(profile.name.split(' ').filter(Boolean).slice(0,2).map((w: string) => w[0].toUpperCase()).join('') || '?');
	onMount(() => { applyAll(prefs); });
</script>

<svelte:head><title>Setări — Schedulify</title></svelte:head>

<div class="settings-page">
	<header class="settings-header">
		<div>
			<h1 class="settings-title">Setări</h1>
			<p class="settings-sub">Personalizează-ți experiența Schedulify</p>
		</div>
		<button class="save-btn" class:saved onclick={saveAll}>{saved ? '✓ Salvat' : 'Salvează'}</button>
	</header>

	<section class="section glass">
		<div class="section-label">Profilul meu</div>
		<div class="profile-row">
			<div class="avatar"><span>{initials}</span></div>
			<div class="profile-fields">
				<div class="field-row">
					<div class="field">
						<label for="name">Numele tău</label>
						<input id="name" type="text" placeholder="ex: Andrei Popescu" bind:value={profile.name} />
					</div>
					<div class="field field-sm">
						<label for="grade">Clasa</label>
						<select id="grade" bind:value={profile.grade}>
							<option value="">—</option>
							{#each GRADES as g}<option value={g}>{g}</option>{/each}
						</select>
					</div>
				</div>
				<div class="field">
					<label for="school">Școala</label>
					<input id="school" type="text" placeholder="ex: Colegiul Național..." bind:value={profile.school} />
				</div>
			</div>
		</div>
	</section>

	<section class="section glass">
		<div class="section-label">Materii & Profesori</div>
		<p class="section-desc">Materiile adăugate aici apar automat în orar și la generarea testelor.</p>
		<div class="subjects-list">
			{#each subjects as subj}
				<div class="subject-row">
					<span class="subj-dot" style="background:{subj.color}"></span>
					<div class="subj-info">
						<span class="subj-name">{subj.name}</span>
						{#if subj.teacher}<span class="subj-teacher">{subj.teacher}</span>{/if}
					</div>
					<button class="subj-remove" onclick={() => removeSubject(subj.id)}>×</button>
				</div>
			{/each}
			{#if addingSubject}
				<div class="add-form">
					<div class="add-form-fields">
						<input type="text" placeholder="Materie *" bind:value={newSubject.name} onkeydown={(e) => e.key === 'Enter' && addSubject()} />
						<input type="text" placeholder="Profesor (opțional)" bind:value={newSubject.teacher} onkeydown={(e) => e.key === 'Enter' && addSubject()} />
					</div>
					<div class="add-form-bottom">
						<div class="color-picker-sm">
							{#each COLORS as c}
								<button class="swatch-sm" class:active={newSubject.color === c} style="background:{c}" onclick={() => (newSubject.color = c)}></button>
							{/each}
						</div>
						<div class="add-form-btns">
							<button class="btn-ghost-sm" onclick={() => (addingSubject = false)}>Anulează</button>
							<button class="btn-primary-sm" onclick={addSubject} disabled={!newSubject.name.trim()}>Adaugă</button>
						</div>
					</div>
				</div>
			{:else}
				<button class="add-subject-btn" onclick={() => (addingSubject = true)}>+ Adaugă materie</button>
			{/if}
		</div>
	</section>

	<section class="section glass">
		<div class="section-label">Aspect</div>

		<div class="pref-block">
			<span class="pref-name">Temă</span>
			<span class="pref-desc">Schimbă între modul întunecat și luminos.</span>
			<div class="theme-row">
				<button class="theme-btn" class:active={prefs.theme === 'dark'} onclick={() => (prefs = { ...prefs, theme: 'dark' })}>🌙 Întunecat</button>
				<button class="theme-btn" class:active={prefs.theme === 'light'} onclick={() => (prefs = { ...prefs, theme: 'light' })}>☀️ Luminos</button>
			</div>
		</div>

		<div class="pref-block" style="margin-bottom:0">
			<span class="pref-name">Culoare accent</span>
			<span class="pref-desc">Se aplică pe butoane și elemente active din toată aplicația.</span>
			<div class="accent-grid">
				{#each ACCENTS as a}
					<button class="accent-btn" class:active={prefs.accent === a.id} style="--c: {a.hex}" onclick={() => (prefs = { ...prefs, accent: a.id })}>
						<span class="accent-dot"></span>
						<span>{a.label}</span>
						{#if prefs.accent === a.id}<span class="accent-check">✓</span>{/if}
					</button>
				{/each}
			</div>
		</div>
	</section>

	<section class="section danger-section">
		<div class="section-label danger-label">Zona periculoasă</div>
		<div class="danger-row">
			<div>
				<span class="danger-name">Resetează toate datele</span>
				<span class="danger-desc">Șterge orarul, temele și setările. Acțiunea nu poate fi anulată.</span>
			</div>
			<button class="btn-danger-outline" class:active={resetConfirmed} onclick={resetData}>
				{resetConfirmed ? '✓ Confirmă' : 'Resetează'}
			</button>
		</div>
	</section>
</div>

<style>
	/* ── Light mode overrides ── */
	:global([data-theme="light"]) {
		--bg-page:        #f0f4f8;
		--bg-card:        #ffffff;
		--bg-card-hover:  #f8fafc;
		--bg-input:       #f1f5f9;
		--border-card:    #e2e8f0;
		--border-input:   #cbd5e1;
		--text-primary:   #0f172a;
		--text-secondary: #475569;
		--text-muted:     #94a3b8;
		--bg-glass:       rgba(255,255,255,0.85);
	}
	:global([data-theme="light"] body),
	:global([data-theme="light"] .shell) { background: var(--bg-page) !important; }

	:global([data-theme="light"] .card),
	:global([data-theme="light"] .bento-card) {
		background: var(--bg-card) !important;
		color: var(--text-primary) !important;
		border-color: var(--border-card) !important;
	}
	:global([data-theme="light"] .top-header h2) { color: var(--text-primary) !important; }
	:global([data-theme="light"] .top-header p)  { color: var(--text-secondary) !important; }
	:global([data-theme="light"] .brand-title) {
		background: linear-gradient(135deg, #0a1628, #2563eb) !important;
		-webkit-background-clip: text !important;
		-webkit-text-fill-color: transparent !important;
	}
	:global([data-theme="light"] .menu-item) { color: var(--text-secondary) !important; }
	:global([data-theme="light"] .menu-item:hover) { background: #e2e8f0 !important; color: var(--text-primary) !important; }

	/* Light mode for this page specifically */
	:global([data-theme="light"]) .settings-title { color: #0f172a; }
	:global([data-theme="light"]) .settings-sub   { color: #64748b; }
	:global([data-theme="light"]) .glass {
		background: rgba(255,255,255,0.9);
		border-color: #e2e8f0;
		backdrop-filter: blur(12px);
	}
	:global([data-theme="light"]) .section-label  { color: #64748b; }
	:global([data-theme="light"]) .section-desc   { color: #94a3b8; }
	:global([data-theme="light"]) .pref-name      { color: #0f172a; }
	:global([data-theme="light"]) .pref-desc      { color: #64748b; }
	:global([data-theme="light"]) label            { color: #64748b; }

	:global([data-theme="light"]) input[type="text"],
	:global([data-theme="light"]) select {
		background: #f1f5f9;
		border-color: #cbd5e1;
		color: #0f172a;
	}
	:global([data-theme="light"]) input[type="text"]:focus,
	:global([data-theme="light"]) select:focus { border-color: #2563eb; }
	:global([data-theme="light"]) input::placeholder { color: #94a3b8; }
	:global([data-theme="light"]) select option { background: #fff; color: #0f172a; }

	:global([data-theme="light"]) .avatar {
		background: rgba(99,102,241,0.1);
		border-color: rgba(99,102,241,0.25);
		color: #6366f1;
	}
	:global([data-theme="light"]) .subject-row {
		background: #f8fafc;
		border-color: #e2e8f0;
	}
	:global([data-theme="light"]) .subj-name    { color: #0f172a; }
	:global([data-theme="light"]) .subj-teacher { color: #94a3b8; }
	:global([data-theme="light"]) .subj-remove  { color: #cbd5e1; }
	:global([data-theme="light"]) .subj-remove:hover { color: #f43f5e; }

	:global([data-theme="light"]) .add-form {
		background: #f8fafc;
		border-color: #e2e8f0;
	}
	:global([data-theme="light"]) .add-subject-btn {
		background: rgba(99,102,241,0.06);
		border-color: rgba(99,102,241,0.3);
		color: #6366f1;
	}
	:global([data-theme="light"]) .add-subject-btn:hover {
		background: rgba(99,102,241,0.1);
		color: #4f46e5;
	}
	:global([data-theme="light"]) .btn-ghost-sm {
		background: #f1f5f9;
		border-color: #e2e8f0;
		color: #64748b;
	}
	:global([data-theme="light"]) .theme-btn {
		background: #f1f5f9;
		border-color: #e2e8f0;
		color: #64748b;
	}
	:global([data-theme="light"]) .theme-btn:hover  { border-color: #2563eb; }
	:global([data-theme="light"]) .theme-btn.active {
		background: rgba(37,99,235,0.08);
		border-color: rgba(37,99,235,0.4);
		color: #0f172a;
	}
	:global([data-theme="light"]) .accent-btn {
		background: #f8fafc;
		border-color: #e2e8f0;
		color: #64748b;
	}
	:global([data-theme="light"]) .accent-btn.active { color: #0f172a; }

	:global([data-theme="light"]) .save-btn {
		background: rgba(99,102,241,0.08);
		border-color: rgba(99,102,241,0.25);
		color: #6366f1;
	}
	:global([data-theme="light"]) .save-btn:hover  { background: rgba(99,102,241,0.14); }
	:global([data-theme="light"]) .save-btn.saved  {
		background: rgba(16,185,129,0.08);
		border-color: rgba(16,185,129,0.25);
		color: #059669;
	}
	:global([data-theme="light"]) .danger-section {
		background: rgba(244,63,94,0.03);
		border-color: rgba(244,63,94,0.15);
	}
	:global([data-theme="light"]) .danger-name { color: #0f172a; }
	:global([data-theme="light"]) .danger-desc { color: #94a3b8; }

	:global(.menu-item.active) { background: var(--color-accent, #2563eb) !important; }

	/* ── Page layout ── */
	.settings-page { max-width: 720px; padding-bottom: 3rem; }
	.settings-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 2rem; gap: 1rem; }
	.settings-title { font-family: var(--font-display, 'Syne', sans-serif); font-size: 2rem; font-weight: 800; margin: 0 0 0.25rem; letter-spacing: -0.03em; color: rgba(255,255,255,0.9); }
	.settings-sub   { font-size: 0.85rem; color: rgba(255,255,255,0.35); margin: 0; }

	.save-btn { background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); color: #a5b4fc; padding: 0.55rem 1.2rem; border-radius: 10px; font-size: 0.83rem; font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap; font-family: inherit; }
	.save-btn:hover  { background: rgba(99,102,241,0.25); }
	.save-btn.saved  { background: rgba(16,185,129,0.15); border-color: rgba(16,185,129,0.3); color: #6ee7b7; }

	.section       { border-radius: 16px; padding: 1.4rem 1.5rem; margin-bottom: 1rem; }
	.glass         { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(12px); }
	.section-label { font-size: 0.7rem; font-weight: 700; color: rgba(255,255,255,0.35); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 1.1rem; }
	.section-desc  { font-size: 0.78rem; color: rgba(255,255,255,0.3); margin: -0.6rem 0 1rem; }

	.profile-row    { display: flex; gap: 1.25rem; align-items: flex-start; }
	.avatar         { width: 56px; height: 56px; border-radius: 50%; background: rgba(99,102,241,0.2); border: 2px solid rgba(99,102,241,0.3); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: 800; color: #a5b4fc; flex-shrink: 0; }
	.profile-fields { flex: 1; display: flex; flex-direction: column; gap: 0.75rem; }
	.field-row      { display: flex; gap: 0.75rem; }
	.field          { display: flex; flex-direction: column; gap: 0.3rem; flex: 1; }
	.field-sm       { flex: 0 0 80px; }
	label { font-size: 0.7rem; font-weight: 600; color: rgba(255,255,255,0.35); letter-spacing: 0.04em; text-transform: uppercase; }
	input[type="text"], select { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.09); border-radius: 10px; padding: 0.55rem 0.8rem; font-size: 0.85rem; color: rgba(255,255,255,0.85); outline: none; transition: border-color 0.15s; width: 100%; box-sizing: border-box; font-family: inherit; }
	input:focus, select:focus { border-color: rgba(99,102,241,0.45); }
	input::placeholder { color: rgba(255,255,255,0.2); }
	select option  { background: #1a1a2e; color: rgba(255,255,255,0.85); }

	.subjects-list { display: flex; flex-direction: column; gap: 0.4rem; }
	.subject-row   { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.75rem; background: rgba(255,255,255,0.04); border-radius: 10px; border: 1px solid rgba(255,255,255,0.05); }
	.subj-dot      { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
	.subj-info     { flex: 1; display: flex; align-items: center; gap: 0.75rem; }
	.subj-name     { font-size: 0.85rem; font-weight: 600; color: rgba(255,255,255,0.8); }
	.subj-teacher  { font-size: 0.75rem; color: rgba(255,255,255,0.3); }
	.subj-remove   { background: none; border: none; color: rgba(255,255,255,0.2); font-size: 1.1rem; cursor: pointer; padding: 0; transition: color 0.15s; }
	.subj-remove:hover { color: #f43f5e; }

	.add-form        { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 0.85rem; display: flex; flex-direction: column; gap: 0.65rem; }
	.add-form-fields { display: flex; gap: 0.5rem; }
	.add-form-fields input { flex: 1; }
	.add-form-bottom { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap; }
	.color-picker-sm { display: flex; gap: 0.35rem; }
	.swatch-sm       { width: 20px; height: 20px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: transform 0.12s, border-color 0.12s; }
	.swatch-sm.active { border-color: #fff; transform: scale(1.2); }
	.swatch-sm:hover  { transform: scale(1.1); }
	.add-form-btns   { display: flex; gap: 0.4rem; }
	.btn-ghost-sm, .btn-primary-sm { padding: 0.4rem 0.85rem; border-radius: 8px; font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: inherit; }
	.btn-ghost-sm    { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.45); }
	.btn-primary-sm  { background: #6366f1; border: none; color: #fff; }
	.btn-primary-sm:hover:not(:disabled) { background: #4f46e5; }
	.btn-primary-sm:disabled { opacity: 0.35; cursor: not-allowed; }
	.add-subject-btn { display: flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.55rem 0.75rem; width: 100%; background: rgba(99,102,241,0.06); border: 1px dashed rgba(99,102,241,0.25); border-radius: 10px; color: rgba(99,102,241,0.7); font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: inherit; }
	.add-subject-btn:hover { background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.4); color: #a5b4fc; }

	.pref-block  { margin-bottom: 1.4rem; }
	.pref-name   { display: block; font-size: 0.85rem; font-weight: 600; color: rgba(255,255,255,0.8); margin-bottom: 0.2rem; }
	.pref-desc   { display: block; font-size: 0.73rem; color: rgba(255,255,255,0.3); margin-bottom: 0.75rem; }

	.theme-row { display: flex; gap: 10px; }
	.theme-btn { flex: 1; padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.5); font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: inherit; }
	.theme-btn:hover  { border-color: rgba(99,102,241,0.4); }
	.theme-btn.active { border-color: rgba(99,102,241,0.6); background: rgba(99,102,241,0.12); color: rgba(255,255,255,0.9); }

	.accent-grid { display: flex; gap: 8px; flex-wrap: wrap; }
	.accent-btn  { display: flex; align-items: center; gap: 7px; padding: 8px 13px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04); cursor: pointer; font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.5); transition: all 0.15s; font-family: inherit; }
	.accent-btn:hover  { border-color: var(--c); }
	.accent-btn.active { border-color: var(--c); background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.9); }
	.accent-dot  { width: 14px; height: 14px; border-radius: 50%; background: var(--c); flex-shrink: 0; }
	.accent-check { font-size: 10px; color: var(--c); font-weight: 700; }

	.danger-section { background: rgba(244,63,94,0.04); border: 1px solid rgba(244,63,94,0.12); }
	.danger-label   { color: rgba(244,63,94,0.5); }
	.danger-row     { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
	.danger-name    { display: block; font-size: 0.85rem; font-weight: 600; color: rgba(255,255,255,0.7); margin-bottom: 0.2rem; }
	.danger-desc    { display: block; font-size: 0.73rem; color: rgba(255,255,255,0.28); }
	.btn-danger-outline { background: none; border: 1px solid rgba(244,63,94,0.35); color: #f43f5e; padding: 0.5rem 1rem; border-radius: 10px; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.15s; white-space: nowrap; font-family: inherit; }
	.btn-danger-outline:hover  { background: rgba(244,63,94,0.08); }
	.btn-danger-outline.active { background: rgba(244,63,94,0.15); border-color: rgba(244,63,94,0.5); color: #fca5a5; }

	@media (max-width: 560px) {
		.profile-row, .field-row, .add-form-fields { flex-direction: column; }
		.field-sm { flex: 1; }
		.danger-row, .settings-header { flex-direction: column; }
	}
</style>