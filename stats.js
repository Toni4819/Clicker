// stats.js
export function initStats({
  els,
  state,
  formatCompact,
  totalAutoClicksPerSecond,
  getRebirthBoostFactor,
  getShopBoostFactor
}) {
  // Formatteur de durée mm:ss
  function formatDuration(ms) {
    if (ms <= 0) return "00:00";
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  }

  function renderQuickStats() {
    const c = document.getElementById("quickStats");
    if (!c) return;

    // Données
    const points    = state.points;
    const cps       = totalAutoClicksPerSecond();
    const boostReb  = getRebirthBoostFactor();
    const boostShop = getShopBoostFactor();
    const boostTemp = state.tempShopBoostFactor || 1;
    const overall   = boostReb * boostShop * boostTemp;

    // % gains
    const pctReb  = ((boostReb - 1) * 100).toFixed(1);
    const pctShop = ((boostShop - 1) * 100).toFixed(1);

    // Temps restant temp boost
    let tempLine = "";
    if (state.tempShopBoostExpiresAt) {
      const rem = state.tempShopBoostExpiresAt - Date.now();
      if (rem > 0) {
        tempLine = `
          <div class="stat-line">
            ⏳ Boost ×2 temporaire : 
            <strong>${formatDuration(rem)}</strong>
          </div>`;
      }
    }

    // Rendu HTML
    c.innerHTML = `
      <h3>📊 Production</h3>
      <div class="stat-line">🪙 Points : <strong>${formatCompact(points)}</strong></div>
      <div class="stat-line">⚡ CPS : <strong>${cps.toFixed(2)}</strong></div>
      <div class="stat-line">👆 PPC : <strong>${(state.pointsPerClick * overall).toFixed(2)}</strong></div>

      <h3>🚀 Boosts</h3>
      <div class="stat-line">🌱 Rebirth : <strong>x${boostReb.toFixed(2)}</strong> (+${pctReb}%)</div>
      <div class="stat-line">🏪 Shop permanent : <strong>x${boostShop.toFixed(2)}</strong> (+${pctShop}%)</div>
      ${tempLine}

      <h3>🏭 Infrastructure</h3>
      <div class="stat-line">Auto-clickers : <strong>${state.autoClickers}</strong></div>
      <div class="stat-line">Machines : <strong>${
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

  // Auto-rafraîchir toutes les 300 ms
  setInterval(renderQuickStats, 300);
}
