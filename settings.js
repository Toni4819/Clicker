// settings.js
export function initSettings({ els, state, keys, save, renderMain }) {
  // Création/configuration du modal
  const modal = document.getElementById("settingsModal");
  modal.className = "modal";
  modal.setAttribute("aria-hidden", "true");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-labelledby", "settingsTitle");

  // Contenu du modal
  modal.innerHTML = `
    <div class="modal-content">
      <header class="modal-header">
        <h2 id="settingsTitle">⚙️ Paramètres</h2>
        <button id="closeSettingsBtn" class="close-btn" aria-label="Fermer">✕</button>
      </header>
      <div class="modal-body" id="settingsBody">
        <button id="resetBtn" class="btn footer-reset">↺ Reset total</button>
      </div>
    </div>
  `;

  // Références
  els.closeSettingsBtn = modal.querySelector("#closeSettingsBtn");
  els.resetBtn         = modal.querySelector("#resetBtn");

  // Ouvre le menu paramètres
  function openSettings() {
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  // Ferme le menu paramètres
  function closeSettings() {
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  // Événement ouverture via ⚙️
  els.settingsBtn.addEventListener("click", openSettings);

  // Fermeture
  els.closeSettingsBtn.addEventListener("click", closeSettings);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeSettings();
  });

  // Logique de reset (fusionnée depuis reset.js)
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
    closeSettings();
  });
}
