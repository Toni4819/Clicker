// stats.js
export function initStats({ els, state, formatCompact, totalAutoClicksPerSecond }) {
  // Bloc rapide sous les boutons
  function renderQuickStats() {
    const container = document.getElementById("quickStats");
    if (!container) return;

    container.innerHTML = `
      <h3 style="margin:4px 0; font-size:1em;">📊 Statistiques</h3>
      <div>💰 Points : <strong>${formatCompact(state.points)}</strong></div>
      <div>⚡ Clics automatiques/s : <strong>${formatCompact(totalAutoClicksPerSecond())}</strong></div>
      <div>👆 Points par clic : <strong>${formatCompact(state.pointsPerClick)}</strong></div>
      <div>🌱 Rebirths : <strong>${state.rebirths || 0}</strong></div>
    `;
  }

  // Stats détaillées dans la boutique
  function renderStoreStats() {
    els.statsList.innerHTML = `
      <div class="stat-item">💰 Points totaux : <strong>${formatCompact(state.points)}</strong></div>
      <div class="stat-item">⚡ Clics/s automatiques : <strong>${formatCompact(totalAutoClicksPerSecond())}</strong></div>
      <div class="stat-item">👆 Points par clic : <strong>${formatCompact(state.pointsPerClick)}</strong></div>
      <div class="stat-item">🌱 Rebirths : <strong>${state.rebirths || 0}</strong></div>
      <div class="stat-item">🏭 Auto-clickers : <strong>${state.autoClickers}</strong></div>
      <div class="stat-item">⚙️ Machines totales : <strong>${
        state.machinesLevel1 +
        state.machinesLevel2 +
        state.machinesLevel3 +
        state.machinesLevel4 +
        state.machinesLevel5 +
        state.machinesLevel6 +
        state.machinesLevel7 +
        state.machinesLevel8 +
        state.machinesLevel9 +
        state.machinesLevel10
      }</strong></div>
    `;
  }

  // Initial render
  renderQuickStats();
  renderStoreStats();

  // Rafraîchissement régulier
  setInterval(() => {
    renderQuickStats();
    renderStoreStats();
  }, 1000);
}
