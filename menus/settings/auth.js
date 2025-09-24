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

// 🏗️ Injection du HTML directement depuis auth.js
function injectAuthUI() {
  const container = document.createElement("div");
  container.innerHTML = `
    <button id="accountButton">Se connecter avec Microsoft</button>

    <div class="modal modal-second" id="accountModal" hidden>
      <div class="modal-content">
        <h2>Compte</h2>
        <button id="saveButton">Sauvegarder</button>
        <button id="loadButton">Charger</button>
        <button id="logoutButton" class="danger">Se déconnecter</button>
      </div>
    </div>
  `;
  document.body.appendChild(container);
}

// 🔐 Connexion Microsoft
function openMicrosoftLogin() {
  signInWithRedirect(auth, provider).catch(err => {
    console.error("Erreur OAuth Microsoft:", err);
    alert("Connexion échouée");
  });
}

// 🔄 Résultat du redirect
function handleRedirectResult() {
  getRedirectResult(auth).then(result => {
    if (result && result.user) {
      currentUser = result.user;
      document.getElementById("accountButton").textContent = "Compte";
    }
  });
}

// 🚪 Déconnexion
async function appSignOut() {
  try {
    await signOut(auth);
    currentUser = null;
    document.getElementById("accountButton").textContent =
      "Se connecter avec Microsoft";
    document.getElementById("accountModal").hidden = true;
  } catch (err) {
    console.error("Erreur de déconnexion:", err);
    alert("Échec de la déconnexion");
  }
}

// 🧩 Initialisation complète
export function initAuthUI() {
  injectAuthUI();
  handleRedirectResult();

  const accountButton = document.getElementById("accountButton");
  const accountModal = document.getElementById("accountModal");
  const saveButton = document.getElementById("saveButton");
  const loadButton = document.getElementById("loadButton");
  const logoutButton = document.getElementById("logoutButton");

  accountButton.addEventListener("click", () => {
    if (currentUser) {
      accountModal.hidden = false;
    } else {
      openMicrosoftLogin();
    }
  });

  saveButton.addEventListener("click", () => {
    alert("Sauvegarde effectuée !");
    accountModal.hidden = true;
  });

  loadButton.addEventListener("click", () => {
    alert("Chargement effectué !");
    accountModal.hidden = true;
  });

  logoutButton.addEventListener("click", () => {
    appSignOut();
  });
}

// 🔓 Expose globalement si besoin
window.__appSignOut = appSignOut;
