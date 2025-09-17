export function initReset({ els, state, keys, save, renderMain }) {
  els.resetBtn.addEventListener("click", () => {
    const confirmReset = confirm(
      "⚠️ Réinitialiser TOUT, y compris les Rebirths ? Cette action est irréversible."
    );
    if (!confirmReset) return;

    // Réinitialisation ciblée
    for (const k of keys) {
      if (k === "shopBoost") continue;           // on conserve le boost shop
      if (k === "pointsPerClick") state[k] = 1;  // clic manuel minimum
      else state[k] = 0;
    }

    state.rebirths = 0;
    localStorage.removeItem("rebirthCount");

    save();
    renderMain();
  });
}
