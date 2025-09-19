// stats.js
export function initStats({
  els,
  state,
  getRebirthBoostFactor,
  getShopBoostFactor
}) {
  // Format mm:ss
  function formatDuration(ms) {
    if (ms <= 0) return "00:00";
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function renderQuickStats() {
    const c = document.getElementById("quickStats");
    if (!c) return;

    // Calcul des boosts
    const rebBoost  = getRebirthBoostFactor();
    const shopBoost = getShopBoostFactor();
    const tempBoost = state.tempShopBoostFactor || 1;
    const totalBoost= rebBoost * shopBoost * tempBoost;

    // Pourcentages
    const pctReb  = ((rebBoost - 1) * 100).toFixed(1);
    const pctShop = ((shopBoost - 1) * 100).toFixed(1);

    // Durée restante du boost temporaire
    let timeLine = "";
    if (state.tempShopBoostExpiresAt) {
      const remaining = state.tempShopBoostExpiresAt - Date.now();
      if (remaining > 0) {
        timeLine = `
  <div class="stat-line">
    ⏳ Boost temporaire : <strong>${formatDuration(remaining)}</strong>
  </div>`;
      }
    }

    // Total machines
    const totalMachines =
      state.machinesLevel1 +
      state.machinesLevel2 +
      state.machinesLevel3 +
      state.machinesLevel4 +
      state.machinesLevel5 +
      state.machinesLevel6 +
      state.machinesLevel7 +
      state.machinesLevel8 +
      state.machinesLevel9 +
      state.machinesLevel10;

    // Mise à jour du DOM
    c.innerHTML = `
  <section class="stats-section">
    <h3>🚀 Boosts</h3>
    <div class="stat-line">
      🌱 Rebirth : <strong>x${rebBoost.toFixed(2)}</strong> (+${pctReb}%)
    </div>
    <div class="stat-line">
      🏪 Shop : <strong>x${shopBoost.toFixed(2)}</strong> (+${pctShop}%)
    </div>
    ${timeLine}
  </section>

  <section class="stats-section">
    <h3>🏭 Infrastructure</h3>
    <div class="stat-line">
      Auto-clickers : <strong>${state.autoClickers}</strong>
    </div>
    <div class="stat-line">
      Machines : <strong>${totalMachines}</strong>
    </div>
  </section>
`;
  }

  // Auto-rafraîchissement léger
  setInterval(renderQuickStats, 300);
}
