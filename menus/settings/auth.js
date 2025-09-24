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

// Connexion Microsoft
export function openMicrosoftLogin() {
  signInWithRedirect(auth, provider).catch(err => {
    console.error("Erreur OAuth Microsoft:", err);
    alert("Connexion échouée");
  });
}

// Résultat du redirect
export function handleRedirectResult(callback) {
  return getRedirectResult(auth).then(result => {
    if (result && result.user) {
      currentUser = result.user;
      // 🔧 Met à jour le bouton si présent
      const btn = document.getElementById("loginBtn");
      if (btn) {
        btn.textContent = "Compte";
        btn.disabled = false;
      }
      if (callback) callback({ user: result.user });
    }
    return result;
  });
}

// Déconnexion
export async function appSignOut() {
  try {
    await signOut(auth);
    currentUser = null;
    const btn = document.getElementById("loginBtn") || document.getElementById("logoutBtn");
    if (btn) btn.textContent = "Se connecter avec Microsoft";
  } catch (err) {
    console.error("Erreur de déconnexion:", err);
    alert("Échec de la déconnexion");
  }
}

// Expose globalement
window.__appSignOut = appSignOut;
