<script lang="ts">
	const DAYS = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri'];
	const HOUR_SLOTS = Array.from({ length: 9 }, (_, i) => `Ora ${i + 1}`);

	type Entry = {
		id: string;
		subject: string;
		teacher: string;
		room: string;
		color: string;
	};

	const COLORS = [
		'#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
		'#f43f5e', '#f59e0b', '#10b981', '#06b6d4'
	];

	let timetable = $state<Record<string, Record<number, Entry | null>>>(
		Object.fromEntries(DAYS.map(d => [d, Object.fromEntries(HOUR_SLOTS.map((_, i) => [i, null]))]))
	);

	let editTarget = $state<{ day: string; slot: number } | null>(null);
	let editData = $state({ subject: '', teacher: '', room: '', color: COLORS[0] });
	let showModal = $state(false);

	function openEdit(day: string, slot: number) {
		editTarget = { day, slot };
		const existing = timetable[day][slot];
		editData = existing
			? { subject: existing.subject, teacher: existing.teacher, room: existing.room, color: existing.color }
			: { subject: '', teacher: '', room: '', color: COLORS[Math.floor(Math.random() * COLORS.length)] };
		showModal = true;
	}

	function saveEntry() {
		if (!editTarget || !editData.subject.trim()) return;
		const { day, slot } = editTarget;
		timetable[day][slot] = {
			id: crypto.randomUUID(),
			subject: editData.subject.trim(),
			teacher: editData.teacher.trim(),
			room: editData.room.trim(),
			color: editData.color
		};
		timetable = { ...timetable };
		showModal = false;
	}

	function removeEntry(day: string, slot: number) {
		timetable[day][slot] = null;
		timetable = { ...timetable };
	}

	function closeModal() {
		showModal = false;
		editTarget = null;
	}

	let totalEntries = $derived(
		Object.values(timetable).flatMap(d => Object.values(d)).filter(Boolean).length
	);
</script>

<div class="orar-page">
	<header class="page-header">
		<div>
			<h1 class="page-title">Orarul meu</h1>
			<p class="page-sub">
				{totalEntries > 0
					? `${totalEntries} ore adăugate · Apasă o celulă ca să o editezi`
					: 'Apasă pe orice celulă ca să adaugi o oră'}
			</p>
		</div>
	</header>

	<div class="table-wrapper">
		<div class="orar-grid" style="grid-template-columns: 64px repeat({DAYS.length}, 1fr)">
			<div class="cell head-corner"></div>
			{#each DAYS as day}
				<div class="cell head-day">{day}</div>
			{/each}

			{#each HOUR_SLOTS as label, slot}
				<div class="cell slot-label">
					<span class="slot-num">{slot + 1}</span>
					<span class="slot-text">ora</span>
				</div>
				{#each DAYS as day}
					{@const entry = timetable[day][slot]}
					<button
						class="cell entry-cell"
						class:has-entry={!!entry}
						onclick={() => openEdit(day, slot)}
						style={entry ? `--entry-color: ${entry.color}` : ''}
					>
						{#if entry}
							<span class="entry-dot" style="background:{entry.color}"></span>
							<div class="entry-body">
								<span class="entry-subject">{entry.subject}</span>
								{#if entry.teacher}<span class="entry-meta">{entry.teacher}</span>{/if}
								{#if entry.room}<span class="entry-room">📍 {entry.room}</span>{/if}
							</div>
							<button
								class="remove-btn"
								onclick={(e) => { e.stopPropagation(); removeEntry(day, slot); }}
								aria-label="Șterge"
							>×</button>
						{:else}
							<span class="add-hint">+</span>
						{/if}
					</button>
				{/each}
			{/each}
		</div>
	</div>
</div>

{#if showModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={closeModal}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2 class="modal-title">
					{editTarget ? `${editTarget.day} · Ora ${(editTarget.slot ?? 0) + 1}` : 'Adaugă oră'}
				</h2>
				<button class="modal-close" onclick={closeModal}>×</button>
			</div>

			<div class="modal-body">
				<div class="field">
					<label for="subject">Materie *</label>
					<input id="subject" type="text" placeholder="ex: Matematică" bind:value={editData.subject} onkeydown={(e) => e.key === 'Enter' && saveEntry()} />
				</div>
				<div class="field">
					<label for="teacher">Profesor</label>
					<input id="teacher" type="text" placeholder="ex: Prof. Ionescu" bind:value={editData.teacher} />
				</div>
				<div class="field">
					<label for="room">Sala</label>
					<input id="room" type="text" placeholder="ex: 214" bind:value={editData.room} />
				</div>
				<div class="field">
					<label>Culoare</label>
					<div class="color-picker">
						{#each COLORS as c}
							<button
								class="color-swatch"
								class:active={editData.color === c}
								style="background:{c}"
								onclick={() => (editData.color = c)}
								aria-label="Culoare {c}"
							></button>
						{/each}
					</div>
				</div>
			</div>

			<div class="modal-footer">
				{#if editTarget && timetable[editTarget.day][editTarget.slot]}
					<button class="btn-danger" onclick={() => { removeEntry(editTarget!.day, editTarget!.slot); closeModal(); }}>Șterge ora</button>
				{:else}
					<span></span>
				{/if}
				<div class="btn-group">
					<button class="btn-ghost" onclick={closeModal}>Anulează</button>
					<button class="btn-primary" onclick={saveEntry} disabled={!editData.subject.trim()}>Salvează</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.orar-page {
		max-width: 1100px;
		padding-bottom: 4rem;
	}

	.page-header { margin-bottom: 1.75rem; }

	.page-title {
		font-family: 'Syne', sans-serif;
		font-size: 2rem;
		font-weight: 800;
		margin: 0 0 0.25rem;
		letter-spacing: -0.03em;
		color: white;
	}

	.page-sub {
		font-size: 0.85rem;
		color: rgba(191, 219, 254, 0.6);
		margin: 0;
	}

	.table-wrapper {
		background: rgba(255, 255, 255, 0.95);
		border-radius: 24px;
		box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.1), 0 16px 40px rgba(10, 22, 40, 0.4);
		overflow-x: auto;
	}

	.orar-grid {
		display: grid;
		min-width: 560px;
	}

	.cell {
		padding: 0.6rem 0.5rem;
		border-bottom: 1px solid #f1f5f9;
		border-right: 1px solid #f1f5f9;
		min-height: 72px;
		position: relative;
	}

	.cell:last-child { border-right: none; }

	.head-corner {
		background: transparent;
		border-bottom: 1px solid #e2e8f0;
		min-height: 44px;
	}

	.head-day {
		font-size: 0.72rem;
		font-weight: 700;
		color: #94a3b8;
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
		background: transparent;
		border-bottom: 1px solid #e2e8f0;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		min-height: 44px;
	}

	.slot-label {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.1rem;
		border-right: 1px solid #e2e8f0;
		background: transparent;
	}

	.slot-num {
		font-family: 'Syne', sans-serif;
		font-size: 1.1rem;
		font-weight: 800;
		color: #cbd5e1;
		line-height: 1;
	}

	.slot-text {
		font-size: 0.55rem;
		color: #cbd5e1;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.entry-cell {
		background: transparent;
		border: none;
		cursor: pointer;
		text-align: left;
		transition: background 0.15s;
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.65rem 0.6rem;
		font-family: 'DM Sans', sans-serif;
		width: 100%;
	}

	.entry-cell:hover { background: #f8fafc; }
	.entry-cell.has-entry { background: transparent; }
	.entry-cell.has-entry:hover { background: #f1f5f9; }

	.entry-dot {
		width: 3px;
		border-radius: 2px;
		align-self: stretch;
		flex-shrink: 0;
		min-height: 36px;
	}

	.entry-body {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		flex: 1;
		min-width: 0;
	}

	.entry-subject {
		font-size: 0.82rem;
		font-weight: 700;
		color: #0f2347;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.entry-meta {
		font-size: 0.7rem;
		color: #94a3b8;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.entry-room {
		font-size: 0.65rem;
		color: #cbd5e1;
	}

	.add-hint {
		font-size: 1.1rem;
		color: #cbd5e1;
		margin: auto;
		transition: color 0.15s;
	}

	.entry-cell:hover .add-hint { color: #94a3b8; }

	.remove-btn {
		background: none;
		border: none;
		color: #cbd5e1;
		font-size: 1rem;
		cursor: pointer;
		padding: 0;
		line-height: 1;
		flex-shrink: 0;
		opacity: 0;
		transition: opacity 0.15s, color 0.15s;
	}

	.entry-cell:hover .remove-btn { opacity: 1; }
	.remove-btn:hover { color: #ef4444 !important; }

	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		padding: 1rem;
	}

	.modal {
		width: 100%;
		max-width: 420px;
		background: rgba(255, 255, 255, 0.98);
		border-radius: 24px;
		box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.1), 0 24px 60px rgba(10, 22, 40, 0.4);
		overflow: hidden;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.5rem 0;
	}

	.modal-title {
		font-family: 'Syne', sans-serif;
		font-size: 1rem;
		font-weight: 700;
		margin: 0;
		color: #0f2347;
	}

	.modal-close {
		background: #f1f5f9;
		border: none;
		color: #94a3b8;
		width: 28px;
		height: 28px;
		border-radius: 8px;
		font-size: 1rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal-close:hover { background: #e2e8f0; }

	.modal-body {
		padding: 1.25rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	label {
		font-size: 0.72rem;
		font-weight: 700;
		color: #64748b;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	input {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		padding: 0.6rem 0.85rem;
		font-size: 0.88rem;
		color: #0f2347;
		outline: none;
		transition: border-color 0.15s;
		width: 100%;
		box-sizing: border-box;
		font-family: 'DM Sans', sans-serif;
	}

	input:focus { border-color: #2563eb; }
	input::placeholder { color: #cbd5e1; }

	.color-picker { display: flex; gap: 0.5rem; flex-wrap: wrap; }

	.color-swatch {
		width: 26px;
		height: 26px;
		border-radius: 50%;
		border: 2px solid transparent;
		cursor: pointer;
		transition: transform 0.15s, border-color 0.15s;
	}

	.color-swatch:hover { transform: scale(1.15); }
	.color-swatch.active { border-color: #0f2347; transform: scale(1.15); }

	.modal-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 1.5rem 1.5rem;
		gap: 0.5rem;
	}

	.btn-group { display: flex; gap: 0.5rem; }

	.btn-primary {
		background: #2563eb;
		border: none;
		color: white;
		padding: 0.55rem 1.2rem;
		border-radius: 10px;
		font-size: 0.83rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s;
		font-family: 'DM Sans', sans-serif;
	}

	.btn-primary:hover:not(:disabled) { background: #1d4ed8; }
	.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

	.btn-ghost {
		background: #f1f5f9;
		border: 1px solid #e2e8f0;
		color: #64748b;
		padding: 0.55rem 1rem;
		border-radius: 10px;
		font-size: 0.83rem;
		cursor: pointer;
		transition: background 0.15s;
		font-family: 'DM Sans', sans-serif;
	}

	.btn-ghost:hover { background: #e2e8f0; }

	.btn-danger {
		background: none;
		border: none;
		color: #ef4444;
		font-size: 0.8rem;
		cursor: pointer;
		padding: 0;
		font-family: 'DM Sans', sans-serif;
	}

	.btn-danger:hover { opacity: 0.7; }

	@media (max-width: 640px) {
		.head-day { font-size: 0.6rem; }
		.entry-subject { font-size: 0.72rem; }
	}
</style>