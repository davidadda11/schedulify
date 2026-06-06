<script lang="ts">
  import { enhance } from '$app/forms';

  let { data } = $props();

  let expandedUser = $state<string | null>(null);
  let confirmDelete = $state<string | null>(null);

  function toggleSessions(userId: string) {
    expandedUser = expandedUser === userId ? null : userId;
  }

  function formatDate(d: Date | string) {
    return new Date(d).toLocaleDateString('ro-RO', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }
</script>

<div>
  <h2 class="text-2xl font-bold mb-6">👥 Utilizatori ({data.allUsers.length})</h2>

  <div class="rounded-xl border border-gray-800 overflow-hidden">
    <table class="w-full text-sm">
      <thead class="bg-gray-900 text-gray-400 text-xs uppercase">
        <tr>
          <th class="px-4 py-3 text-left">Utilizator</th>
          <th class="px-4 py-3 text-left">Rol</th>
          <th class="px-4 py-3 text-left">Status</th>
          <th class="px-4 py-3 text-left">Sesiuni active</th>
          <th class="px-4 py-3 text-left">Înregistrat</th>
          <th class="px-4 py-3 text-left">Acțiuni</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-800">
        {#each data.allUsers as user}
          <tr class="bg-gray-950 hover:bg-gray-900 transition {user.banned ? 'opacity-60' : ''}">
            <!-- Utilizator -->
            <td class="px-4 py-3">
              <div class="font-medium text-white">{user.name}</div>
              <div class="text-gray-500 text-xs">{user.email}</div>
              {#if user.school}
                <div class="text-gray-600 text-xs">{user.school} · cls. {user.gradeLevel}</div>
              {/if}
            </td>

            <!-- Rol -->
            <td class="px-4 py-3">
              <form method="POST" action="?/toggleRole" use:enhance>
                <input type="hidden" name="userId" value={user.id} />
                <input type="hidden" name="role" value={user.role} />
                <button
                  type="submit"
                  class="px-2 py-1 rounded text-xs font-medium transition
                         {user.role === 'admin'
                           ? 'bg-indigo-900 text-indigo-300 hover:bg-indigo-800'
                           : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}"
                >
                  {user.role === 'admin' ? '⭐ Admin' : '👤 User'}
                </button>
              </form>
            </td>

            <!-- Status -->
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded text-xs font-medium
                           {user.banned
                             ? 'bg-red-900 text-red-300'
                             : 'bg-green-900 text-green-300'}">
                {user.banned ? '🚫 Suspendat' : '✅ Activ'}
              </span>
            </td>

            <!-- Sesiuni -->
            <td class="px-4 py-3">
              {#if data.sessionsByUser[user.id]?.length}
                <button
                  onclick={() => toggleSessions(user.id)}
                  class="text-blue-400 hover:underline text-xs"
                >
                  {data.sessionsByUser[user.id].length} sesiune(i) →
                </button>
              {:else}
                <span class="text-gray-600 text-xs">—</span>
              {/if}
            </td>

            <!-- Data -->
            <td class="px-4 py-3 text-gray-400 text-xs">
              {formatDate(user.createdAt)}
            </td>

            <!-- Acțiuni -->
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <!-- Ban/Unban -->
                <form method="POST" action="?/toggleBan" use:enhance>
                  <input type="hidden" name="userId" value={user.id} />
                  <input type="hidden" name="banned" value={user.banned} />
                  <button
                    type="submit"
                    class="px-2 py-1 rounded text-xs transition
                           {user.banned
                             ? 'bg-green-900 text-green-300 hover:bg-green-800'
                             : 'bg-yellow-900 text-yellow-300 hover:bg-yellow-800'}"
                  >
                    {user.banned ? 'Activează' : 'Suspendă'}
                  </button>
                </form>

                <!-- Delete -->
                {#if confirmDelete === user.id}
                  <form method="POST" action="?/deleteUser" use:enhance>
                    <input type="hidden" name="userId" value={user.id} />
                    <button type="submit" class="px-2 py-1 rounded text-xs bg-red-700 text-white hover:bg-red-600">
                      Confirmă
                    </button>
                  </form>
                  <button
                    onclick={() => confirmDelete = null}
                    class="px-2 py-1 rounded text-xs bg-gray-800 text-gray-400 hover:bg-gray-700"
                  >
                    Anulează
                  </button>
                {:else}
                  <button
                    onclick={() => confirmDelete = user.id}
                    class="px-2 py-1 rounded text-xs bg-gray-800 text-red-400 hover:bg-red-900"
                  >
                    🗑 Șterge
                  </button>
                {/if}
              </div>
            </td>
          </tr>

          <!-- Sesiuni expandate -->
          {#if expandedUser === user.id && data.sessionsByUser[user.id]}
            <tr class="bg-gray-900">
              <td colspan="6" class="px-6 py-3">
                <p class="text-xs text-gray-400 mb-2 font-medium">Sesiuni active:</p>
                <div class="flex flex-col gap-1">
                  {#each data.sessionsByUser[user.id] as session}
                    <div class="text-xs text-gray-500 bg-gray-800 rounded px-3 py-2">
                      🌐 {session.ipAddress ?? 'IP necunoscut'}
                      · {session.userAgent?.split(' ').slice(-1)[0] ?? 'Agent necunoscut'}
                      · expiră {formatDate(session.expiresAt)}
                    </div>
                  {/each}
                </div>
              </td>
            </tr>
          {/if}
        {/each}
      </tbody>
    </table>
  </div>
</div>