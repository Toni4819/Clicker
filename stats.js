export function initStats({
  els,
  state,
  formatCompact,
  totalAutoClicksPerSecond,  // boosté
  getRebirthBoostFactor,
  formatPercentNoZeros,
  formatNumberTrimZeros
}) {
  function renderQuickStats() {
    const container = document.getElementById("quickStats");
    if (!container) return;

    const boostPct = (getRebirthBoostFactor() - 1) * 100;

    container.innerHTML = `
      <h3 style="margin:4px 0 6px; font-size:1em;">📊 Statistiques</h3>
      <div>💰 Points totaux : <strong>${formatCompact(state.points)}</strong></div>
      <div>⚡ Clics/s automatiques (réels) : <strong>${formatNumberTrimZeros(totalAutoClicksPerSecond())}</strong></div>
      <div>👆 Points par clic (réels) : <strong>${formatNumberTrimZeros(state.pointsPerClick * getRebirthBoostFactor())}</strong></div>
      <div>🌱 Rebirths : <strong>${state.rebirths || 0}</strong> — 🔼 Boost : <strong>+${formatPercentNoZeros(boostPct)}%</strong></div>
      <div>🏭 Auto-clickers : <strong>${state.autoClickers}</strong></div>
      <div>⚙️ Machines totales : <strong>${
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
}
