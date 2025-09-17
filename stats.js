export function initStats({
  els,
  state,
  formatCompact,
  totalAutoClicksPerSecond,
  getRebirthBoostFactor,
  getShopBoostFactor
}) {
  function renderQuickStats() {
    const container = document.getElementById("quickStats");
    if (!container) return;

    const rebirthBoostPct = (getRebirthBoostFactor() - 1) * 100;
    const shopBoost       = getShopBoostFactor();
    const shopBoostPct    = (shopBoost - 1) * 100;
    const totalBoost      = getRebirthBoostFactor() * shopBoost;

    container.innerHTML = `
      <h3 style="margin:4px 0 6px; font-size:1em;">📊 Statistiques</h3>
      <div>💰 Points totaux : <strong>${formatCompact(state.points)}</strong></div>
      <div>⚡ Clics/s automatiques (réels) : <strong>${totalAutoClicksPerSecond().toFixed(2)}</strong></div>
      <div>👆 Points par clic (réels) : <strong>${(state.pointsPerClick * totalBoost).toFixed(2)}</strong></div>

      <div>🌱 Rebirths : <strong>${state.rebirths}</strong> — 🔼 Boost Rebirth : <strong>+${rebirthBoostPct.toFixed(2)}%</strong></div>
      <div>🏪 Shop boost : <strong>x${shopBoost.toFixed(2)}</strong> — 🔼 +${shopBoostPct.toFixed(2)}%</div>
      <div>🚀 Boost total : <strong>x${totalBoost.toFixed(2)}</strong></div>

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

  // Mise à jour automatique toutes les 500 ms
  setInterval(renderQuickStats, 500);
}
