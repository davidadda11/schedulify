<script lang="ts">
	import { onMount } from 'svelte';

	// Anul școlar: septembrie – iulie
	const SCHOOL_MONTHS = [8, 9, 10, 11, 0, 1, 2, 3, 4, 5, 6]; // 8=sep, 0=ian etc.
	const MONTH_NAMES = [
		'Ianuarie',
		'Februarie',
		'Martie',
		'Aprilie',
		'Mai',
		'Iunie',
		'Iulie',
		'August',
		'Septembrie',
		'Octombrie',
		'Noiembrie',
		'Decembrie'
	];
	const DAY_NAMES = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

	const today = new Date();

	let currentMonth = $state(today.getMonth());
	let currentYear = $state(today.getFullYear());
	let selectedDays = $state<Set<string>>(new Set());

	function getDaysInMonth(month: number, year: number) {
		return new Date(year, month + 1, 0).getDate();
	}

	function getFirstDayOfMonth(month: number, year: number) {
		let day = new Date(year, month, 1).getDay();
		return day === 0 ? 6 : day - 1; // luni = 0
	}

	function prevMonth() {
		if (currentMonth === 0) {
			currentMonth = 11;
			currentYear--;
		} else currentMonth--;
	}

	function nextMonth() {
		if (currentMonth === 11) {
			currentMonth = 0;
			currentYear++;
		} else currentMonth++;
	}

	function toggleDay(day: number) {
		const key = `${currentYear}-${currentMonth}-${day}`;
		const next = new Set(selectedDays);
		if (next.has(key)) next.delete(key);
		else next.add(key);
		selectedDays = next;
	}

	function isSelected(day: number) {
		return selectedDays.has(`${currentYear}-${currentMonth}-${day}`);
	}

	function isToday(day: number) {
		return (
			day === today.getDate() &&
			currentMonth === today.getMonth() &&
			currentYear === today.getFullYear()
		);
	}

	function isSchoolMonth(month: number) {
		return SCHOOL_MONTHS.includes(month);
	}

	let cells = $derived(
		(() => {
			const first = getFirstDayOfMonth(currentMonth, currentYear);
			const total = getDaysInMonth(currentMonth, currentYear);
			const arr: (number | null)[] = Array(first).fill(null);
			for (let i = 1; i <= total; i++) arr.push(i);
			while (arr.length % 7 !== 0) arr.push(null);
			return arr;
		})()
	);
</script>

<svelte:head>
	<title>Calendar — Schedulify</title>
</svelte:head>

<div class="cal-page">
	<header class="cal-header">
		<div>
			<h1 class="cal-title">Calendar</h1>
			<p class="cal-sub">Selectează zilele importante</p>
		</div>
	</header>

	<div class="cal-card glass">
		<!-- Nav -->
		<div class="cal-nav">
			<button class="nav-btn" onclick={prevMonth} aria-label="Luna anterioară">‹</button>
			<div class="cal-month-info">
				<span class="cal-month-name">{MONTH_NAMES[currentMonth]}</span>
				<span class="cal-year">{currentYear}</span>
				{#if !isSchoolMonth(currentMonth)}
					<span class="vacation-badge">Vacanță</span>
				{/if}
			</div>
			<button class="nav-btn" onclick={nextMonth} aria-label="Luna următoare">›</button>
		</div>

		<!-- Month quick-select -->
		<div class="month-pills">
			{#each SCHOOL_MONTHS as m}
				<button
					class="month-pill"
					class:active={m === currentMonth}
					onclick={() => {
						currentMonth = m;
						if (m < 8) currentYear = today.getFullYear();
						else currentYear = today.getFullYear() - (today.getMonth() >= 8 ? 0 : 1);
					}}
				>
					{MONTH_NAMES[m].slice(0, 3)}
				</button>
			{/each}
		</div>

		<!-- Day headers -->
		<div class="cal-grid">
			{#each DAY_NAMES as d}
				<div class="day-header">{d}</div>
			{/each}

			{#each cells as day}
				{#if day === null}
					<div class="day-cell empty"></div>
				{:else}
					<button
						class="day-cell"
						class:today={isToday(day)}
						class:selected={isSelected(day)}
						onclick={() => toggleDay(day)}
					>
						{day}
					</button>
				{/if}
			{/each}
		</div>

		<!-- Selected summary -->
		{#if selectedDays.size > 0}
			<div class="selected-info">
				<span
					>{selectedDays.size} {selectedDays.size === 1 ? 'zi selectată' : 'zile selectate'}</span
				>
				<button class="clear-btn" onclick={() => (selectedDays = new Set())}>Șterge tot</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.cal-page {
		max-width: 680px;
		padding-bottom: 3rem;
	}

	.cal-header {
		margin-bottom: 2rem;
	}

	.cal-title {
		font-family: var(--font-display);
		font-size: 2rem;
		font-weight: 800;
		margin: 0 0 0.25rem;
		letter-spacing: -0.03em;
	}

	.cal-sub {
		font-size: 0.85rem;
		color: rgba(255, 255, 255, 0.35);
		margin: 0;
	}

	.cal-card {
		border-radius: var(--radius-lg);
		padding: 1.5rem;
	}

	/* Nav */
	.cal-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.2rem;
	}

	.nav-btn {
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.08);
		color: rgba(255, 255, 255, 0.7);
		width: 36px;
		height: 36px;
		border-radius: var(--radius-md);
		font-size: 1.2rem;
		cursor: pointer;
		transition: background 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.nav-btn:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.cal-month-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.cal-month-name {
		font-family: var(--font-display);
		font-size: 1.2rem;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.9);
	}

	.cal-year {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.35);
	}

	.vacation-badge {
		font-size: 0.65rem;
		padding: 0.15rem 0.5rem;
		border-radius: 100px;
		background: rgba(245, 158, 11, 0.15);
		color: #f59e0b;
		border: 1px solid rgba(245, 158, 11, 0.2);
	}

	/* Month pills */
	.month-pills {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
		margin-bottom: 1.2rem;
	}

	.month-pill {
		font-size: 0.72rem;
		padding: 0.3rem 0.65rem;
		border-radius: 100px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(255, 255, 255, 0.07);
		color: rgba(255, 255, 255, 0.4);
		cursor: pointer;
		transition: all 0.15s;
	}

	.month-pill:hover {
		background: rgba(255, 255, 255, 0.08);
		color: rgba(255, 255, 255, 0.7);
	}

	.month-pill.active {
		background: rgba(99, 102, 241, 0.2);
		border-color: rgba(99, 102, 241, 0.4);
		color: #a5b4fc;
	}

	/* Grid */
	.cal-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 4px;
	}

	.day-header {
		text-align: center;
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.25);
		padding: 0.4rem 0;
		font-weight: 500;
	}

	.day-cell {
		aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.82rem;
		border-radius: var(--radius-md);
		border: none;
		background: transparent;
		color: rgba(255, 255, 255, 0.6);
		cursor: pointer;
		transition: all 0.15s;
	}

	.day-cell:not(.empty):hover {
		background: rgba(255, 255, 255, 0.06);
		color: rgba(255, 255, 255, 0.9);
	}

	.day-cell.today {
		border: 1px solid rgba(99, 102, 241, 0.5);
		color: #a5b4fc;
		font-weight: 600;
	}

	.day-cell.selected {
		background: rgba(99, 102, 241, 0.25);
		border: 1px solid rgba(99, 102, 241, 0.5);
		color: #c7d2fe;
		font-weight: 600;
	}

	.day-cell.today.selected {
		background: #6366f1;
		color: #fff;
		border-color: #6366f1;
	}

	.day-cell.empty {
		cursor: default;
	}

	/* Selected info */
	.selected-info {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.4);
	}

	.clear-btn {
		background: none;
		border: none;
		color: var(--accent-rose, #f43f5e);
		font-size: 0.78rem;
		cursor: pointer;
		padding: 0;
	}

	.clear-btn:hover {
		opacity: 0.7;
	}
</style>
