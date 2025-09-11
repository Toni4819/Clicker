/**
 * Initialise le bouton Réinitialiser
 * @param {Object} deps
 * @param {Object} deps.els
 * @param {Object} deps.state
 * @param {Array}  deps.keys
 * @param {Function} deps.save
 * @param {Function} deps.renderMain
 */
export function initReset({ els, state, keys, save, renderMain }) {
  els.resetBtn.addEventListener("click", () => {
    const ok = confirm(
      "Réinitialiser le jeu ?\nCette action supprimera toute votre progression."
    );
    if (!ok) return;
    for (const k of keys) {
      state[k] = k === "pointsPerClick" ? 1 : 0;
    }
    save();
    renderMain();
  });
}
