<<<<<<< HEAD
<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { signOut } from '$lib/auth/auth-client';

	let { children, data } = $props();
	let showMenu = $state(false);

	$effect(() => {
		if (!data?.session) goto('/login');
	});

	async function handleSignOut() {
		await signOut();
		goto('/login');
	}

	const menuItems = [
		{ icon: '◆', label: 'Dashboard', href: '/app/dashboard' },
		{ icon: '📅', label: 'Orar', href: '/app/orar' },
		{ icon: '🗓', label: 'Calendar', href: '/app/calendar' },
		{ icon: '🏫', label: 'Săli de pregătire', href: '/app/sali' },
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
<<<<<<< HEAD
				
					href={item.href}
					style="display:block; padding:10px 14px; border-radius:10px; text-decoration:none; font-size:14px; font-weight:600; color:{$page.url.pathname === item.href ? '#fff' : '#64748b'}; background:{$page.url.pathname === item.href ? '#2563eb' : 'transparent'};"
				<a>
					{item.label}
=======
				<a href={item.href} class="menu-item" class:active={$page.url.pathname === item.href}>
					<span>{item.icon}</span>
					<span>{item.label}</span>
>>>>>>> 1a480e419f874d93dc6346330f127e843c3afa37
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
		letter-spacing: -1px;
		background: linear-gradient(135deg, #0a1628 0%, #2563eb 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.menu {
		display: flex;
		flex-direction: column;
		gap: 8px;
		flex: 1;
	}

	.menu-item {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 12px 16px;
		border-radius: 12px;
		font-size: 15px;
		font-weight: 600;
		color: #64748b;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.menu-item:hover {
		background: #eff6ff;
		color: #2563eb;
	}

	.menu-item.active {
		background: #2563eb;
		color: white;
	}

	.sidebar-footer {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.coin-badge {
		background: #fffbeb;
		color: #d97706;
		padding: 12px 16px;
		border-radius: 12px;
		font-size: 14px;
		display: flex;
		align-items: center;
		gap: 8px;
		border: 1px solid #fde68a;
	}

	.account-wrapper {
		position: relative;
	}

	.account-btn {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		border-radius: 12px;
		background: #eff6ff;
		color: #0a1628;
		font-weight: 600;
		cursor: pointer;
		border: none;
		width: 100%;
		font-family: 'DM Sans', sans-serif;
		font-size: 14px;
	}

	.account-btn:hover {
		background: #dbeafe;
	}

	.account-menu {
		position: absolute;
		top: 110%;
		left: 0;
		right: 0;
		background: white;
		border-radius: 12px;
		box-shadow: 0 4px 20px rgba(0,0,0,0.15);
		overflow: hidden;
		border: 1px solid #e2e8f0;
	}

	.account-menu button {
		width: 100%;
		padding: 12px 16px;
		border: none;
		background: none;
		text-align: left;
		font-size: 14px;
		font-weight: 600;
		color: #ef4444;
		cursor: pointer;
		font-family: 'DM Sans', sans-serif;
	}

	.account-menu button:hover {
		background: #fef2f2;
	}

	.avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: linear-gradient(135deg, #60a5fa, #2563eb);
		flex-shrink: 0;
	}

	.main-content {
		overflow-y: auto;
		padding-right: 8px;
	}

	.main-content::-webkit-scrollbar { width: 6px; }
	.main-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
=======
<script lang="ts">
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { signOut } from '$lib/auth/auth-client';

    let { children, data } = $props();
    let showMenu = $state(false);

    // Protecția se face acum exclusiv pe server (în hooks.server.ts).
    // Am eliminat $effect-ul reactiv care sabota încărcarea paginii.

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
                <a href={item.href} class="menu-item" class:active={$page.url.pathname === item.href}>
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
        letter-spacing: -1px;
        background: linear-gradient(135deg, #0a1628 0%, #2563eb 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .menu {
        display: flex;
        flex-direction: column;
        gap: 8px;
        flex: 1;
    }

    .menu-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 15px;
        font-weight: 600;
        color: #64748b;
        text-decoration: none;
        transition: all 0.2s ease;
    }

    .menu-item:hover {
        background: #eff6ff;
        color: #2563eb;
    }

    .menu-item.active {
        background: #2563eb;
        color: white;
    }

    .sidebar-footer {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .coin-badge {
        background: #fffbeb;
        color: #d97706;
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
        border: 1px solid #fde68a;
    }

    .account-wrapper {
        position: relative;
    }

    .account-btn {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border-radius: 12px;
        background: #eff6ff;
        color: #0a1628;
        font-weight: 600;
        cursor: pointer;
        border: none;
        width: 100%;
        font-family: 'DM Sans', sans-serif;
        font-size: 14px;
    }

    .account-btn:hover {
        background: #dbeafe;
    }

    .account-menu {
        position: absolute;
        top: 110%;
        left: 0;
        right: 0;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        overflow: hidden;
        border: 1px solid #e2e8f0;
    }

    .account-menu button {
        width: 100%;
        padding: 12px 16px;
        border: none;
        background: none;
        text-align: left;
        font-size: 14px;
        font-weight: 600;
        color: #ef4444;
        cursor: pointer;
        font-family: 'DM Sans', sans-serif;
    }

    .account-menu button:hover {
        background: #fef2f2;
    }

    .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: linear-gradient(135deg, #60a5fa, #2563eb);
        flex-shrink: 0;
    }

    .main-content {
        overflow-y: auto;
        padding-right: 8px;
    }

    .main-content::-webkit-scrollbar { width: 6px; }
    .main-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
>>>>>>> 5db2259 (sali pregatire fara AI)
</style>