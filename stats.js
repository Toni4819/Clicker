// stats.js
export function initStats({ els, state, formatCompact, totalAutoClicksPerSecond }) {
  // --- Rendu des stats rapides sous les boutons ---
  function renderQuickStats() {
    const qsPoints   = document.getElementById("qsPoints");
    const qsCps      = document.getElementById("qsCps");
    const qsPpc      = document.getElementById("qsPpc");
    const qsRebirths = document.getElementById("qsRebirths");

    if (qsPoints)   qsPoints.textContent   = formatCompact(state.points);
    if (qsCps)      qsCps.textContent      = formatCompact(totalAutoClicksPerSecond());
    if (qsPpc)      qsPpc.textContent      = formatCompact(state.pointsPerClick);
    if (qsRebirths) qsRebirths.textContent = state.rebirths || 0;
  }

  // --- Rendu des stats détaillées dans la boutique ---
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

  // --- Mise à jour initiale ---
  renderQuickStats();
  renderStoreStats();

  // --- Rafraîchissement régulier ---
  setInterval(() => {
    renderQuickStats();
    renderStoreStats();
  }, 1000);
}
