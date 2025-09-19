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

  // Reset total du localStorage + clics à 1
  function performFullReset() {
    const confirmReset = confirm(
      "⚠️ Réinitialiser TOUT le stockage local et remettre les clics à 1 ? Cette action est irréversible."
    );
    if (!confirmReset) return;

    localStorage.clear();

    state.pointsPerClick = 1;
    state.tempShopBoostFactor = 1;
    state.tempShopBoostExpiresAt = 0;

    save();
    renderMain();
    closeSettings();
  }

  // Événements
  els.settingsBtn.addEventListener("click", openSettings);
  els.closeSettingsBtn.addEventListener("click", closeSettings);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeSettings();
  });

  els.loginBtn.addEventListener("click", () => {
    console.log("Fonction de connexion à implémenter");
  });

  els.exportBtn.addEventListener("click", () => {
    console.log("Fonction d'export à implémenter");
  });

  els.importBtn.addEventListener("click", () => {
    console.log("Fonction d'import à implémenter");
  });

  els.resetBtn.addEventListener("click", performFullReset);
}
