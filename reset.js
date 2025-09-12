// reset.js
export function initReset({ els, state, keys, save, renderMain }) {
  els.resetBtn.addEventListener("click", () => {
    // 1) Remettre chaque clé à zéro (sauf pointsPerClick = 1)
    keys.forEach(k => {
      state[k] = k === "pointsPerClick" ? 1 : 0;
    });

    // 2) Sauvegarder et rafraîchir l’affichage
    save();
    renderMain();
  });
}
