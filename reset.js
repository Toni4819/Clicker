// reset.js

export function initReset({ els, state, keys, save, renderMain }) {
  els.resetBtn.addEventListener("click", () => {
    const confirmReset = confirm(
      "⚠️ Réinitialiser TOUT, y compris les Rebirths ? Cette action est irréversible."
    );
    if (!confirmReset) return;

    // 1) Remettre chaque clé à zéro (pointsPerClick reste à 1)
    keys.forEach(k => {
      state[k] = k === "pointsPerClick" ? 1 : 0;
    });

    // 2) Réinitialiser le compteur de Rebirth dans le state
    state.rebirths = 0;

    // 3) Supprimer la donnée persistée des Rebirths
    localStorage.removeItem("rebirthCount");

    // 4) Sauvegarder et rafraîchir l’affichage
    save();
    renderMain();
  });
}
