<script lang="ts">
  import { page } from '$app/stores';
  let { children } = $props();

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '🏠' },
    { href: '/admin/users', label: 'Utilizatori', icon: '👥' },
  ];
</script>

<div class="flex min-h-screen bg-gray-950 text-white">
  <!-- Sidebar -->
  <aside class="w-56 bg-gray-900 border-r border-gray-800 flex flex-col p-4 gap-2">
    <div class="mb-6">
      <h1 class="text-lg font-bold text-indigo-400">⚙ Admin</h1>
      <p class="text-xs text-gray-500">Schedulify</p>
    </div>

    {#each navItems as item}
      
        href={item.href}
        class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition
               {$page.url.pathname === item.href
                 ? 'bg-indigo-600 text-white'
                 : 'text-gray-400 hover:bg-gray-800 hover:text-white'}"
      >
        <span>{item.icon}</span>
        {item.label}
      </a>
    {/each}

    <div class="mt-auto">
      <a href="/" class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-white">
        ← Înapoi la app
      </a>
    </div>
  </aside>

  <!-- Content -->
  <main class="flex-1 p-8 overflow-y-auto">
    {@render children()}
  </main>
</div>