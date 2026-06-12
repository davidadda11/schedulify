<!-- src/routes/+layout.svelte -->
<!-- Root Layout — page transitions, session context, GSAP     -->

<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { afterNavigate, beforeNavigate } from '$app/navigation';
  import { page } from '$app/stores';
  import gsap from 'gsap';

  let { children, data }: { children: any; data: any } = $props();

  let mainEl: HTMLElement;
  let isTransitioning = $state(false);

  beforeNavigate(() => {
    if (!mainEl) return;
    isTransitioning = true;
    gsap.to(mainEl, {
      opacity: 0,
      y: -10,
      duration: 0.25,
      ease: 'power2.in',
      clearProps: 'transform',
    });
  });

  afterNavigate(() => {
    if (!mainEl) return;
    gsap.fromTo(
      mainEl,
      { opacity: 0, y: 14 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'expo.out',
        clearProps: 'all',
        onComplete: () => { isTransitioning = false; },
      }
    );
    window.scrollTo(0, 0);
  });
</script>

<main bind:this={mainEl} id="main-content">
  {@render children()}
</main>