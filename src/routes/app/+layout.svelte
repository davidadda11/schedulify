<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { children, data } = $props();

	$effect(() => {
		if (!data?.session) goto('/login');
	});

	const menuItems = [
		{ label: 'Dashboard', href: '/app/dashboard' },
		{ label: 'Orar', href: '/app/orar' },
		{ label: 'Calendar', href: '/app/calendar' },
		{ label: 'Săli de pregătire', href: '/app/sali' },
		{ label: 'Chat', href: '/app/chat' },
		{ label: 'Setări', href: '/app/setari' },
	];
</script>

{#if data?.session}
	<div style="display:flex; height:100vh; background:#0a1628;">
		<aside style="width:220px; background:rgba(255,255,255,0.95); border-radius:0 24px 24px 0; padding:32px 20px; display:flex; flex-direction:column; gap:8px; flex-shrink:0;">
			<h1 style="font-size:20px; font-weight:800; color:#2563eb; margin-bottom:24px;">Schedulify</h1>
			{#each menuItems as item}
				
					href={item.href}
					style="display:block; padding:10px 14px; border-radius:10px; text-decoration:none; font-size:14px; font-weight:600; color:{$page.url.pathname === item.href ? '#fff' : '#64748b'}; background:{$page.url.pathname === item.href ? '#2563eb' : 'transparent'};"
				>
					{item.label}
				</a>
			{/each}
		</aside>
		<main style="flex:1; overflow-y:auto;">
			{@render children()}
		</main>
	</div>
{/if}