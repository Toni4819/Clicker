// auth.js
import app from "../firebase.js";
import {
  getAuth,
  OAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

// -----------------------------
// Initialisation Auth
// -----------------------------
const auth = getAuth(app);
const provider = new OAuthProvider("microsoft.com");
provider.setCustomParameters({ prompt: "select_account" });

let currentUser = null;
const REDIRECT_FLAG = "authRedirecting";

// -----------------------------
// Utilitaires UI
// -----------------------------
function getLoginBtn() {
  return document.getElementById("loginBtn");
}

function updateLoginBtnForUser(user) {
  const btn = getLoginBtn();
  if (!btn) return;
  if (user) {
    btn.textContent = "Compte";
    btn.disabled = false;
  } else {
    btn.textContent = "Se connecter avec Microsoft";
    btn.disabled = false;
  }
}

function setLoginBtnPending() {
  const btn = getLoginBtn();
  if (!btn) return;
  btn.textContent = "Connexion en cours…";
  btn.disabled = true;
}

function waitForElement(id, timeout = 3000) {
  return new Promise(resolve => {
    const el = document.getElementById(id);
    if (el) return resolve(el);

    const observer = new MutationObserver(() => {
      const found = document.getElementById(id);
      if (found) {
        observer.disconnect();
        resolve(found);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      resolve(document.getElementById(id));
    }, timeout);
  });
}

// -----------------------------
// Connexion / Déconnexion
// -----------------------------
export function openMicrosoftLogin() {
  try {
    sessionStorage.setItem(REDIRECT_FLAG, "1");
    return signInWithRedirect(auth, provider).catch(err => {
      sessionStorage.removeItem(REDIRECT_FLAG);
      console.error("Erreur OAuth Microsoft:", err);
      alert("Connexion échouée");
    });
  } catch (err) {
    sessionStorage.removeItem(REDIRECT_FLAG);
    console.error("Erreur openMicrosoftLogin:", err);
    alert("Connexion échouée");
  }
}

export async function appSignOut() {
  try {
    await signOut(auth);
    currentUser = null;
    updateLoginBtnForUser(null);
    const modal = document.getElementById("accountModal");
    if (modal) modal.hidden = true;
  } catch (err) {
    console.error("Erreur de déconnexion:", err);
    alert("Échec de la déconnexion");
  }
}

// -----------------------------
// Gestion du redirect result
// -----------------------------
export async function handleRedirectResult(callback) {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      currentUser = result.user;
      updateLoginBtnForUser(result.user);
      sessionStorage.removeItem(REDIRECT_FLAG);
      if (typeof callback === "function") callback({ user: result.user, result });
    } else {
      // Pas de résultat, mais onAuthStateChanged prendra le relais
      sessionStorage.removeItem(REDIRECT_FLAG);
    }
    return result;
  } catch (err) {
    sessionStorage.removeItem(REDIRECT_FLAG);
    console.error("Erreur getRedirectResult:", err);
    return null;
  }
}

// -----------------------------
// Initialisation UI et modal
// -----------------------------
export function initAuthUI({ save, renderMain } = {}) {
  if (!document.getElementById("accountModal")) {
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

    modal.querySelector("#saveBtn").addEventListener("click", () => {
      if (typeof save === "function") save();
      alert("Sauvegarde effectuée !");
      modal.hidden = true;
    });

    modal.querySelector("#loadBtn").addEventListener("click", () => {
      if (typeof renderMain === "function") renderMain();
      alert("Chargement effectué !");
      modal.hidden = true;
    });

    modal.querySelector("#logoutBtn").addEventListener("click", () => {
      appSignOut();
    });

    modal.addEventListener("click", e => {
      if (e.target === modal) modal.hidden = true;
    });
  }

  document.addEventListener("click", e => {
    if (e.target && e.target.id === "loginBtn") {
      if (currentUser) {
        const modal = document.getElementById("accountModal");
        if (modal) modal.hidden = false;
      } else {
        openMicrosoftLogin();
      }
    }
  });
}

// -----------------------------
// Synchronisation de l'UI
// -----------------------------
function initAuthListeners() {
  // Toujours écouter l'état utilisateur
  onAuthStateChanged(auth, user => {
    currentUser = user || null;
    updateLoginBtnForUser(user);

    if (sessionStorage.getItem(REDIRECT_FLAG) && user) {
      sessionStorage.removeItem(REDIRECT_FLAG);
    }
  });

  // Si on revient d’un redirect, afficher "Connexion en cours…" puis traiter le résultat
  if (sessionStorage.getItem(REDIRECT_FLAG)) {
    waitForElement("loginBtn", 5000).then(btn => {
      if (btn) setLoginBtnPending();
      handleRedirectResult().catch(err => {
        console.error("Erreur handleRedirectResult (init):", err);
      });
    });
  } else {
    waitForElement("loginBtn", 3000).then(btn => {
      updateLoginBtnForUser(currentUser);
    });
  }
}

// -----------------------------
// Initialisation automatique
// -----------------------------
export function startAuth({ save, renderMain } = {}) {
  initAuthUI({ save, renderMain });
  initAuthListeners();
  window.__appSignOut = appSignOut;
}

// -----------------------------
// Exports utiles
// -----------------------------
export { currentUser };
