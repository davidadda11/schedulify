<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { signOut } from '$lib/auth/auth-client';
    import { onMount } from 'svelte';

    let { children, data } = $props();
    let showMenu = $state(false);

    // Redirect to login if not authenticated
    onMount(() => {
        if (!data?.session) {
            goto('/login');
        }
    });

    async function handleSignOut() {
        await signOut();
        window.location.href = '/login';
    }

    const menuItems = [
        { icon: '◆', label: 'Dashboard', href: '/app/dashboard' },
        { icon: '📅', label: 'Orar', href: '/app/orar' },
        { icon: '🗓', label: 'Calendar', href: '/app/calendar' },
        { icon: '🏫', label: 'Săli de pregătire', href: '/sali-pregatire' },
        { icon: '💬', label: 'Chat', href: '/app/chat' },
        { icon: '⚙️', label: 'Setări', href: '/app/setari' },
    ];
</script>

{#if data?.session}
<div class="shell">
    <aside class="sidebar card">
        <div class="branding">
            <span class="brand-title">Schedulify</span>
        </div>

        <nav class="menu">
            {#each menuItems as item}
                <a href={item.href} class="menu-item" class:active={$page.url.pathname === item.href || $page.url.pathname.startsWith('/sali-pregatire') && item.href === '/sali-pregatire'}>
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                </a>
            {/each}
        </nav>

        <div class="sidebar-footer">
            <div class="coin-badge">
                🪙 <strong>25 Coins</strong>
            </div>
            <div class="account-wrapper">
                <button class="account-btn" onclick={() => showMenu = !showMenu}>
                    <div class="avatar"></div>
                    <span>Contul meu</span>
                </button>
                {#if showMenu}
                    <div class="account-menu">
                        <button onclick={handleSignOut}>Sign Out</button>
                    </div>
                {/if}
            </div>
        </div>
    </aside>

    <main class="main-content">
        {@render children()}
    </main>
</div>
{:else}
  <!-- debug temporar -->
  <p style="color:white">Session: {JSON.stringify(data)}</p>
{/if}

<style>
    .shell {
        display: grid;
        grid-template-columns: 260px 1fr;
        height: 100vh;
        padding: 24px;
        gap: 32px;
        background: #0a1628;
    }

    .card {
        background: rgba(255,255,255,0.95);
        border-radius: 24px;
        box-shadow: 0 0 0 1px rgba(37,99,235,0.1), 0 16px 40px rgba(10,22,40,0.4);
    }

    .sidebar {
        display: flex;
        flex-direction: column;
        padding: 32px 24px;
        height: 100%;
    }

    .branding {
        margin-bottom: 40px;
    }

    .brand-title {
        font-family: 'Syne', sans-serif;
        font-size: 24px;
        font-weight: 800;
        color: #0f2347;
        margin: 0;
    }

    .menu {
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex: 1;
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .menu-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 500;
        color: #64748b;
        text-decoration: none;
        transition: all 0.15s;
        border: 1px solid transparent;
    }

    .menu-item:hover {
        background: #f1f5f9;
        color: #2563eb;
    }

    .menu-item.active {
        background: #eff6ff;
        color: #2563eb;
        border-color: rgba(37,99,235,0.1);
    }

    .sidebar-footer {
        display: flex;
        flex-direction: column;
        gap: 12px;
        border-top: 1px solid #e2e8f0;
        padding-top: 16px;
    }

    .coin-badge {
        background: #fef3c7;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 13px;
        color: #92400e;
        text-align: center;
    }

    .account-wrapper {
        position: relative;
    }

    .account-btn {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        background: #f1f5f9;
        border: none;
        padding: 10px 12px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 13px;
        color: #64748b;
        transition: all 0.15s;
        border: 1px solid #e2e8f0;
    }

    .account-btn:hover {
        background: #e2e8f0;
    }

    .avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: linear-gradient(135deg, #2563eb, #06b6d4);
    }

    .account-menu {
        position: absolute;
        bottom: 48px;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        z-index: 10;
        overflow: hidden;
    }

    .account-menu button {
        width: 100%;
        padding: 10px 12px;
        border: none;
        background: none;
        text-align: left;
        font-size: 13px;
        color: #64748b;
        cursor: pointer;
        transition: background 0.15s;
    }

    .account-menu button:hover {
        background: #f1f5f9;
        color: #ef4444;
    }

    .main-content {
        overflow-y: auto;
        display: flex;
        flex-direction: column;
    }

    @media (max-width: 1024px) {
        .shell {
            grid-template-columns: 1fr;
            gap: 0;
            padding: 0;
            height: auto;
        }

        .sidebar {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            padding: 16px;
            height: auto;
        }

        .menu {
            grid-column: 1 / -1;
            flex-direction: row;
            flex-wrap: wrap;
            gap: 4px;
        }

        .main-content {
            padding: 24px;
        }
    }
</style>
