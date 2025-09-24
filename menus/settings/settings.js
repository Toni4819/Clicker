// menus/settings/settings.js
import { openMicrosoftLogin, handleRedirectResult } from "./auth.js";
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
    <div class="modal-content" role="document">
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
  }
  function closeSettings() {
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  // Rendu du contenu en respectant l'ordre et les classes de style
  function renderSettingsBody() {
    const logged = !!state.user;
    // ordre demandé :
    // - bouton secondaire (vert) en dessous
    // - export & import en bleu clair
    // - bouton codes en orange en dessous
    // - bouton reset en rouge, un peu plus espacé
    body.innerHTML = `
      <div class="section">
        ${logged
          ? `<button id="logoutBtn" class="item-btn btn btn-shop">Se déconnecter</button>`
          : `<button id="loginBtn" class="item-btn btn btn-shop">Se connecter avec Microsoft</button>`}
      </div>

      <div class="section" style="display:flex; gap:10px; margin-bottom:8px;">
        <button id="exportBtn" class="item-btn btn btn-secondary">Exporter</button>
        <button id="importBtn" class="item-btn btn btn-secondary">Importer</button>
      </div>

      <div class="section" style="margin-bottom:8px;">
        <button id="codesBtn" class="item-btn btn btn-primary">Entrer un code</button>
      </div>

      <div class="section" style="margin-top:16px;">
        <button id="resetBtn" class="item-btn btn btn-warning" style="padding:12px 16px;">Réinitialiser</button>
      </div>
    `;

    // Rebind boutons internes
    const loginBtn  = body.querySelector("#loginBtn");
    const logoutBtn = body.querySelector("#logoutBtn");
    const exportBtn = body.querySelector("#exportBtn");
    const importBtn = body.querySelector("#importBtn");
    const codesBtn  = body.querySelector("#codesBtn");
    const resetBtn  = body.querySelector("#resetBtn");

    if (loginBtn)  loginBtn.addEventListener("click", () => openMicrosoftLogin());
    if (logoutBtn) logoutBtn.addEventListener("click", async () => {
      // déléguer la déconnexion au code appelant si présent
      try {
        // signOut est géré dans auth.js si nécessaire
        if (typeof window.__appSignOut === "function") await window.__appSignOut();
        state.user = null;
        save();
        renderMain();
        renderSettingsBody();
      } catch (err) {
        console.error("Erreur de déconnexion:", err);
      }
    });

    if (exportBtn) exportBtn.addEventListener("click", () => {
      // délègue à import-export
      initImportExport().exportState(state, save, renderMain, renderSettingsBody);
    });
    if (importBtn) importBtn.addEventListener("click", () => {
      initImportExport().importState(state, save, renderMain, renderSettingsBody);
    });
    if (codesBtn)  codesBtn.addEventListener("click", () => {
      enterCode(state, save, renderMain, renderSettingsBody);
    });
    if (resetBtn)  resetBtn.addEventListener("click", () => {
      doReset(state, save, renderMain, renderSettingsBody);
    });
  }

  settingsBtn.addEventListener("click", openSettings);
  closeBtn.addEventListener("click", closeSettings);
  modal.addEventListener("click", e => {
    if (e.target === modal) closeSettings();
  });

  // gestion du retour OAuth (auth.js expose cette fonction)
  handleRedirectResult(({ user }) => {
    if (user) {
      state.user = { name: user.displayName || "Utilisateur" };
      save();
      renderMain();
      renderSettingsBody();
    }
  }).catch(err => console.error("Erreur retour OAuth:", err));
}
