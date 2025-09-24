// menus/settings/settings.js
import { openMicrosoftLogin, handleRedirectResult } from "./auth.js";
import { initImportExport } from "./import-export.js";
import { enterCode } from "./codes.js";
import { doReset } from "./reset.js";

/*
  settings.js
  - Utilise les mêmes classes et l'approche visuelle que l'index (pas d'inversion, pas d'ombres ajoutées).
  - Centre les boutons à l'intérieur de la modal.
  - Délègue l'auth, import/export, codes et reset aux modules correspondants.
*/

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
    // set focus for accessibility
    const firstButton = modal.querySelector("button");
    if (firstButton) firstButton.focus();
  }
  function closeSettings() {
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    settingsBtn.focus();
  }

  // Rendu du contenu en respectant l'ordre et les classes utilisées par l'index
  function renderSettingsBody() {
    const logged = !!state.user;

    // On centre les boutons avec text-align:center; on n'ajoute aucune ombre ni inversion de couleur
    body.innerHTML = `
      <div class="section" style="text-align:center; margin-bottom:12px;">
        ${logged
          ? `<button id="logoutBtn" class="btn btn-shop">Se déconnecter</button>`
          : `<button id="loginBtn" class="btn btn-shop">Se connecter avec Microsoft</button>`}
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

    // Rebind boutons internes
    const loginBtn  = body.querySelector("#loginBtn");
    const logoutBtn = body.querySelector("#logoutBtn");
    const exportBtn = body.querySelector("#exportBtn");
    const importBtn = body.querySelector("#importBtn");
    const codesBtn  = body.querySelector("#codesBtn");
    const resetBtn  = body.querySelector("#resetBtn");

    if (loginBtn)  loginBtn.addEventListener("click", () => {
      // désactive le bouton pour éviter double-clic
      loginBtn.disabled = true;
      openMicrosoftLogin();
    });

    if (logoutBtn) logoutBtn.addEventListener("click", async () => {
      try {
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
      const ie = initImportExport();
      ie.exportState(state);
    });

    if (importBtn) importBtn.addEventListener("click", () => {
      const ie = initImportExport();
      ie.importState(state, save, renderMain, renderSettingsBody);
    });

    if (codesBtn)  codesBtn.addEventListener("click", () => {
      enterCode(state, save, renderMain, renderSettingsBody);
    });

    if (resetBtn)  resetBtn.addEventListener("click", () => {
      doReset(state, save, renderMain, renderSettingsBody);
    });
  }

  // Liens ouverture / fermeture
  settingsBtn.addEventListener("click", openSettings);
  closeBtn.addEventListener("click", closeSettings);
  modal.addEventListener("click", e => {
    if (e.target === modal) closeSettings();
  });

  // Gestion du retour OAuth via auth.js
  handleRedirectResult(({ user }) => {
    if (user) {
      state.user = { name: user.displayName || "Utilisateur" };
      save();
      renderMain();
      renderSettingsBody();
    }
  }).catch(err => console.error("Erreur retour OAuth:", err));
}
