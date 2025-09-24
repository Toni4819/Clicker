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

// --- Export principal ---
export function initSettings({ els, state, save, renderMain }) {
  const settingsBtn = els.settingsBtn;
  if (!settingsBtn) {
    console.error("initSettings : #settingsBtn introuvable");
    return;
  }

  // --- Création / récupération de la modale ---
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
    <div class="modal-content">
      <header class="modal-header">
        <h2 id="settingsTitle">⚙️ Paramètres</h2>
        <button class="close-btn" aria-label="Fermer">✕</button>
      </header>
      <div class="modal-body" id="settingsBody"></div>
    </div>
  `;

  const body     = modal.querySelector("#settingsBody");
  const closeBtn = modal.querySelector(".close-btn");

  // --- Fonctions ouverture / fermeture ---
  function openSettings() {
    renderSettingsBody();
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }
  function closeSettings() {
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  // --- Rendu du contenu ---
  function renderSettingsBody() {
    const logged = !!state.user;
    body.innerHTML = `
      <div class="section">
        ${logged
          ? `<button id="logoutBtn" class="item-btn">Se déconnecter</button>`
          : `<button id="loginBtn" class="item-btn">Se connecter avec Microsoft</button>`}
        <button id="exportBtn" class="item-btn">Exporter</button>
        <button id="importBtn" class="item-btn">Importer</button>
        <button id="codesBtn" class="item-btn">Entrer un code</button>
        <button id="resetBtn" class="item-btn">Réinitialiser</button>
      </div>
    `;

    // Rebind boutons internes
    const loginBtn  = body.querySelector("#loginBtn");
    const logoutBtn = body.querySelector("#logoutBtn");
    const exportBtn = body.querySelector("#exportBtn");
    const importBtn = body.querySelector("#importBtn");
    const codesBtn  = body.querySelector("#codesBtn");
    const resetBtn  = body.querySelector("#resetBtn");

    if (loginBtn)  loginBtn.addEventListener("click", onLogin);
    if (logoutBtn) logoutBtn.addEventListener("click", onLogout);
    if (exportBtn) exportBtn.addEventListener("click", onExport);
    if (importBtn) importBtn.addEventListener("click", onImport);
    if (codesBtn)  codesBtn.addEventListener("click", onEnterCode);
    if (resetBtn)  resetBtn.addEventListener("click", onReset);
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
    const code = prompt("Entrez votre code :");
    if (!code) return;
    if (code.trim().toUpperCase() === "400UPDATES!!!") {
      state.points = (state.points || 0) + 1_000_000_000;
      save();
      renderMain();
      alert("+1 000 000 000 points");
    } else {
      alert("Code invalide");
    }
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

  // --- Liens d’ouverture / fermeture ---
  settingsBtn.addEventListener("click", openSettings);
  closeBtn.addEventListener("click", closeSettings);
  modal.addEventListener("click", e => {
    if (e.target === modal) closeSettings();
  });

  // --- Gestion du retour OAuth ---
  getRedirectResult(auth)
    .then((result) => {
      if (result && result.user) {
        state.user = { name: result.user.displayName || "Utilisateur" };
        save();
        renderMain();
        renderSettingsBody();
      }
    })
    .catch((err) => console.error("Erreur retour OAuth:", err));
}
