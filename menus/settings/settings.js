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
    modal.className = "modal-overlay";
    modal.setAttribute("aria-hidden", "true");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "settingsTitle");
    document.body.append(modal);
    els.settingsModal = modal;
  }

  modal.innerHTML = `
    <div class="modal-card" role="document" style="max-width:640px; width:92%; margin:48px auto; border-radius:10px; overflow:hidden;">
      <header class="modal-header" style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:var(--surface-2);">
        <div style="display:flex;gap:12px;align-items:center;">
          <span style="font-size:20px;">⚙️</span>
          <h2 id="settingsTitle" style="margin:0;font-size:18px;">Paramètres</h2>
        </div>
        <button class="close-btn" aria-label="Fermer" title="Fermer" style="background:none;border:none;font-size:18px;cursor:pointer;padding:6px 8px;">✕</button>
      </header>

      <div class="modal-body" id="settingsBody" style="padding:20px;background:var(--surface-1);">
        <!-- contenu injecté -->
      </div>

      <footer class="modal-footer" style="padding:12px 20px;background:var(--surface-2);text-align:right;">
        <button id="doneBtn" class="btn btn-primary" style="padding:8px 14px;">✓ Terminé</button>
      </footer>
    </div>
  `;

  const body     = modal.querySelector("#settingsBody");
  const closeBtn = modal.querySelector(".close-btn");
  const doneBtn  = modal.querySelector("#doneBtn");

  // Focus trap minimal (single-loop)
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
    // set inert for background if supported
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
    body.innerHTML = `
      <section class="group" style="display:grid;grid-template-columns:1fr;gap:14px;">
        <div style="display:flex;gap:12px;align-items:center;justify-content:center;">
          <button id="loginBtn" class="btn btn-shop" style="display:flex;align-items:center;gap:10px;padding:10px 14px;">
            <span style="font-size:18px;">🔐</span>
            <span>Se connecter avec Microsoft</span>
          </button>
        </div>

        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
          <button id="exportBtn" class="btn btn-secondary" style="display:flex;align-items:center;gap:8px;padding:10px;">
            <span>⬇️</span>
            <span>Exporter</span>
          </button>
          <button id="importBtn" class="btn btn-secondary" style="display:flex;align-items:center;gap:8px;padding:10px;">
            <span>⬆️</span>
            <span>Importer</span>
          </button>
        </div>

        <div style="display:flex;gap:12px;align-items:center;justify-content:center;">
          <button id="codesBtn" class="btn btn-primary" style="display:flex;align-items:center;gap:10px;padding:10px 14px;">
            <span>🎟️</span>
            <span>Entrer un code</span>
          </button>
        </div>

        <div style="margin-top:6px;border-top:1px dashed var(--muted);padding-top:12px;display:flex;justify-content:center;">
          <button id="resetBtn" class="btn btn-warning" style="display:flex;align-items:center;gap:10px;padding:10px 14px;">
            <span>⚠️</span>
            <span>Réinitialiser</span>
          </button>
        </div>
      </section>
    `;

    const loginBtn  = body.querySelector("#loginBtn");
    const exportBtn = body.querySelector("#exportBtn");
    const importBtn = body.querySelector("#importBtn");
    const codesBtn  = body.querySelector("#codesBtn");
    const resetBtn  = body.querySelector("#resetBtn");

    // Login
    if (loginBtn) {
      loginBtn.addEventListener("click", async () => {
        loginBtn.disabled = true;
        const label = loginBtn.querySelector("span:nth-child(2)");
        if (label) label.textContent = "Connexion…";
        try {
          openMicrosoftLogin();
        } catch (err) {
          console.error("Erreur ouverture login :", err);
          loginBtn.disabled = false;
          if (label) label.textContent = "Se connecter avec Microsoft";
        }
      });
    }

    // Export
    if (exportBtn) exportBtn.addEventListener("click", () => {
      try {
        const ie = initImportExport();
        ie.exportState(state);
      } catch (err) {
        console.error("Erreur export :", err);
      }
    });

    // Import
    if (importBtn) importBtn.addEventListener("click", () => {
      try {
        const ie = initImportExport();
        ie.importState(state, save, renderMain, renderSettingsBody);
      } catch (err) {
        console.error("Erreur import :", err);
      }
    });

    // Codes
    if (codesBtn) codesBtn.addEventListener("click", () => {
      enterCode(state, save, renderMain, renderSettingsBody);
    });

    // Reset
    if (resetBtn) resetBtn.addEventListener("click", () => {
      doReset(state, save, renderMain, renderSettingsBody);
    });
  }

  settingsBtn.addEventListener("click", openSettings);
  closeBtn.addEventListener("click", closeSettings);
  doneBtn.addEventListener("click", closeSettings);
  modal.addEventListener("click", e => {
    if (e.target === modal) closeSettings();
  });

  // Close with Esc globally (safety)
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && modal.getAttribute("aria-hidden") === "false") closeSettings();
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
