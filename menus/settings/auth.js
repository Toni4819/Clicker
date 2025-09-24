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
      const btn = document.getElementById("loginBtn");
      if (btn) btn.textContent = "Compte";   // 🔧 mise à jour du texte
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
    const btn = document.getElementById("loginBtn");
    if (btn) btn.textContent = "Se connecter avec Microsoft";
    const modal = document.getElementById("accountModal");
    if (modal) modal.hidden = true;
  } catch (err) {
    console.error("Erreur de déconnexion:", err);
    alert("Échec de la déconnexion");
  }
}

// 🧩 Injecte le modal-second (mais pas le bouton principal)
export function initAccountModal({ save, renderMain }) {
  const modal = document.createElement("div");
  modal.className = "modal modal-second";
  modal.id = "accountModal";
  modal.hidden = true;
  modal.innerHTML = `
    <div class="modal-content" role="document" style="max-width:400px; margin:0 auto;">
      <h2>Compte</h2>
      <div style="display:flex; flex-direction:column; gap:12px; margin-top:16px;">
        <button id="saveBtn" class="btn btn-secondary">Sauvegarder</button>
        <button id="loadBtn" class="btn btn-secondary">Charger</button>
        <button id="logoutBtn" class="btn danger">Se déconnecter</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const saveBtn = modal.querySelector("#saveBtn");
  const loadBtn = modal.querySelector("#loadBtn");
  const logoutBtn = modal.querySelector("#logoutBtn");

  saveBtn.addEventListener("click", () => {
    if (typeof save === "function") save();
    alert("Sauvegarde effectuée !");
    modal.hidden = true;
  });

  loadBtn.addEventListener("click", () => {
    if (typeof renderMain === "function") renderMain();
    alert("Chargement effectué !");
    modal.hidden = true;
  });

  logoutBtn.addEventListener("click", () => {
    appSignOut();
  });

  modal.addEventListener("click", e => {
    if (e.target === modal) modal.hidden = true;
  });
}

// 🔓 Expose globalement
window.__appSignOut = appSignOut;
