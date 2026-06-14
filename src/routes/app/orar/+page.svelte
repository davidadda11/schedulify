<script lang="ts">
	import { browser } from '$app/environment';

	const DAYS = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri'];

	type Entry = {
		id: string;
		subject: string;
		teacher: string;
		room: string;
		color: string;
	};

	type TimeSlot = { id: string; start: string; end: string };

	const COLORS = [
		'#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
		'#f43f5e', '#f59e0b', '#10b981', '#06b6d4'
	];

	const DEFAULT_TIMETABLE: Record<string, Record<string, Entry | null>> = {};
	const DEFAULT_TIMES: TimeSlot[] = [];

	function loadFromStorage<T>(key: string, fallback: T): T {
		if (!browser) return fallback;
		try {
			const raw = localStorage.getItem(key);
			return raw ? JSON.parse(raw) : fallback;
		} catch {
			return fallback;
		}
	}

	function saveToStorage(key: string, value: unknown) {
		if (!browser) return;
		try {
			localStorage.setItem(key, JSON.stringify(value));
		} catch {}
	}

	let timeSlots = $state<TimeSlot[]>(
		loadFromStorage('schedulify_slot_times', DEFAULT_TIMES)
	);

	let timetable = $state<Record<string, Record<string, Entry | null>>>(
		loadFromStorage('schedulify_timetable', DEFAULT_TIMETABLE)
	);

	let editTarget = $state<{ slotId: string; day: string } | null>(null);
	let editData = $state({ subject: '', teacher: '', room: '', color: COLORS[0] });
	let showModal = $state(false);

	let editTimeTarget = $state<string | null>(null);
	let editTimeData = $state({ start: '', end: '' });
	let showTimeModal = $state(false);

	let showAddSlotModal = $state(false);
	let newSlotTime = $state({ start: '08:00', end: '09:00' });

	function addTimeSlot() {
		if (!newSlotTime.start || !newSlotTime.end) return;
		const slotId = crypto.randomUUID();
		const slot: TimeSlot = { id: slotId, start: newSlotTime.start, end: newSlotTime.end };
		timeSlots = [...timeSlots, slot];
		
		// Initialize timetable for this slot
		DAYS.forEach(day => {
			if (!timetable[day]) timetable[day] = {};
			timetable[day][slotId] = null;
		});
		timetable = { ...timetable };
		
		saveToStorage('schedulify_slot_times', timeSlots);
		saveToStorage('schedulify_timetable', timetable);
		showAddSlotModal = false;
		newSlotTime = { start: '08:00', end: '09:00' };
	}

	function removeTimeSlot(slotId: string) {
		timeSlots = timeSlots.filter(s => s.id !== slotId);
		Object.keys(timetable).forEach(day => {
			delete timetable[day][slotId];
		});
		timetable = { ...timetable };
		saveToStorage('schedulify_slot_times', timeSlots);
		saveToStorage('schedulify_timetable', timetable);
	}

	function openTimeEdit(slotId: string) {
		const slot = timeSlots.find(s => s.id === slotId);
		if (!slot) return;
		editTimeTarget = slotId;
		editTimeData = { ...slot };
		showTimeModal = true;
	}

	function saveTime() {
		if (!editTimeTarget || !editTimeData.start || !editTimeData.end) return;
		const idx = timeSlots.findIndex(s => s.id === editTimeTarget);
		if (idx !== -1) {
			timeSlots[idx] = { ...timeSlots[idx], start: editTimeData.start, end: editTimeData.end };
			timeSlots = [...timeSlots];
			saveToStorage('schedulify_slot_times', timeSlots);
		}
		showTimeModal = false;
		editTimeTarget = null;
	}

	function closeTimeModal() {
		showTimeModal = false;
		editTimeTarget = null;
	}

	function openEdit(slotId: string, day: string) {
		editTarget = { slotId, day };
		const existing = timetable[day]?.[slotId];
		editData = existing
			? { subject: existing.subject, teacher: existing.teacher, room: existing.room, color: existing.color }
			: { subject: '', teacher: '', room: '', color: COLORS[Math.floor(Math.random() * COLORS.length)] };
		showModal = true;
	}

	function saveEntry() {
		if (!editTarget || !editData.subject.trim()) return;
		const { slotId, day } = editTarget;
		if (!timetable[day]) timetable[day] = {};
		timetable[day][slotId] = {
			id: crypto.randomUUID(),
			subject: editData.subject.trim(),
			teacher: editData.teacher.trim(),
			room: editData.room.trim(),
			color: editData.color
		};
		timetable = { ...timetable };
		saveToStorage('schedulify_timetable', timetable);
		showModal = false;
	}

	function removeEntry(slotId: string, day: string) {
		if (timetable[day]) {
			timetable[day][slotId] = null;
			timetable = { ...timetable };
			saveToStorage('schedulify_timetable', timetable);
		}
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
		<button class="add-slot-btn" onclick={() => showAddSlotModal = true}>+ Adaugă interval</button>
	</header>

	{#if timeSlots.length === 0}
		<div class="empty-state">
			<div class="empty-icon">📅</div>
			<p class="empty-title">Nu ai nici un interval adăugat</p>
			<p class="empty-desc">Creează-ți orarul personalizat adăugând intervale de ore</p>
			<button class="btn-primary" onclick={() => showAddSlotModal = true}>Adaugă interval</button>
		</div>
	{:else}
		<div class="schedules-container">
			{#each timeSlots as slot (slot.id)}
				<div class="slot-section">
					<div class="slot-header">
						<div class="slot-time-display">
							<span class="time-badge">{slot.start} – {slot.end}</span>
						</div>
						<div class="slot-actions">
							<button class="slot-edit" onclick={() => openTimeEdit(slot.id)} title="Editează intervalul">✎</button>
							<button class="slot-delete" onclick={() => removeTimeSlot(slot.id)} title="Șterge intervalul">×</button>
						</div>
					</div>
					<div class="slot-grid">
						{#each DAYS as day}
							{@const entry = timetable[day]?.[slot.id]}
							<button
								class="day-cell"
								class:has-entry={!!entry}
								onclick={() => openEdit(slot.id, day)}
								style={entry ? `--entry-color: ${entry.color}` : ''}
								title={day}
							>
								{#if entry}
									<div class="entry-content">
										<span class="entry-dot" style="background:{entry.color}"></span>
										<div class="entry-info">
											<span class="entry-subject">{entry.subject}</span>
											{#if entry.teacher}<span class="entry-meta">{entry.teacher}</span>{/if}
										</div>
										<button
											class="remove-btn"
											onclick={(e) => { e.stopPropagation(); removeEntry(slot.id, day); }}
											title="Șterge"
										>×</button>
									</div>
								{:else}
									<span class="add-hint">+</span>
								{/if}
							</button>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

{#if showModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={closeModal}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2 class="modal-title">
					{#if editTarget}
						{@const slot = timeSlots.find(s => s.id === editTarget.slotId)}
						{editTarget.day} · {slot?.start} – {slot?.end}
					{:else}
						Adaugă oră
					{/if}
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
				{#if editTarget && timetable[editTarget.day]?.[editTarget.slotId]}
					<button class="btn-danger" onclick={() => { removeEntry(editTarget!.slotId, editTarget!.day); closeModal(); }}>Șterge ora</button>
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

{#if showTimeModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={closeTimeModal}>
		<div class="modal modal-time" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2 class="modal-title">Editează intervalul</h2>
				<button class="modal-close" onclick={closeTimeModal}>×</button>
			</div>

			<div class="modal-body">
				<div class="time-row">
					<div class="field">
						<label for="time-start">De la</label>
						<input id="time-start" type="time" bind:value={editTimeData.start} />
					</div>
					<span class="time-sep">–</span>
					<div class="field">
						<label for="time-end">Până la</label>
						<input id="time-end" type="time" bind:value={editTimeData.end} />
					</div>
				</div>
			</div>

			<div class="modal-footer">
				<span></span>
				<div class="btn-group">
					<button class="btn-ghost" onclick={closeTimeModal}>Anulează</button>
					<button class="btn-primary" onclick={saveTime}>Salvează</button>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if showAddSlotModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={() => showAddSlotModal = false}>
		<div class="modal modal-time" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2 class="modal-title">Adaugă interval de ore</h2>
				<button class="modal-close" onclick={() => showAddSlotModal = false}>×</button>
			</div>

			<div class="modal-body">
				<div class="time-row">
					<div class="field">
						<label for="new-start">De la</label>
						<input id="new-start" type="time" bind:value={newSlotTime.start} />
					</div>
					<span class="time-sep">–</span>
					<div class="field">
						<label for="new-end">Până la</label>
						<input id="new-end" type="time" bind:value={newSlotTime.end} />
					</div>
				</div>
			</div>

			<div class="modal-footer">
				<span></span>
				<div class="btn-group">
					<button class="btn-ghost" onclick={() => showAddSlotModal = false}>Anulează</button>
					<button class="btn-primary" onclick={addTimeSlot}>Adaugă</button>
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

	.page-header {
		margin-bottom: 1.75rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.page-header > div {
		flex: 1;
	}

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

	.add-slot-btn {
		background: #2563eb;
		border: none;
		color: white;
		padding: 0.65rem 1.25rem;
		border-radius: 12px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
		font-family: 'DM Sans', sans-serif;
		transition: background 0.15s;
	}

	.add-slot-btn:hover {
		background: #1d4ed8;
	}

	.empty-state {
		background: rgba(255, 255, 255, 0.95);
		border-radius: 24px;
		border: 2px dashed rgba(37, 99, 235, 0.2);
		padding: 3rem 2rem;
		text-align: center;
		box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.1);
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.empty-title {
		font-size: 1.1rem;
		font-weight: 700;
		color: #0f2347;
		margin: 0 0 0.5rem;
	}

	.empty-desc {
		font-size: 0.9rem;
		color: #94a3b8;
		margin-bottom: 1.5rem;
	}

	.empty-state .btn-primary {
		background: #2563eb;
		border: none;
		color: white;
		padding: 0.65rem 1.5rem;
		border-radius: 12px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		font-family: 'DM Sans', sans-serif;
		transition: background 0.15s;
	}

	.empty-state .btn-primary:hover {
		background: #1d4ed8;
	}

	.schedules-container {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.slot-section {
		background: rgba(255, 255, 255, 0.95);
		border-radius: 16px;
		overflow: hidden;
		box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.1), 0 8px 24px rgba(10, 22, 40, 0.2);
	}

	.slot-header {
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
		padding: 1rem 1.5rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1px solid #e2e8f0;
	}

	.slot-time-display {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.time-badge {
		background: #2563eb;
		color: white;
		padding: 0.45rem 1rem;
		border-radius: 8px;
		font-size: 0.85rem;
		font-weight: 600;
		font-family: 'Courier New', monospace;
	}

	.slot-actions {
		display: flex;
		gap: 0.5rem;
	}

	.slot-edit,
	.slot-delete {
		background: transparent;
		border: none;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1rem;
		transition: background 0.15s, color 0.15s;
		color: #94a3b8;
	}

	.slot-edit:hover {
		background: #e2e8f0;
		color: #2563eb;
	}

	.slot-delete:hover {
		background: #fee2e2;
		color: #ef4444;
	}

	.slot-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 0;
	}

	.day-cell {
		background: transparent;
		border: 1px solid #e2e8f0;
		cursor: pointer;
		padding: 0.85rem;
		text-align: left;
		transition: background 0.15s;
		font-family: 'DM Sans', sans-serif;
		min-height: 90px;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		position: relative;
	}

	.day-cell:hover {
		background: #f8fafc;
	}

	.day-cell.has-entry {
		background: transparent;
	}

	.entry-content {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		flex: 1;
	}

	.entry-dot {
		width: 3px;
		border-radius: 2px;
		flex-shrink: 0;
		height: 100%;
		min-height: 30px;
	}

	.entry-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
		min-width: 0;
	}

	.entry-subject {
		font-size: 0.8rem;
		font-weight: 700;
		color: #0f2347;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.entry-meta {
		font-size: 0.65rem;
		color: #94a3b8;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.add-hint {
		font-size: 1.2rem;
		color: #cbd5e1;
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		transition: color 0.15s;
	}

	.day-cell:hover .add-hint {
		color: #2563eb;
	}

	.remove-btn {
		background: none;
		border: none;
		color: #cbd5e1;
		font-size: 0.9rem;
		cursor: pointer;
		padding: 0;
		line-height: 1;
		flex-shrink: 0;
		opacity: 0;
		transition: opacity 0.15s, color 0.15s;
		position: absolute;
		right: 0.5rem;
		top: 0.5rem;
	}

	.entry-content:hover .remove-btn {
		opacity: 1;
	}

	.remove-btn:hover {
		color: #ef4444;
	}

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

	.modal-time {
		max-width: 340px;
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
		transition: background 0.15s;
	}

	.modal-close:hover {
		background: #e2e8f0;
	}

	.modal-body {
		padding: 1.25rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.time-row {
		display: flex;
		align-items: flex-end;
		gap: 0.75rem;
	}

	.time-row .field {
		flex: 1;
	}

	.time-sep {
		font-size: 1.2rem;
		color: #cbd5e1;
		padding-bottom: 0.6rem;
		flex-shrink: 0;
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

	input:focus {
		border-color: #2563eb;
	}

	input::placeholder {
		color: #cbd5e1;
	}

	.color-picker {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.color-swatch {
		width: 26px;
		height: 26px;
		border-radius: 50%;
		border: 2px solid transparent;
		cursor: pointer;
		transition: transform 0.15s, border-color 0.15s;
	}

	.color-swatch:hover {
		transform: scale(1.15);
	}

	.color-swatch.active {
		border-color: #0f2347;
		transform: scale(1.15);
	}

	.modal-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 1.5rem 1.5rem;
		gap: 0.5rem;
	}

	.btn-group {
		display: flex;
		gap: 0.5rem;
	}

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

	.btn-primary:hover:not(:disabled) {
		background: #1d4ed8;
	}

	.btn-primary:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

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

	.btn-ghost:hover {
		background: #e2e8f0;
	}

	.btn-danger {
		background: none;
		border: none;
		color: #ef4444;
		font-size: 0.8rem;
		cursor: pointer;
		padding: 0;
		font-family: 'DM Sans', sans-serif;
	}

	.btn-danger:hover {
		opacity: 0.7;
	}

	@media (max-width: 768px) {
		.slot-grid {
			grid-template-columns: repeat(3, 1fr);
		}

		.page-header {
			flex-direction: column;
			gap: 1rem;
		}

		.add-slot-btn {
			width: 100%;
		}
	}

	@media (max-width: 640px) {
		.slot-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>