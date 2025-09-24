// menus/settings.js

import app from "./firebase.js"; // ← récupère l'app initialisée
import {
  getAuth,
  OAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

const auth = getAuth(app);
const provider = new OAuthProvider("microsoft.com");
provider.setCustomParameters({ prompt: "consent", tenant: "common" });

// --- Safe listener ---
function safeListen(el, ev, fn) {
  if (el) {
    el.removeEventListener(ev, fn);
    el.addEventListener(ev, fn);
  }
}

// --- Export principal ---
export function initSettings({ els, state, save, renderMain }) {
  const {
    settingsBtn,
    closeSettingsBtn,
    loginBtn,
    logoutBtn,
    exportBtn,
    importBtn,
    codesBtn,
    resetBtn,
    closeSecondBtn,
    settingsModal,
    settingsModalSecond
  } = els;

  let modal = settingsModal;
  let modalSecond = settingsModalSecond;

  // --- Render contenu du menu ---
  function renderSettingsBody() {
    if (!modal) return;
    const body = modal.querySelector(".modal-body");
    if (!body) return;

    const logged = !!state.user;
    body.innerHTML = `
      <div class="section">
        <h2 id="settingsTitle">Paramètres</h2>
        <div class="grid">
          ${logged
            ? `<button id="logoutBtn" class="item-btn">Se déconnecter</button>`
            : `<button id="loginBtn" class="item-btn">Se connecter avec Microsoft</button>`}
          <button id="exportBtn" class="item-btn">Exporter</button>
          <button id="importBtn" class="item-btn">Importer</button>
          <button id="codesBtn" class="item-btn">Entrer un code</button>
          <button id="resetBtn" class="item-btn">Réinitialiser</button>
        </div>
      </div>
    `;

    // Rebind boutons internes
    const newLoginBtn = body.querySelector("#loginBtn");
    const newLogoutBtn = body.querySelector("#logoutBtn");
    const newExportBtn = body.querySelector("#exportBtn");
    const newImportBtn = body.querySelector("#importBtn");
    const newCodesBtn = body.querySelector("#codesBtn");
    const newResetBtn = body.querySelector("#resetBtn");

    safeListen(newLoginBtn, "click", onLogin);
    safeListen(newLogoutBtn, "click", onLogout);
    safeListen(newExportBtn, "click", onExport);
    safeListen(newImportBtn, "click", onImport);
    safeListen(newCodesBtn, "click", onEnterCode);
    safeListen(newResetBtn, "click", onReset);
  }

  // --- Login via redirect ---
  async function onLogin() {
    const btn = document.querySelector("#loginBtn");
    if (btn) btn.disabled = true;
    try {
      await signInWithRedirect(auth, provider);
    } catch (err) {
      console.error("Erreur OAuth Microsoft:", err);
      alert("Connexion échouée");
      if (btn) btn.disabled = false;
    }
  }

  // --- Logout ---
  async function onLogout() {
    try {
      await signOut(auth);
      state.user = null;
      save();
      renderMain();
      renderSettingsBody();
    } catch (err) {
      console.error("Erreur de déconnexion:", err);
    }
  }

  // --- Export ---
  function onExport() {
    const data = JSON.stringify(state);
    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "clicker-save.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // --- Import ---
  function onImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      Object.assign(state, JSON.parse(text));
      save();
      renderMain();
      renderSettingsBody();
    };
    input.click();
  }

  // --- Code secret ---
  function onEnterCode() {
    if (!modalSecond) return;
    const secondBody = modalSecond.querySelector(".modal-body");
    secondBody.innerHTML = `
      <div class="section">
        <div style="text-align:center;margin-bottom:8px">Entrez votre code</div>
        <div style="display:flex;gap:8px;justify-content:center">
          <input id="codeInput" type="text" placeholder="Code" class="styled-input" />
          <button id="applyCodeBtn" class="item-btn">Appliquer</button>
        </div>
      </div>
    `;
    openModal(modalSecond);

    const applyBtn = secondBody.querySelector("#applyCodeBtn");
    safeListen(applyBtn, "click", () => {
      const code = secondBody.querySelector("#codeInput").value.trim().toUpperCase();
      if (code === "400UPDATES!!!") {
        state.points = (state.points || 0) + 1_000_000_000;
        save();
        renderMain();
        alert("+1 000 000 000 points");
      } else {
        alert("Code invalide");
      }
      closeModal(modalSecond);
    });
  }

  // --- Reset ---
  function onReset() {
    if (confirm("Réinitialiser la partie ?")) {
      for (const k of Object.keys(state)) delete state[k];
      save();
      renderMain();
      renderSettingsBody();
    }
  }

  // --- Listeners globaux ---
  safeListen(settingsBtn, "click", () => {
    renderSettingsBody();
    openModal(modal);
  });
  safeListen(closeSettingsBtn, "click", () => closeModal(modal));
  safeListen(closeSecondBtn, "click", () => closeModal(modalSecond));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (modalSecond?.getAttribute("aria-hidden") === "false") closeModal(modalSecond);
      else if (modal?.getAttribute("aria-hidden") === "false") closeModal(modal);
    }
  });

  renderSettingsBody();
}

// --- Gérer le retour de Microsoft après redirection ---
getRedirectResult(auth)
  .then((result) => {
    if (result && result.user) {
      console.log("Utilisateur connecté:", result.user.displayName);
      // Ici tu peux mettre à jour state/save/renderMain si besoin
    }
  })
  .catch((err) => console.error("Erreur retour OAuth:", err));
