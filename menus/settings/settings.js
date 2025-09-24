import { initAuthUI, handleRedirectResult, openMicrosoftLogin } from "./auth.js";
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

  // Utilise les classes existantes dans style.css : .modal-content, .modal-header, .modal-body, .modal-footer
  modal.innerHTML = `
    <div class="modal-content" role="document" aria-label="Paramètres">
      <header class="modal-header">
        <div style="display:flex;gap:10px;align-items:center;">
          <div style="font-size:20px;">⚙️</div>
          <h2 id="settingsTitle" style="margin:0;">Paramètres</h2>
        </div>
        <button class="close-btn" aria-label="Fermer" title="Fermer">✕</button>
      </header>

      <div class="modal-body" id="settingsBody">
        <!-- contenu injecté -->
      </div>

    </div>
  `;

  const body     = modal.querySelector("#settingsBody");
  const closeBtn = modal.querySelector(".close-btn");

  // Focus trap minimal
  function trapFocus(container) {
    const focusable = Array.from(container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter(el => !el.disabled && el.offsetParent !== null);
    if (!focusable.length) return () => {};
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    function onKey(e) {
      if (e.key === "Tab") {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      } else if (e.key === "Escape") {
        closeSettings();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }

  let releaseFocusTrap = () => {};

  function openSettings() {
    renderSettingsBody();
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    // inert minimal
    document.querySelectorAll("body > *:not(#settingsModal)").forEach(el => el.inert = true);
    releaseFocusTrap = trapFocus(modal);
    const firstButton = modal.querySelector("button, [tabindex]:not([tabindex='-1'])");
    if (firstButton) firstButton.focus();
  }

  function closeSettings() {
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    document.querySelectorAll("body > *:not(#settingsModal)").forEach(el => el.inert = false);
    releaseFocusTrap();
    settingsBtn.focus();
  }

  function renderSettingsBody() {
    // Structure alignée sur style.css : sections, actions-grid, boutons .btn-*
    body.innerHTML = `
      <div class="section" style="text-align:center;">
        <button id="loginBtn" class="btn btn-shop" aria-label="Se connecter avec Microsoft">
          <span style="margin-right:10px">🔐</span> Se connecter avec Microsoft
        </button>
      </div>

      <div class="section" style="display:flex;justify-content:center;">
        <div style="width:100%;max-width:520px;display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:center;">
          <button id="exportBtn" class="btn btn-secondary" aria-label="Exporter">
            <span style="display:inline-block;width:26px;text-align:center;margin-right:8px;">⬇️</span> Exporter
          </button>
          <button id="importBtn" class="btn btn-secondary" aria-label="Importer">
            <span style="display:inline-block;width:26px;text-align:center;margin-right:8px;">⬆️</span> Importer
          </button>
        </div>
      </div>

      <div class="section" style="text-align:center;">
        <button id="codesBtn" class="btn btn-primary" aria-label="Entrer un code">
          <span style="margin-right:10px">🎟️</span> Entrer un code
        </button>
      </div>

      <div class="section" style="text-align:center;">
        <button id="resetBtn" class="btn btn-warning" aria-label="Réinitialiser">
          <span style="margin-right:10px">⚠️</span> Réinitialiser
        </button>
      </div>
    `;

    const loginBtn  = body.querySelector("#loginBtn");
    const exportBtn = body.querySelector("#exportBtn");
    const importBtn = body.querySelector("#importBtn");
    const codesBtn  = body.querySelector("#codesBtn");
    const resetBtn  = body.querySelector("#resetBtn");

    if (loginBtn) {
      loginBtn.addEventListener("click", () => {
        loginBtn.disabled = true;
        const original = loginBtn.textContent;
        loginBtn.textContent = "Connexion...";
        try {
          openMicrosoftLogin();
        } catch (err) {
          console.error("Erreur ouverture login :", err);
          loginBtn.disabled = false;
          loginBtn.textContent = original;
        }
      });
    }

    if (exportBtn) exportBtn.addEventListener("click", () => {
      try {
        const ie = initImportExport();
        ie.exportState(state);
      } catch (err) {
        console.error("Erreur export :", err);
      }
    });

    if (importBtn) importBtn.addEventListener("click", () => {
      try {
        const ie = initImportExport();
        ie.importState(state, save, renderMain, renderSettingsBody);
      } catch (err) {
        console.error("Erreur import :", err);
      }
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

  // Ensure initial hidden state follows style.css expectation
  modal.setAttribute("aria-hidden", "true");

  // Close with Esc globally
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && modal.getAttribute("aria-hidden") === "false") closeSettings();
  });

  // Initialise l'UI auth secondaire et gère le retour OAuth
  initAuthUI({ save, renderMain });

  handleRedirectResult(({ user }) => {
    if (user) {
      state.user = { name: user.displayName || "Utilisateur" };
      save();
      renderMain();
    }
  }).catch(err => console.error("Erreur retour OAuth:", err));
}
