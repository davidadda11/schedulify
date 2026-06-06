<script lang="ts">
  let { data } = $props();
</script>

<div>
  <h2 class="text-2xl font-bold mb-2">Bun venit, {data.adminUser.name}!</h2>
  <p class="text-gray-400 mb-8">Panou de administrare Schedulify</p>

  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <div class="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <p class="text-sm text-gray-400">Total utilizatori</p>
      <p class="text-3xl font-bold text-white mt-1">{data.totalUsers}</p>
    </div>
    <div class="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <p class="text-sm text-gray-400">Conturi suspendate</p>
      <p class="text-3xl font-bold text-red-400 mt-1">{data.bannedUsers}</p>
    </div>
    <div class="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <p class="text-sm text-gray-400">Admini</p>
      <p class="text-3xl font-bold text-indigo-400 mt-1">{data.adminCount}</p>
    </div>
  </div>
</div>