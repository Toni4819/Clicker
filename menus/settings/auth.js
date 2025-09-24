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
  return signInWithRedirect(auth, provider).catch(err => {
    console.error("Erreur OAuth Microsoft:", err);
    alert("Connexion échouée");
  });
}

// 🔄 Résultat du redirect
export function handleRedirectResult(callback) {
  return getRedirectResult(auth).then(result => {
    if (result && result.user) {
      currentUser = result.user;

      // 🔁 Attendre que le bouton soit dans le DOM
      const updateButton = () => {
        const btn = document.getElementById("loginBtn");
        if (btn) {
          btn.textContent = "Compte";
          btn.disabled = false;
          return true;
        }
        return false;
      };

      if (!updateButton()) {
        const observer = new MutationObserver(() => {
          if (updateButton()) observer.disconnect();
        });
        observer.observe(document.body, { childList: true, subtree: true });
      }

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

// 🧩 Injection et gestion du modal-second
export function initAuthUI({ save, renderMain }) {
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

  // Gestion du bouton principal (dans settings.js)
  document.addEventListener("click", e => {
    if (e.target && e.target.id === "loginBtn" && currentUser) {
      const modal = document.getElementById("accountModal");
      if (modal) modal.hidden = false;
    }
  });
}

// 🔓 Expose globalement
window.__appSignOut = appSignOut;
