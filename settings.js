// settings.js
export function initSettings({ els, resetProgress }) {
  // Récupère le placeholder
  const modal = document.getElementById("settingsModal");
  modal.className = "modal";
  modal.setAttribute("aria-hidden", "true");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-labelledby", "settingsTitle");

  // Injecte le markup du modal
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

  // Bind sur le ⚙️
  els.settingsBtn.addEventListener("click", () => {
    openSettings();
  });

  // Fermeture
  els.closeSettingsBtn.addEventListener("click", closeSettings);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeSettings();
  });

  // Reset
  els.resetBtn.addEventListener("click", () => {
    if (confirm("⚠️ Tout votre progrès sera perdu. Voulez-vous vraiment réinitialiser ?")) {
      closeSettings();
      resetProgress();
    }
  });
}
