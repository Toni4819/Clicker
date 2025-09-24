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

  // CSS minimal injectable pour forcer le centrage et styles des boxes emojis
  const styleId = "settingsModal-styles";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .modal-overlay{
        position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
        background:rgba(0,0,0,0.45); z-index:10000;
      }
      .modal-card{
        width:min(640px, 94%); background:var(--bg, #fff); border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.25);
        overflow:hidden; display:flex; flex-direction:column; max-height:90vh;
      }
      .modal-header{ display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-bottom:1px solid rgba(0,0,0,0.06); }
      .modal-body{ padding:18px; overflow:auto; }
      .modal-footer{ padding:12px 18px; border-top:1px solid rgba(0,0,0,0.06); text-align:right; }

      /* layout des boutons */
      .settings-grid{ display:grid; gap:14px; }
      .center{ display:flex; justify-content:center; align-items:center; }
      .two-col{ display:grid; grid-template-columns:1fr 1fr; gap:12px; }

      /* bouton avec emoji box */
      .emoji-box {
        display:inline-flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px;
        background:linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.01));
        border:1px solid rgba(0,0,0,0.06); min-height:44px; width:100%;
      }
      .emoji-circle{ width:36px; height:36px; border-radius:8px; display:inline-grid; place-items:center; font-size:18px; background:rgba(0,0,0,0.03); border:1px solid rgba(0,0,0,0.04); }

      /* boutons standards */
      .btn { cursor:pointer; border:0; font:inherit; }
      .btn-primary{ background:#0366d6; color:#fff; border-radius:8px; padding:10px 12px; }
      .btn-secondary{ background:#f5f7fa; color: #111; border-radius:8px; padding:10px 12px; }
      .btn-warning{ background:#ffebcc; color:#4a2b00; border-radius:8px; padding:10px 12px; }

      /* responsive small widths */
      @media (max-width:420px){
        .two-col{ grid-template-columns:1fr; }
      }
    `;
    document.head.append(style);
  }

  modal.innerHTML = `
    <div class="modal-card" role="document" aria-label="Paramètres">
      <header class="modal-header">
        <div style="display:flex;gap:10px;align-items:center;">
          <div style="font-size:20px;">⚙️</div>
          <h2 id="settingsTitle" style="margin:0;font-size:16px;">Paramètres</h2>
        </div>
        <button class="close-btn" aria-label="Fermer" title="Fermer" style="background:none;border:none;font-size:18px;cursor:pointer;padding:6px 8px;">✕</button>
      </header>

      <div class="modal-body" id="settingsBody">
        <!-- contenu injecté -->
      </div>

      <footer class="modal-footer">
        <button id="doneBtn" class="btn btn-primary">✓ Terminé</button>
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
    modal.style.display = "flex";
    document.body.classList.add("modal-open");
    // inert minimal
    document.querySelectorAll("body > *:not(#settingsModal)").forEach(el => el.inert = true);
    releaseFocusTrap = trapFocus(modal);
    const firstButton = modal.querySelector("button, [tabindex]:not([tabindex='-1'])");
    if (firstButton) firstButton.focus();
  }

  function closeSettings() {
    modal.setAttribute("aria-hidden", "true");
    modal.style.display = "none";
    document.body.classList.remove("modal-open");
    document.querySelectorAll("body > *:not(#settingsModal)").forEach(el => el.inert = false);
    releaseFocusTrap();
    settingsBtn.focus();
  }

  function renderSettingsBody() {
    body.innerHTML = `
      <div class="settings-grid">
        <div class="center">
          <button id="loginBtn" class="emoji-box" aria-label="Se connecter">
            <span class="emoji-circle">🔐</span>
            <span style="flex:1;text-align:center;font-weight:600;">Se connecter avec Microsoft</span>
          </button>
        </div>

        <div class="two-col">
          <button id="exportBtn" class="emoji-box" aria-label="Exporter">
            <span class="emoji-circle">⬇️</span>
            <span style="flex:1;font-weight:600;">Exporter</span>
          </button>
          <button id="importBtn" class="emoji-box" aria-label="Importer">
            <span class="emoji-circle">⬆️</span>
            <span style="flex:1;font-weight:600;">Importer</span>
          </button>
        </div>

        <div class="center">
          <button id="codesBtn" class="emoji-box" aria-label="Entrer un code">
            <span class="emoji-circle">🎟️</span>
            <span style="flex:1;text-align:center;font-weight:600;">Entrer un code</span>
          </button>
        </div>

        <div style="border-top:1px dashed rgba(0,0,0,0.06);padding-top:10px;">
          <div class="center">
            <button id="resetBtn" class="emoji-box" aria-label="Réinitialiser">
              <span class="emoji-circle">⚠️</span>
              <span style="flex:1;text-align:center;font-weight:600;color:#7a2b00;">Réinitialiser</span>
            </button>
          </div>
        </div>
      </div>
    `;

    const loginBtn  = body.querySelector("#loginBtn");
    const exportBtn = body.querySelector("#exportBtn");
    const importBtn = body.querySelector("#importBtn");
    const codesBtn  = body.querySelector("#codesBtn");
    const resetBtn  = body.querySelector("#resetBtn");

    // Login
    if (loginBtn) {
      loginBtn.addEventListener("click", async () => {
        loginBtn.setAttribute("aria-busy", "true");
        loginBtn.querySelector("span[style*='flex:1']").textContent = "Connexion…";
        try {
          openMicrosoftLogin();
        } catch (err) {
          console.error("Erreur ouverture login :", err);
          loginBtn.removeAttribute("aria-busy");
          loginBtn.querySelector("span[style*='flex:1']").textContent = "Se connecter avec Microsoft";
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

  // Initial hidden state
  modal.style.display = "none";

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
