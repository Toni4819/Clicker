// stats.js
export function initStats({ els, state, formatCompact, totalAutoClicksPerSecond }) {
  function renderStats() {
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

  // Mise à jour initiale
  renderStats();

  // Rafraîchir à chaque seconde
  setInterval(renderStats, 1000);
}
