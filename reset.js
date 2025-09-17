export function initReset({ els, state, keys, save, renderMain }) {
  els.resetBtn.addEventListener("click", () => {
    const confirmReset = confirm(
      "⚠️ Réinitialiser TOUT, y compris les Rebirths ? Cette action est irréversible."
    );
    if (!confirmReset) return;

    // 1) Réinitialiser chaque clé
    keys.forEach(k => {
      if (k === "pointsPerClick") {
        state[k] = 1; // toujours au moins 1
      } else if (k === "shopBoost") {
        // ne pas toucher au boost du shop
      } else {
        state[k] = 0;
      }
    });

    // 2) Réinitialiser le compteur de Rebirth
    state.rebirths = 0;
    localStorage.removeItem("rebirthCount");

    // 3) Sauvegarder
    save();

    // 4) Rafraîchir l’affichage principal
    renderMain();

    // 5) Rafraîchir les stats dynamiques si disponibles
    if (typeof window.renderQuickStats === "function") {
      window.renderQuickStats();
    }
  });
}
