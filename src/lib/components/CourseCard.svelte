<!-- src/lib/components/CourseCard.svelte -->
<!-- Course Card — 3D tilt + hover particles + progress ring    -->
<!-- Svelte 5 runes, CSS 3D perspective transform, GSAP burst   -->

<script lang="ts">
  import { onMount } from 'svelte';
  import gsap from 'gsap';
  import type { Subject } from '$db/schema';

  // ── Props ────────────────────────────────────────────────────
  interface Props {
    subject: Subject;
    progress?: number;          // 0-100
    nextSession?: string;       // ISO date
    tasksCount?: number;
    onStart?: () => void;
    onDetails?: () => void;
  }

  let {
    subject,
    progress = 0,
    nextSession,
    tasksCount = 0,
    onStart,
    onDetails,
  }: Props = $props();

  // ── State ──────────────────────────────────────────────────
  let cardEl: HTMLDivElement;
  let glowEl: HTMLDivElement;
  let burstEl: HTMLDivElement;
  let isHovered = $state(false);
  let rotateX   = $state(0);
  let rotateY   = $state(0);

  // ── Derived ───────────────────────────────────────────────
  let circumference = $derived(2 * Math.PI * 26);  // r=26 on SVG circle
  let dashOffset    = $derived(circumference * (1 - progress / 100));
  let progressColor = $derived(
    progress >= 80 ? '#10b981' :
    progress >= 50 ? '#f59e0b' :
    subject.colorHex
  );

  // ── 3D Tilt handler ───────────────────────────────────────
  function handleMouseMove(e: MouseEvent) {
    const rect   = cardEl.getBoundingClientRect();
    const cx     = rect.left + rect.width  / 2;
    const cy     = rect.top  + rect.height / 2;
    const dx     = (e.clientX - cx) / (rect.width  / 2);
    const dy     = (e.clientY - cy) / (rect.height / 2);

    rotateX = -dy * 12;   // degrees
    rotateY =  dx * 12;

    // Move glow orb
    const glowX = 50 + dx * 25;
    const glowY = 50 + dy * 25;
    if (glowEl) {
      glowEl.style.background = `radial-gradient(circle at ${glowX}% ${glowY}%, ${subject.colorHex}33 0%, transparent 70%)`;
    }
  }

  function handleMouseEnter() {
    isHovered = true;
  }

  function handleMouseLeave() {
    isHovered = false;
    rotateX = 0;
    rotateY = 0;
    if (glowEl) glowEl.style.background = '';
  }

  // ── Start Study burst animation ───────────────────────────
  function triggerBurst() {
    if (!burstEl) return;
    const particles = burstEl.querySelectorAll<HTMLElement>('.burst-particle');
    gsap.killTweensOf(particles);

    particles.forEach((p, i) => {
      const angle  = (i / particles.length) * Math.PI * 2;
      const dist   = 35 + Math.random() * 30;
      gsap.fromTo(p,
        { opacity: 1, scale: 1, x: 0, y: 0 },
        {
          opacity: 0,
          scale: 0,
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          duration: 0.6 + Math.random() * 0.3,
          ease: 'power2.out',
        }
      );
    });

    onStart?.();
  }

  // ── Format next session ────────────────────────────────────
  let nextSessionLabel = $derived(() => {
    if (!nextSession) return null;
    const d = new Date(nextSession);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const hours = Math.round(diff / 3600000);
    if (hours < 1)  return 'Acum';
    if (hours < 24) return `În ${hours}h`;
    const days = Math.round(hours / 24);
    return `În ${days}z`;
  });
</script>

<article
  class="course-card"
  class:hovered={isHovered}
  bind:this={cardEl}
  onmousemove={handleMouseMove}
  onmouseenter={handleMouseEnter}
  onmouseleave={handleMouseLeave}
  style="--card-color: {subject.colorHex}; --rotate-x: {rotateX}deg; --rotate-y: {rotateY}deg;"
  role="article"
>
  <!-- Inner 3D transform wrapper -->
  <div class="card-inner">

    <!-- Glow overlay -->
    <div class="card-glow" bind:this={glowEl}></div>

    <!-- Shimmer border -->
    <div class="card-shimmer" aria-hidden="true"></div>

    <!-- Top row: icon + progress ring -->
    <header class="card-header">
      <div class="subject-icon" style="background: {subject.colorHex}22; border-color: {subject.colorHex}44;">
        {subject.icon}
      </div>

      <!-- SVG Progress Ring -->
      <div class="progress-ring-wrapper">
        <svg width="64" height="64" viewBox="0 0 64 64" aria-label="{progress}% completat">
          <circle
            cx="32" cy="32" r="26"
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            stroke-width="3"
          />
          <circle
            cx="32" cy="32" r="26"
            fill="none"
            stroke={progressColor}
            stroke-width="3"
            stroke-linecap="round"
            stroke-dasharray={circumference}
            stroke-dashoffset={dashOffset}
            transform="rotate(-90 32 32)"
            style="transition: stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1), stroke 0.4s;"
          />
        </svg>
        <span class="progress-label" style="color: {progressColor};">{progress}%</span>
      </div>
    </header>

    <!-- Subject name + meta -->
    <div class="card-body">
      <h3 class="subject-name">{subject.name}</h3>

      <div class="card-meta">
        {#if nextSessionLabel}
          <span class="meta-chip">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <circle cx="5" cy="5" r="4" stroke="currentColor" stroke-width="1.2"/>
              <path d="M5 2.5v2.5l1.5 1.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
            {nextSessionLabel()}
          </span>
        {/if}

        {#if tasksCount > 0}
          <span class="meta-chip">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <rect x="1" y="2" width="8" height="7" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
              <path d="M3 4.5h4M3 6.5h2.5" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
            </svg>
            {tasksCount} teme
          </span>
        {/if}
      </div>
    </div>

    <!-- Progress bar -->
    <div class="card-progress-bar">
      <div
        class="card-progress-fill"
        style="width: {progress}%; background: {progressColor};"
      ></div>
    </div>

    <!-- Actions -->
    <footer class="card-footer">
      <button
        class="btn-start"
        onclick={triggerBurst}
        style="--btn-color: {subject.colorHex};"
      >
        <!-- Burst particles -->
        <div class="burst-container" bind:this={burstEl} aria-hidden="true">
          {#each Array(8) as _}
            <div class="burst-particle" style="background: {subject.colorHex};"></div>
          {/each}
        </div>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Studiază
      </button>

      <button class="btn-details" onclick={onDetails}>
        ···
      </button>
    </footer>
  </div>

  <!-- Floating accent dot (parallax) -->
  <div
    class="card-dot"
    style="
      background: {subject.colorHex};
      transform: translate3d(calc(var(--rotate-y) * 1.5px), calc(var(--rotate-x) * -1.5px), 0);
    "
    aria-hidden="true"
  ></div>
</article>

<style>
  .course-card {
    position: relative;
    width: 260px;
    cursor: pointer;
    perspective: 1000px;
    outline: none;
    --rotate-x: 0deg;
    --rotate-y: 0deg;
    --card-color: #6366f1;
  }

  .card-inner {
    position: relative;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: var(--radius-xl);
    padding: 1.4rem;
    overflow: hidden;
    backdrop-filter: blur(20px);
    transform:
      rotateX(var(--rotate-x))
      rotateY(var(--rotate-y))
      translateZ(0);
    transition:
      transform 0.12s ease-out,
      border-color 0.3s,
      box-shadow 0.3s;
    will-change: transform;
  }

  .course-card.hovered .card-inner {
    border-color: color-mix(in srgb, var(--card-color) 50%, transparent);
    box-shadow:
      0 20px 60px rgba(0,0,0,0.4),
      0 0 0 1px color-mix(in srgb, var(--card-color) 25%, transparent),
      inset 0 1px 0 rgba(255,255,255,0.1);
    transform:
      rotateX(var(--rotate-x))
      rotateY(var(--rotate-y))
      translateZ(20px);
  }

  /* Glow overlay */
  .card-glow {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    transition: background 0.1s;
    z-index: 0;
  }

  /* Shimmer border animation */
  .card-shimmer {
    position: absolute;
    inset: -1px;
    border-radius: calc(var(--radius-xl) + 1px);
    background: conic-gradient(
      from 0deg,
      transparent 0%,
      var(--card-color) 10%,
      transparent 20%
    );
    opacity: 0;
    pointer-events: none;
    z-index: -1;
    transition: opacity 0.3s;
    animation: shimmerSpin 3s linear infinite;
    animation-play-state: paused;
  }

  .course-card.hovered .card-shimmer {
    opacity: 0.5;
    animation-play-state: running;
  }

  @keyframes shimmerSpin {
    to { transform: rotate(360deg); }
  }

  /* Layout */
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
    position: relative;
    z-index: 1;
  }

  .subject-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    border: 1px solid;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    line-height: 1;
    transition: transform 0.3s var(--ease-spring);
  }

  .course-card.hovered .subject-icon {
    transform: translateZ(10px) scale(1.08);
  }

  .progress-ring-wrapper {
    position: relative;
    width: 64px;
    height: 64px;
  }

  .progress-label {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-size: 0.7rem;
    font-weight: 700;
  }

  .card-body {
    position: relative;
    z-index: 1;
    margin-bottom: 1rem;
  }

  .subject-name {
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 700;
    color: rgba(255,255,255,0.92);
    margin: 0 0 0.6rem;
    letter-spacing: -0.02em;
  }

  .card-meta {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .meta-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.25rem 0.6rem;
    border-radius: 100px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.08);
    font-size: 0.72rem;
    color: rgba(255,255,255,0.5);
  }

  .card-progress-bar {
    height: 3px;
    background: rgba(255,255,255,0.07);
    border-radius: 2px;
    overflow: hidden;
    margin-bottom: 1.2rem;
    position: relative;
    z-index: 1;
  }

  .card-progress-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .card-footer {
    display: flex;
    gap: 0.6rem;
    position: relative;
    z-index: 1;
  }

  .btn-start {
    position: relative;
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.6rem 1rem;
    border-radius: 10px;
    background: color-mix(in srgb, var(--btn-color) 15%, transparent);
    border: 1px solid color-mix(in srgb, var(--btn-color) 30%, transparent);
    color: var(--btn-color);
    font-family: var(--font-body);
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    transition:
      background 0.25s,
      border-color 0.25s,
      transform 0.2s var(--ease-spring);
    overflow: visible;
  }

  .btn-start:hover {
    background: color-mix(in srgb, var(--btn-color) 25%, transparent);
    border-color: color-mix(in srgb, var(--btn-color) 50%, transparent);
    transform: scale(1.04);
  }

  .btn-start:active {
    transform: scale(0.97);
  }

  /* Burst particles */
  .burst-container {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .burst-particle {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    opacity: 0;
  }

  .btn-details {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.4);
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.25s, color 0.25s;
    display: flex;
    align-items: center;
    justify-content: center;
    letter-spacing: 0.1em;
    line-height: 1;
  }

  .btn-details:hover {
    background: rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.8);
  }

  /* Floating accent dot (parallax layer) */
  .card-dot {
    position: absolute;
    top: -8px;
    right: 20px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    opacity: 0.7;
    filter: blur(4px);
    pointer-events: none;
    transition: transform 0.08s ease-out;
  }
</style>