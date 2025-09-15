// stats.js
export function initStats({
  els,
  state,
  formatCompact,
  totalAutoClicksPerSecond,  // boosté
  getRebirthBoostFactor,
  formatPercentNoZeros,
  formatNumberNoZeros
}) {
  function renderQuickStats() {
    const container = document.getElementById("quickStats");
    if (!container) return;

    const boostPct = (getRebirthBoostFactor() - 1) * 100;

    container.innerHTML = `
      <h3 style="margin:4px 0 6px; font-size:1em;">📊 Statistiques</h3>
      <div>💰 Points : <strong>${formatCompact(state.points)}</strong></div>
      <div>⚡ Clics automatiques/s : <strong>${formatNumberNoZeros(totalAutoClicksPerSecond())}</strong></div>
      <div>👆 Points par clic : <strong>${formatNumberNoZeros(state.pointsPerClick * getRebirthBoostFactor())}</strong></div>
      <div>🌱 Rebirths : <strong>${state.rebirths || 0}</strong>  —  🔼 Boost : <strong>+${formatPercentNoZeros(boostPct)}%</strong></div>
    `;
  }

  function renderStoreStats() {
    const boostPct = (getRebirthBoostFactor() - 1) * 100;
    els.statsList.innerHTML = `
      <div class="stat-item">💰 Points totaux : <strong>${formatCompact(state.points)}</strong></div>
      <div class="stat-item">⚡ Clics/s automatiques (réels) : <strong>${formatNumberNoZeros(totalAutoClicksPerSecond())}</strong></div>
      <div class="stat-item">👆 Points par clic (réels) : <strong>${formatNumberNoZeros(state.pointsPerClick * getRebirthBoostFactor())}</strong></div>
      <div class="stat-item">🌱 Rebirths : <strong>${state.rebirths || 0}</strong> — 🔼 Boost : <strong>+${formatPercentNoZeros(boostPct)}%</strong></div>
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

  renderQuickStats();
  renderStoreStats();
  setInterval(() => {
    renderQuickStats();
    renderStoreStats();
  }, 1000);
}
