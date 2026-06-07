<!-- src/lib/components/Hero3D.svelte -->
<!-- Threlte 3D Hero — Preloader + Interactive 3D Scene          -->
<!-- Features: animated book opening, floating geometries,       -->
<!--           mouse parallax, GSAP orchestration               -->

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Canvas } from '@threlte/core';
  import { Spring } from '@threlte/core';
  import { T, useTask } from '@threlte/core';
  import { Float, MeshTransmissionMaterial, ContactShadows } from '@threlte/extras';
  import * as THREE from 'three';
  import gsap from 'gsap';

  // ── Props (Svelte 5 runes) ──────────────────────────────────
  let { onLoaded = () => {} }: { onLoaded?: () => void } = $props();

  // ── State ──────────────────────────────────────────────────
  let canvasEl: HTMLDivElement;
  let preloaderEl: HTMLDivElement;
  let titleEl: HTMLElement;
  let subtitleEl: HTMLElement;
  let loaded = $state(false);
  let mouseX = $state(0);
  let mouseY = $state(0);

  // ── Mouse tracking ─────────────────────────────────────────
  function handleMouseMove(e: MouseEvent) {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }

  // ── GSAP Preloader Sequence ────────────────────────────────
  onMount(() => {
    window.addEventListener('mousemove', handleMouseMove);

    const tl = gsap.timeline({
      delay: 0.2,
      onComplete: () => {
        loaded = true;
        onLoaded();
      }
    });

    // 1. Fade in preloader text
    tl.fromTo(
      '#preloader-logo',
      { opacity: 0, scale: 0.85, y: 20 },
      { opacity: 1, scale: 1, y: 0, duration: 0.9, ease: 'expo.out' }
    )
    // 2. Progress bar fill
    .fromTo(
      '#preloader-bar-fill',
      { scaleX: 0, transformOrigin: 'left' },
      { scaleX: 1, duration: 1.4, ease: 'power2.inOut' },
      '-=0.3'
    )
    // 3. Slide preloader off
    .to(
      preloaderEl,
      {
        yPercent: -100,
        duration: 1.0,
        ease: 'expo.inOut',
        delay: 0.3,
      }
    )
    // 4. Hero title entrance
    .fromTo(
      titleEl,
      { opacity: 0, y: 60, skewY: 4 },
      { opacity: 1, y: 0, skewY: 0, duration: 1.1, ease: 'expo.out' },
      '-=0.5'
    )
    .fromTo(
      subtitleEl,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out' },
      '-=0.7'
    );
  });

  onDestroy(() => {
    window.removeEventListener('mousemove', handleMouseMove);
    gsap.killTweensOf('*');
  });
</script>

<!-- ── Preloader ── -->
<div id="preloader" bind:this={preloaderEl}>
  <div id="preloader-logo">
    <span class="logo-sf">SF</span>
    <span class="logo-text">StudyFlow</span>
  </div>
  <div id="preloader-bar">
    <div id="preloader-bar-fill"></div>
  </div>
  <p class="preloader-hint">Pregătind experiența ta de învățare…</p>
</div>

<!-- ── Hero Section ── -->
<section class="hero-section" aria-label="Hero">
  <!-- 3D Canvas -->
  <div class="canvas-wrapper" bind:this={canvasEl}>
    <Canvas>
      <!-- Lights -->
      <T.AmbientLight intensity={0.3} />
      <T.DirectionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
      />
      <T.PointLight
        position={[-4, 3, -4]}
        intensity={2}
        color="#6366f1"
      />
      <T.PointLight
        position={[4, -2, 4]}
        intensity={1.5}
        color="#22d3ee"
      />

      <!-- Floating Glass Icosahedron -->
      <Float floatIntensity={2} speed={1.5} rotationIntensity={1}>
        <T.Mesh
          position={[
            mouseX * 0.3,
            mouseY * -0.2,
            0
          ]}
          rotation={[mouseY * 0.3, mouseX * 0.4, 0]}
        >
          <T.IcosahedronGeometry args={[1.4, 1]} />
          <T.MeshPhysicalMaterial
            color="#6366f1"
            metalness={0.1}
            roughness={0}
            transmission={0.9}
            thickness={1.5}
            ior={1.5}
            transparent
            opacity={0.85}
            envMapIntensity={2}
          />
        </T.Mesh>
      </Float>

      <!-- Floating Torus (book cover ring) -->
      <Float floatIntensity={1.5} speed={2} rotationIntensity={0.6}>
        <T.Mesh
          position={[
            2.8 + mouseX * 0.15,
            -0.5 + mouseY * -0.1,
            -1
          ]}
        >
          <T.TorusGeometry args={[0.7, 0.25, 16, 64]} />
          <T.MeshPhysicalMaterial
            color="#22d3ee"
            metalness={0.8}
            roughness={0.1}
            envMapIntensity={1.5}
          />
        </T.Mesh>
      </Float>

      <!-- Floating Octahedron -->
      <Float floatIntensity={2.5} speed={0.8} rotationIntensity={1.5}>
        <T.Mesh
          position={[
            -2.5 + mouseX * 0.2,
            1.2 + mouseY * -0.15,
            -0.5
          ]}
        >
          <T.OctahedronGeometry args={[0.6, 0]} />
          <T.MeshPhysicalMaterial
            color="#f43f5e"
            metalness={0.2}
            roughness={0.05}
            transmission={0.7}
            thickness={1}
            transparent
            opacity={0.9}
          />
        </T.Mesh>
      </Float>

      <!-- Ambient particles (small spheres) -->
      {#each Array(12) as _, i}
        <Float
          floatIntensity={1 + Math.random()}
          speed={0.5 + Math.random() * 1.5}
        >
          <T.Mesh
            position={[
              (Math.random() - 0.5) * 10,
              (Math.random() - 0.5) * 6,
              -3 - Math.random() * 4
            ]}
          >
            <T.SphereGeometry args={[0.04 + Math.random() * 0.06, 8, 8]} />
            <T.MeshBasicMaterial
              color={['#6366f1', '#22d3ee', '#f43f5e', '#f59e0b'][i % 4]}
            />
          </T.Mesh>
        </Float>
      {/each}

      <!-- Ground contact shadow -->
      <ContactShadows
        position={[0, -2.5, 0]}
        opacity={0.4}
        scale={8}
        blur={2.5}
        far={4}
        color="#6366f1"
      />
    </Canvas>
  </div>

  <!-- Hero Text overlay -->
  <div class="hero-content">
    <div class="hero-badge">✦ Powered by AI</div>
    <h1 class="hero-title" bind:this={titleEl}>
      Înveți mai<br>
      <span class="gradient-text">inteligent,</span><br>
      nu mai greu
    </h1>
    <p class="hero-subtitle" bind:this={subtitleEl}>
      Planifică-ți studiul cu AI, scanează teme cu OCR<br>
      și sincronizează-te cu 24edu.ro — totul într-un singur loc.
    </p>
    <div class="hero-cta-group">
      <a href="/register" class="btn-primary">
        <span>Începe gratuit</span>
        <div class="btn-particles" aria-hidden="true">
          {#each Array(6) as _, i}
            <div class="particle" style="--i:{i}"></div>
          {/each}
        </div>
      </a>
      <a href="/login" class="btn-ghost">Intră în cont →</a>
    </div>
  </div>
</section>

<style>
  /* ── Preloader ── */
  #preloader {
    position: fixed;
    inset: 0;
    z-index: 10000;
    background: var(--bg-base);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
  }

  #preloader-logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    opacity: 0;
  }

  .logo-sf {
    font-family: var(--font-display);
    font-size: 2.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, #6366f1, #22d3ee);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .logo-text {
    font-family: var(--font-display);
    font-size: 1.4rem;
    font-weight: 600;
    color: rgba(255,255,255,0.8);
    letter-spacing: -0.02em;
  }

  #preloader-bar {
    width: 200px;
    height: 2px;
    background: rgba(255,255,255,0.08);
    border-radius: 2px;
    overflow: hidden;
  }

  #preloader-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #6366f1, #22d3ee);
    border-radius: 2px;
  }

  .preloader-hint {
    font-size: 0.8rem;
    color: rgba(255,255,255,0.3);
    letter-spacing: 0.05em;
  }

  /* ── Hero Section ── */
  .hero-section {
    position: relative;
    min-height: 100dvh;
    display: flex;
    align-items: center;
    overflow: hidden;
  }

  .canvas-wrapper {
    position: absolute;
    inset: 0;
    z-index: 1;
  }

  .hero-content {
    position: relative;
    z-index: 10;
    padding: 0 clamp(1.5rem, 6vw, 6rem);
    max-width: 720px;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem 0.9rem;
    border-radius: 100px;
    border: 1px solid rgba(99, 102, 241, 0.3);
    background: rgba(99, 102, 241, 0.08);
    color: var(--accent-cyan);
    font-size: 0.78rem;
    font-weight: 500;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-bottom: 1.5rem;
  }

  .hero-title {
    font-size: clamp(3rem, 7vw, 6rem);
    line-height: 1.05;
    margin-bottom: 1.5rem;
    opacity: 0; /* GSAP reveals */
  }

  .hero-subtitle {
    font-size: clamp(1rem, 1.5vw, 1.2rem);
    color: rgba(255,255,255,0.55);
    line-height: 1.7;
    margin-bottom: 2.5rem;
    opacity: 0; /* GSAP reveals */
  }

  .hero-cta-group {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  /* Primary button with particle effect */
  .btn-primary {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.85rem 2.2rem;
    border-radius: 100px;
    background: linear-gradient(135deg, var(--accent-violet), var(--accent-cyan));
    color: #fff;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 1rem;
    text-decoration: none;
    overflow: visible;
    transition: transform 0.3s var(--ease-spring), box-shadow 0.3s;
  }

  .btn-primary:hover {
    transform: translateY(-3px) scale(1.03);
    box-shadow: 0 10px 40px rgba(99, 102, 241, 0.5), 0 0 0 1px rgba(99,102,241,0.3);
  }

  .btn-primary:hover .particle {
    animation: particleBurst 0.6s ease-out forwards;
  }

  .btn-particles {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .particle {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--accent-cyan);
    opacity: 0;
    transform: translate(-50%, -50%);
  }

  @keyframes particleBurst {
    0%   { opacity: 1; transform: translate(-50%, -50%) rotate(calc(var(--i) * 60deg)) translateY(0px) scale(1); }
    100% { opacity: 0; transform: translate(-50%, -50%) rotate(calc(var(--i) * 60deg)) translateY(-30px) scale(0); }
  }

  .btn-ghost {
    color: rgba(255,255,255,0.6);
    text-decoration: none;
    font-size: 0.95rem;
    font-weight: 500;
    transition: color 0.25s;
    padding: 0.5rem 0;
    border-bottom: 1px solid transparent;
  }

  .btn-ghost:hover {
    color: rgba(255,255,255,0.95);
    border-bottom-color: rgba(255,255,255,0.3);
  }
</style>