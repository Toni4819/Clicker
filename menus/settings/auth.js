import app from "../firebase.js";
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

let currentUser = null;

// 🏗️ Injection du bouton + modal secondaire
function injectAuthUI() {
  const container = document.createElement("div");
  container.innerHTML = `
    <button id="accountButton" class="btn btn-shop">Se connecter avec Microsoft</button>

    <div class="modal modal-second" id="accountModal" hidden>
      <div class="modal-content" role="document" style="max-width:400px; margin:0 auto;">
        <h2>Compte</h2>
        <div style="display:flex; flex-direction:column; gap:12px; margin-top:16px;">
          <button id="saveBtn" class="btn btn-secondary">Sauvegarder</button>
          <button id="loadBtn" class="btn btn-secondary">Charger</button>
          <button id="logoutBtn" class="btn danger">Se déconnecter</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(container);
}

// 🔐 Connexion Microsoft
export function openMicrosoftLogin() {
  signInWithRedirect(auth, provider).catch(err => {
    console.error("Erreur OAuth Microsoft:", err);
    alert("Connexion échouée");
  });
}

// 🔄 Résultat du redirect
export function handleRedirectResult(callback) {
  return getRedirectResult(auth).then(result => {
    if (result && result.user) {
      currentUser = result.user;
      const btn = document.getElementById("accountButton");
      if (btn) btn.textContent = "Compte";
      if (callback) callback({ user: result.user });
    }
    return result;
  });
}

// 🚪 Déconnexion
export async function appSignOut() {
  try {
    await signOut(auth);
    currentUser = null;
    const btn = document.getElementById("accountButton");
    if (btn) btn.textContent = "Se connecter avec Microsoft";
    const modal = document.getElementById("accountModal");
    if (modal) modal.hidden = true;
  } catch (err) {
    console.error("Erreur de déconnexion:", err);
    alert("Échec de la déconnexion");
  }
}

// 🧩 Initialisation complète
export function initAuthUI({ save, renderMain }) {
  injectAuthUI();
  handleRedirectResult();

  const accountButton = document.getElementById("accountButton");
  const accountModal = document.getElementById("accountModal");
  const saveBtn = document.getElementById("saveBtn");
  const loadBtn = document.getElementById("loadBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  accountButton.addEventListener("click", () => {
    if (currentUser) {
      accountModal.hidden = false;
    } else {
      openMicrosoftLogin();
    }
  });

  saveBtn.addEventListener("click", () => {
    if (typeof save === "function") save();
    alert("Sauvegarde effectuée !");
    accountModal.hidden = true;
  });

  loadBtn.addEventListener("click", () => {
    if (typeof renderMain === "function") renderMain();
    alert("Chargement effectué !");
    accountModal.hidden = true;
  });

  logoutBtn.addEventListener("click", () => {
    appSignOut();
  });

  // Fermer le modal si clic en dehors
  accountModal.addEventListener("click", e => {
    if (e.target === accountModal) accountModal.hidden = true;
  });
}

// 🔓 Expose globalement
window.__appSignOut = appSignOut;
