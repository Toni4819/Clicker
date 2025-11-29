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

const auth = getAuth(app);
const provider = new OAuthProvider("microsoft.com");
provider.setCustomParameters({ prompt: "consent", tenant: "common" });

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

// Attendre qu'un élément existe dans le DOM (retourne la référence ou null)
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

    // fallback timeout
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
    // flag pour indiquer qu'on part en redirect
    sessionStorage.setItem(REDIRECT_FLAG, "1");
    return signInWithRedirect(auth, provider).catch(err => {
      sessionStorage.removeItem(REDIRECT_FLAG);
      console.error("Erreur OAuth Microsoft (signInWithRedirect):", err);
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
    // getRedirectResult peut retourner null si pas de redirect en cours
    if (result && result.user) {
      currentUser = result.user;
      updateLoginBtnForUser(result.user);
      sessionStorage.removeItem(REDIRECT_FLAG);
      if (typeof callback === "function") callback({ user: result.user, result });
    } else {
      // Pas de résultat de redirect, on laisse onAuthStateChanged gérer l'UI
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
  // Injecte le modal-second une seule fois
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

    // Bind boutons du modal
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

  // Clic sur le bouton principal
  document.addEventListener("click", e => {
    if (e.target && e.target.id === "loginBtn") {
      if (currentUser) {
        const modal = document.getElementById("accountModal");
        if (modal) modal.hidden = false;
      } else {
        // si pas connecté, lancer le flow
        openMicrosoftLogin();
      }
    }
  });
}

// -----------------------------
// Synchronisation de l'UI au démarrage
// -----------------------------
function initAuthListeners() {
  // onAuthStateChanged met à jour l'UI dès que Firebase connaît l'utilisateur
  onAuthStateChanged(auth, user => {
    currentUser = user || null;
    updateLoginBtnForUser(user);
  });

  // Si on revient d'un redirect, on veut afficher un état "pending" tant que getRedirectResult n'a pas répondu
  if (sessionStorage.getItem(REDIRECT_FLAG)) {
    // Si le bouton n'existe pas encore, on attend un peu
    waitForElement("loginBtn", 5000).then(btn => {
      if (btn) setLoginBtnPending();
      // Tenter de récupérer le résultat du redirect
      handleRedirectResult().catch(err => {
        console.error("Erreur handleRedirectResult (init):", err);
      });
    });
  } else {
    // Pas de redirect en cours : on s'assure que le bouton est à jour au chargement
    waitForElement("loginBtn", 3000).then(btn => {
      updateLoginBtnForUser(currentUser);
    });
  }
}

// -----------------------------
// Initialisation automatique (à appeler depuis ton script principal)
// -----------------------------
export function startAuth({ save, renderMain } = {}) {
  initAuthUI({ save, renderMain });
  initAuthListeners();
  // Expose globalement la déconnexion si besoin
  window.__appSignOut = appSignOut;
}

// -----------------------------
// Exports utiles
// -----------------------------
export { currentUser };
