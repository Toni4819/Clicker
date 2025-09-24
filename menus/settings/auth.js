// menus/settings/auth.js
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

// Expose a function pour lancer la connexion
export function openMicrosoftLogin() {
  signInWithRedirect(auth, provider).catch(err => {
    console.error("Erreur OAuth Microsoft:", err);
    alert("Connexion échouée");
  });
}

// Permet de gérer le résultat du redirect depuis le module settings
export function handleRedirectResult(callback) {
  return getRedirectResult(auth).then(result => {
    if (result && result.user) {
      callback({ user: result.user });
    }
    return result;
  });
}

// Fournir une fonction de déconnexion globalement utilisable
export async function appSignOut() {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("Erreur de deconnexion:", err);
    throw err;
  }
}

// rendre disponible pour le code qui délègue la déconnexion
window.__appSignOut = appSignOut;
