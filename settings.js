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
    <div class="modal-content" style="display:flex;flex-direction:column;height:100%;">
      <header class="modal-header">
        <h2 id="settingsTitle">⚙️ Paramètres</h2>
        <button id="closeSettingsBtn" class="close-btn" aria-label="Fermer">✕</button>
      </header>

      <div class="modal-body" id="settingsBody" style="flex:1;display:flex;flex-direction:column;gap:16px;">
        <button id="loginBtn" class="btn">🔑 Se connecter</button>

        <div style="display:flex;gap:8px;">
          <button id="exportBtn" class="btn">📤 Exporter</button>
          <button id="importBtn" class="btn">📥 Importer</button>
        </div>

        <div style="flex:1;"></div> <!-- pousse le reset en bas -->
        <div style="display:flex;justify-content:center;">
          <button id="resetBtn" class="btn footer-reset">↺ Reset total</button>
        </div>
      </div>
    </div>
  `;

  // Références
  els.closeSettingsBtn = modal.querySelector("#closeSettingsBtn");
  els.resetBtn         = modal.querySelector("#resetBtn");
  els.loginBtn         = modal.querySelector("#loginBtn");
  els.exportBtn        = modal.querySelector("#exportBtn");
  els.importBtn        = modal.querySelector("#importBtn");

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

  // Bouton Se connecter (fonction vide)
  els.loginBtn.addEventListener("click", () => {
    console.log("Fonction de connexion à implémenter");
  });

  // Bouton Exporter (fonction vide)
  els.exportBtn.addEventListener("click", () => {
    console.log("Fonction d'export à implémenter");
  });

  // Bouton Importer (fonction vide)
  els.importBtn.addEventListener("click", () => {
    console.log("Fonction d'import à implémenter");
  });

  // Logique de reset (inclut reset des boosts temporaires du shop)
  els.resetBtn.addEventListener("click", () => {
    const confirmReset = confirm(
      "⚠️ Réinitialiser TOUT, y compris les Rebirths et boosts ? Cette action est irréversible."
    );
    if (!confirmReset) return;

    // Réinitialisation ciblée
    for (const k of keys) {
      if (k === "shopBoost") continue;           // on conserve le boost shop permanent
      if (k === "pointsPerClick") state[k] = 1;  // clic manuel minimum
      else state[k] = 0;
    }

    state.rebirths = 0;
    localStorage.removeItem("rebirthCount");

    // 🔄 Réinitialisation des boosts temporaires du shop
    state.tempShopBoostFactor    = 1;
    state.tempShopBoostExpiresAt = 0;
    localStorage.removeItem("shopTempExpiresAt");
    localStorage.removeItem("shopTempBoostFactor");

    save();
    renderMain();
    closeSettings();
  });
}
