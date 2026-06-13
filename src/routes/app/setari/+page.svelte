<script lang="ts">
	// --- Profil ---
	let profile = $state({
		name: '',
		school: '',
		grade: '',
		avatar: '' // initials fallback
	});

	const GRADES = ['V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

	// --- Materii ---
	type Subject = { id: string; name: string; teacher: string; color: string };

	const COLORS = [
		'#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
		'#f59e0b', '#10b981', '#06b6d4', '#3b82f6'
	];

	let subjects = $state<Subject[]>([
		{ id: '1', name: 'Matematică', teacher: '', color: '#6366f1' },
		{ id: '2', name: 'Română', teacher: '', color: '#ec4899' },
		{ id: '3', name: 'Fizică', teacher: '', color: '#06b6d4' },
	]);

	let newSubject = $state({ name: '', teacher: '', color: COLORS[0] });
	let addingSubject = $state(false);

	function addSubject() {
		if (!newSubject.name.trim()) return;
		subjects = [...subjects, {
			id: crypto.randomUUID(),
			name: newSubject.name.trim(),
			teacher: newSubject.teacher.trim(),
			color: newSubject.color
		}];
		newSubject = { name: '', teacher: '', color: COLORS[Math.floor(Math.random() * COLORS.length)] };
		addingSubject = false;
	}

	function removeSubject(id: string) {
		subjects = subjects.filter(s => s.id !== id);
	}

	// --- Notificări ---
	let notifs = $state({
		remindersEnabled: true,
		reminderTime: '08:00',
		homeworkAlert: true,
		testAlert: true,
		weeklyReport: false,
	});

	// --- Aspect ---
	let appearance = $state({
		compactMode: false,
		showMotivation: true,
		language: 'ro',
	});

	// --- Save feedback ---
	let saved = $state(false);
	function save() {
		saved = true;
		setTimeout(() => (saved = false), 2000);
	}

	let initials = $derived(
		profile.name
			.split(' ')
			.filter(Boolean)
			.slice(0, 2)
			.map(w => w[0].toUpperCase())
			.join('') || '?'
	);
</script>

<svelte:head>
	<title>Setări — Schedulify</title>
</svelte:head>

<div class="settings-page">
	<header class="settings-header">
		<div>
			<h1 class="settings-title">Setări</h1>
			<p class="settings-sub">Personalizează-ți experiența Schedulify</p>
		</div>
		<button class="save-btn" class:saved onclick={save}>
			{saved ? '✓ Salvat' : 'Salvează'}
		</button>
	</header>

	<!-- ── Profil ── -->
	<section class="section glass">
		<div class="section-label">Profilul meu</div>

		<div class="profile-row">
			<div class="avatar">
				<span>{initials}</span>
			</div>
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
							{#each GRADES as g}
								<option value={g}>{g}</option>
							{/each}
						</select>
					</div>
				</div>
				<div class="field">
					<label for="school">Școala</label>
					<input id="school" type="text" placeholder="ex: Colegiul Național Andrei Șaguna" bind:value={profile.school} />
				</div>
			</div>
		</div>
	</section>

	<!-- ── Materii & Profesori ── -->
	<section class="section glass">
		<div class="section-label">Materii & Profesori</div>
		<p class="section-desc">Materiile adăugate aici apar automat în orar și la generarea testelor.</p>

		<div class="subjects-list">
			{#each subjects as subj}
				<div class="subject-row">
					<span class="subj-dot" style="background:{subj.color}"></span>
					<div class="subj-info">
						<span class="subj-name">{subj.name}</span>
						{#if subj.teacher}
							<span class="subj-teacher">{subj.teacher}</span>
						{/if}
					</div>
					<button class="subj-remove" onclick={() => removeSubject(subj.id)} aria-label="Șterge materia">×</button>
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
								<button
									class="swatch-sm"
									class:active={newSubject.color === c}
									style="background:{c}"
									onclick={() => (newSubject.color = c)}
								></button>
							{/each}
						</div>
						<div class="add-form-btns">
							<button class="btn-ghost-sm" onclick={() => (addingSubject = false)}>Anulează</button>
							<button class="btn-primary-sm" onclick={addSubject} disabled={!newSubject.name.trim()}>Adaugă</button>
						</div>
					</div>
				</div>
			{:else}
				<button class="add-subject-btn" onclick={() => (addingSubject = true)}>
					<span>+</span> Adaugă materie
				</button>
			{/if}
		</div>
	</section>

	<!-- ── Notificări ── -->
	<section class="section glass">
		<div class="section-label">Notificări & Remindere</div>

		<div class="toggles">
			<div class="toggle-row">
				<div class="toggle-info">
					<span class="toggle-name">Remindere zilnice</span>
					<span class="toggle-desc">Primești o notificare cu orarul zilei</span>
				</div>
				<label class="switch">
					<input type="checkbox" bind:checked={notifs.remindersEnabled} />
					<span class="slider"></span>
				</label>
			</div>

			{#if notifs.remindersEnabled}
				<div class="indent-field">
					<label for="rtime">Ora reminder</label>
					<input id="rtime" type="time" bind:value={notifs.reminderTime} />
				</div>
			{/if}

			<div class="toggle-row">
				<div class="toggle-info">
					<span class="toggle-name">Teme de făcut</span>
					<span class="toggle-desc">Alertă cu o zi înainte de deadline</span>
				</div>
				<label class="switch">
					<input type="checkbox" bind:checked={notifs.homeworkAlert} />
					<span class="slider"></span>
				</label>
			</div>

			<div class="toggle-row">
				<div class="toggle-info">
					<span class="toggle-name">Teste programate</span>
					<span class="toggle-desc">Alertă cu două zile înainte de test</span>
				</div>
				<label class="switch">
					<input type="checkbox" bind:checked={notifs.testAlert} />
					<span class="slider"></span>
				</label>
			</div>

			<div class="toggle-row">
				<div class="toggle-info">
					<span class="toggle-name">Raport săptămânal</span>
					<span class="toggle-desc">Rezumatul activității tale din săptămână</span>
				</div>
				<label class="switch">
					<input type="checkbox" bind:checked={notifs.weeklyReport} />
					<span class="slider"></span>
				</label>
			</div>
		</div>
	</section>

	<!-- ── Aspect ── -->
	<section class="section glass">
		<div class="section-label">Preferințe aplicație</div>

		<div class="toggles">
			<div class="toggle-row">
				<div class="toggle-info">
					<span class="toggle-name">Mod compact</span>
					<span class="toggle-desc">Spațiere mai mică, mai mult conținut pe ecran</span>
				</div>
				<label class="switch">
					<input type="checkbox" bind:checked={appearance.compactMode} />
					<span class="slider"></span>
				</label>
			</div>

			<div class="toggle-row">
				<div class="toggle-info">
					<span class="toggle-name">Citate motivaționale</span>
					<span class="toggle-desc">Afișează un citat pe pagina principală</span>
				</div>
				<label class="switch">
					<input type="checkbox" bind:checked={appearance.showMotivation} />
					<span class="slider"></span>
				</label>
			</div>
		</div>
	</section>

	<!-- ── Danger zone ── -->
	<section class="section danger-section">
		<div class="section-label danger-label">Zona periculoasă</div>
		<div class="danger-row">
			<div>
				<span class="danger-name">Resetează toate datele</span>
				<span class="danger-desc">Șterge orarul, temele și setările. Acțiunea nu poate fi anulată.</span>
			</div>
			<button class="btn-danger-outline">Resetează</button>
		</div>
	</section>

	<div class="bottom-save">
		<button class="save-btn large" class:saved onclick={save}>
			{saved ? '✓ Modificările au fost salvate' : 'Salvează modificările'}
		</button>
	</div>
</div>

<style>
	.settings-page {
		max-width: 720px;
		padding-bottom: 5rem;
	}

	.settings-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: 2rem;
		gap: 1rem;
	}

	.settings-title {
		font-family: var(--font-display);
		font-size: 2rem;
		font-weight: 800;
		margin: 0 0 0.25rem;
		letter-spacing: -0.03em;
	}

	.settings-sub {
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.35);
		margin: 0;
	}

	/* Save button */
	.save-btn {
		background: rgba(99, 102, 241, 0.15);
		border: 1px solid rgba(99, 102, 241, 0.3);
		color: #a5b4fc;
		padding: 0.55rem 1.2rem;
		border-radius: var(--radius-md, 10px);
		font-size: 0.83rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.save-btn:hover {
		background: rgba(99, 102, 241, 0.25);
	}

	.save-btn.saved {
		background: rgba(16, 185, 129, 0.15);
		border-color: rgba(16, 185, 129, 0.3);
		color: #6ee7b7;
	}

	.save-btn.large {
		padding: 0.75rem 2rem;
		font-size: 0.9rem;
	}

	/* Sections */
	.section {
		border-radius: var(--radius-lg, 16px);
		padding: 1.4rem 1.5rem;
		margin-bottom: 1rem;
	}

	.section-label {
		font-size: 0.7rem;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.35);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		margin-bottom: 1.1rem;
	}

	.section-desc {
		font-size: 0.78rem;
		color: rgba(255, 255, 255, 0.3);
		margin: -0.6rem 0 1rem;
	}

	/* Profile */
	.profile-row {
		display: flex;
		gap: 1.25rem;
		align-items: flex-start;
	}

	.avatar {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: rgba(99, 102, 241, 0.2);
		border: 2px solid rgba(99, 102, 241, 0.3);
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 800;
		color: #a5b4fc;
		flex-shrink: 0;
	}

	.profile-fields {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.field-row {
		display: flex;
		gap: 0.75rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		flex: 1;
	}

	.field-sm { flex: 0 0 80px; }

	label {
		font-size: 0.7rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.35);
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	input[type="text"], input[type="time"], select {
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.09);
		border-radius: var(--radius-md, 10px);
		padding: 0.55rem 0.8rem;
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.85);
		outline: none;
		transition: border-color 0.15s;
		width: 100%;
		box-sizing: border-box;
	}

	input:focus, select:focus {
		border-color: rgba(99, 102, 241, 0.45);
	}

	input::placeholder { color: rgba(255, 255, 255, 0.2); }

	select option {
		background: #1a1a2e;
		color: rgba(255,255,255,0.85);
	}

	/* Subjects */
	.subjects-list {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.subject-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.6rem 0.75rem;
		background: rgba(255, 255, 255, 0.04);
		border-radius: var(--radius-md, 10px);
		border: 1px solid rgba(255, 255, 255, 0.05);
	}

	.subj-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.subj-info {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.subj-name {
		font-size: 0.85rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.8);
	}

	.subj-teacher {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.3);
	}

	.subj-remove {
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.2);
		font-size: 1.1rem;
		cursor: pointer;
		padding: 0;
		transition: color 0.15s;
	}

	.subj-remove:hover { color: #f43f5e; }

	/* Add form */
	.add-form {
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: var(--radius-md, 10px);
		padding: 0.85rem;
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	.add-form-fields {
		display: flex;
		gap: 0.5rem;
	}

	.add-form-fields input {
		flex: 1;
	}

	.add-form-bottom {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.color-picker-sm {
		display: flex;
		gap: 0.35rem;
	}

	.swatch-sm {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		border: 2px solid transparent;
		cursor: pointer;
		transition: transform 0.12s, border-color 0.12s;
	}

	.swatch-sm.active { border-color: #fff; transform: scale(1.2); }
	.swatch-sm:hover { transform: scale(1.1); }

	.add-form-btns {
		display: flex;
		gap: 0.4rem;
	}

	.btn-ghost-sm, .btn-primary-sm {
		padding: 0.4rem 0.85rem;
		border-radius: 8px;
		font-size: 0.78rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
	}

	.btn-ghost-sm {
		background: rgba(255,255,255,0.05);
		border: 1px solid rgba(255,255,255,0.08);
		color: rgba(255,255,255,0.45);
	}

	.btn-primary-sm {
		background: #6366f1;
		border: none;
		color: #fff;
	}

	.btn-primary-sm:hover:not(:disabled) { background: #4f46e5; }
	.btn-primary-sm:disabled { opacity: 0.35; cursor: not-allowed; }

	.add-subject-btn {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.55rem 0.75rem;
		background: rgba(99, 102, 241, 0.06);
		border: 1px dashed rgba(99, 102, 241, 0.25);
		border-radius: var(--radius-md, 10px);
		color: rgba(99, 102, 241, 0.7);
		font-size: 0.82rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
		width: 100%;
		justify-content: center;
	}

	.add-subject-btn:hover {
		background: rgba(99, 102, 241, 0.1);
		border-color: rgba(99, 102, 241, 0.4);
		color: #a5b4fc;
	}

	/* Toggles */
	.toggles {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.toggle-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.8rem 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.04);
	}

	.toggles > .toggle-row:last-child { border-bottom: none; }

	.toggle-info {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.toggle-name {
		font-size: 0.85rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.8);
	}

	.toggle-desc {
		font-size: 0.73rem;
		color: rgba(255, 255, 255, 0.3);
	}

	/* Toggle switch */
	.switch {
		position: relative;
		display: inline-block;
		width: 42px;
		height: 24px;
		flex-shrink: 0;
	}

	.switch input { opacity: 0; width: 0; height: 0; }

	.slider {
		position: absolute;
		inset: 0;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 100px;
		cursor: pointer;
		transition: background 0.2s;
	}

	.slider::before {
		content: '';
		position: absolute;
		height: 18px;
		width: 18px;
		left: 3px;
		top: 3px;
		background: rgba(255, 255, 255, 0.5);
		border-radius: 50%;
		transition: transform 0.2s, background 0.2s;
	}

	.switch input:checked + .slider {
		background: rgba(99, 102, 241, 0.6);
	}

	.switch input:checked + .slider::before {
		transform: translateX(18px);
		background: #fff;
	}

	/* Indent field */
	.indent-field {
		padding: 0 0 0.75rem 0;
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.indent-field label {
		color: rgba(255,255,255,0.3);
		text-transform: uppercase;
		font-size: 0.68rem;
		letter-spacing: 0.05em;
		white-space: nowrap;
	}

	.indent-field input {
		max-width: 120px;
	}

	/* Danger zone */
	.danger-section {
		background: rgba(244, 63, 94, 0.04);
		border: 1px solid rgba(244, 63, 94, 0.12);
	}

	.danger-label { color: rgba(244, 63, 94, 0.5); }

	.danger-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.danger-name {
		display: block;
		font-size: 0.85rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.7);
		margin-bottom: 0.2rem;
	}

	.danger-desc {
		display: block;
		font-size: 0.73rem;
		color: rgba(255, 255, 255, 0.28);
	}

	.btn-danger-outline {
		background: none;
		border: 1px solid rgba(244, 63, 94, 0.35);
		color: #f43f5e;
		padding: 0.5rem 1rem;
		border-radius: var(--radius-md, 10px);
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s;
		white-space: nowrap;
	}

	.btn-danger-outline:hover {
		background: rgba(244, 63, 94, 0.08);
	}

	/* Bottom save */
	.bottom-save {
		display: flex;
		justify-content: flex-end;
		margin-top: 1.5rem;
	}

	@media (max-width: 560px) {
		.profile-row { flex-direction: column; }
		.field-row { flex-direction: column; }
		.field-sm { flex: 1; }
		.danger-row { flex-direction: column; align-items: flex-start; }
		.add-form-fields { flex-direction: column; }
		.settings-header { flex-direction: column; }
	}
</style>