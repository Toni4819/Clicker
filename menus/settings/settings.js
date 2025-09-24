import { initAuthUI, handleRedirectResult } from "./auth.js";
import { initImportExport } from "./import-export.js";
import { enterCode } from "./codes.js";
import { doReset } from "./reset.js";

export function initSettings({ els, state, save, renderMain }) {
  const settingsBtn = els.settingsBtn;
  if (!settingsBtn) {
    console.error("initSettings : #settingsBtn introuvable");
    return;
  }

  // --- Création / récupération de la modale principale ---
  let modal = els.settingsModal;
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "settingsModal";
    modal.className = "modal";
    modal.setAttribute("aria-hidden", "true");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-labelledby", "settingsTitle");
    document.body.append(modal);
    els.settingsModal = modal;
  }

  modal.innerHTML = `
    <div class="modal-content" role="document" style="max-width:560px; margin:0 auto;">
      <header class="modal-header">
        <h2 id="settingsTitle">⚙️ Paramètres</h2>
        <button class="close-btn" aria-label="Fermer">✕</button>
      </header>
      <div class="modal-body" id="settingsBody"></div>
    </div>
  `;

  const body     = modal.querySelector("#settingsBody");
  const closeBtn = modal.querySelector(".close-btn");

  function openSettings() {
    renderSettingsBody();
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    const firstButton = modal.querySelector("button");
    if (firstButton) firstButton.focus();
  }

  function closeSettings() {
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    settingsBtn.focus();
  }

  function renderSettingsBody() {
    body.innerHTML = `
      <div class="section" style="text-align:center; margin-bottom:12px;">
        <button id="loginBtn" class="btn btn-shop">Se connecter avec Microsoft</button>
      </div>

      <div class="section" style="text-align:center; display:flex; justify-content:center; gap:12px; margin-bottom:12px;">
        <button id="exportBtn" class="btn btn-secondary">Exporter</button>
        <button id="importBtn" class="btn btn-secondary">Importer</button>
      </div>

      <div class="section" style="text-align:center; margin-bottom:12px;">
        <button id="codesBtn" class="btn btn-primary">Entrer un code</button>
      </div>

      <div class="section" style="text-align:center; margin-top:20px;">
        <button id="resetBtn" class="btn btn-warning" style="padding:12px 18px;">Réinitialiser</button>
      </div>
    `;

    const loginBtn  = body.querySelector("#loginBtn");
    const exportBtn = body.querySelector("#exportBtn");
    const importBtn = body.querySelector("#importBtn");
    const codesBtn  = body.querySelector("#codesBtn");
    const resetBtn  = body.querySelector("#resetBtn");

    if (loginBtn) loginBtn.addEventListener("click", () => {
      loginBtn.disabled = true;
      loginBtn.textContent = "Connexion...";
      openMicrosoftLogin();
    });

    if (exportBtn) exportBtn.addEventListener("click", () => {
      const ie = initImportExport();
      ie.exportState(state);
    });

    if (importBtn) importBtn.addEventListener("click", () => {
      const ie = initImportExport();
      ie.importState(state, save, renderMain, renderSettingsBody);
    });

    if (codesBtn) codesBtn.addEventListener("click", () => {
      enterCode(state, save, renderMain, renderSettingsBody);
    });

    if (resetBtn) resetBtn.addEventListener("click", () => {
      doReset(state, save, renderMain, renderSettingsBody);
    });
  }

  settingsBtn.addEventListener("click", openSettings);
  closeBtn.addEventListener("click", closeSettings);
  modal.addEventListener("click", e => {
    if (e.target === modal) closeSettings();
  });

  // Injecte le modal secondaire et initialise les événements auth
  initAuthUI({ save, renderMain });

  // Gestion du retour OAuth
  handleRedirectResult(({ user }) => {
    if (user) {
      state.user = { name: user.displayName || "Utilisateur" };
      save();
      renderMain();
    }
  }).catch(err => console.error("Erreur retour OAuth:", err));
}
