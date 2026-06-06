<!-- src/routes/(app)/+layout.svelte -->
<!-- App Layout — auth guard, Navbar, ambient background       -->

<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let { children, data } = $props();

  // Guard: redirect to login if no session
  $effect(() => {
    if (!data?.session) {
      goto('/login');
    }
  });
</script>

{#if data?.session}
  <div class="app-shell">
    <!-- Ambient background blobs -->
    <div class="ambient-blob"
      style="width:600px;height:600px;background:rgba(99,102,241,0.08);top:-200px;right:-150px;"
      aria-hidden="true"
    ></div>
    <div class="ambient-blob"
      style="width:500px;height:500px;background:rgba(34,211,238,0.05);bottom:-150px;left:-100px;"
      aria-hidden="true"
    ></div>

    <!-- Sidebar Navigation -->
    <aside class="sidebar glass">
      <div class="sidebar-logo">
        <span class="logo-mark">SF</span>
      </div>

      <nav class="sidebar-nav" aria-label="Navigare principală">
        {#each [
          { href: '/dashboard',  icon: '⊞', label: 'Dashboard'  },
          { href: '/calendar',   icon: '◫', label: 'Calendar'   },
          { href: '/schedule',   icon: '◷', label: 'Program'    },
          { href: '/ocr',        icon: '◉', label: 'Scanare'    },
        ] as item}
          <a
            href={item.href}
            class="nav-item"
            class:active={$page.url.pathname.startsWith(item.href)}
            aria-current={$page.url.pathname.startsWith(item.href) ? 'page' : undefined}
          >
            <span class="nav-icon" aria-hidden="true">{item.icon}</span>
            <span class="nav-label">{item.label}</span>
          </a>
        {/each}
      </nav>

      <div class="sidebar-footer">
        <a href="/settings" class="nav-item">
          <span class="nav-icon" aria-hidden="true">⊙</span>
          <span class="nav-label">Setări</span>
        </a>
        {#if data.user?.image}
          <img src={data.user.image} alt={data.user.name} class="user-avatar" />
        {:else}
          <div class="user-avatar-fallback">
            {data.user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
        {/if}
      </div>
    </aside>

    <!-- Main content area -->
    <main class="app-main" id="main-content">
      {@render children()}
    </main>
  </div>
{/if}

<style>
  .app-shell {
    display: flex;
    min-height: 100dvh;
    position: relative;
  }

  /* Sidebar */
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 72px;
    z-index: 100;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.2rem 0;
    border-right: 1px solid var(--border-glass);
    border-radius: 0;
  }

  .sidebar-logo {
    margin-bottom: 2rem;
  }

  .logo-mark {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 1.1rem;
    background: linear-gradient(135deg, var(--accent-violet), var(--accent-cyan));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    flex: 1;
    align-items: center;
  }

  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    width: 52px;
    padding: 0.65rem 0;
    border-radius: 14px;
    text-decoration: none;
    color: rgba(255,255,255,0.35);
    transition: color 0.2s, background 0.2s;
    position: relative;
    cursor: pointer;
    background: none;
    border: none;
    font-family: inherit;
  }

  .nav-item:hover {
    color: rgba(255,255,255,0.7);
    background: rgba(255,255,255,0.05);
  }

  .nav-item.active {
    color: var(--accent-violet);
    background: rgba(99,102,241,0.12);
  }

  .nav-item.active::before {
    content: '';
    position: absolute;
    left: -1px;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 24px;
    border-radius: 0 3px 3px 0;
    background: var(--accent-violet);
  }

  .nav-icon {
    font-size: 1.2rem;
    line-height: 1;
  }

  .nav-label {
    font-size: 0.58rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .sidebar-footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.8rem;
  }

  .user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--border-glass);
  }

  .user-avatar-fallback {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--accent-violet), var(--accent-cyan));
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 0.85rem;
    color: #fff;
  }

  /* Main */
  .app-main {
    flex: 1;
    margin-left: 72px;
    min-height: 100dvh;
    padding: clamp(1.5rem, 3vw, 2.5rem);
    position: relative;
    z-index: 1;
  }

  /* Responsive: hide sidebar on mobile, show bottom nav */
  @media (max-width: 640px) {
    .sidebar {
      display: none;
    }
    .app-main {
      margin-left: 0;
      padding-bottom: 5rem;
    }
  }
</style>