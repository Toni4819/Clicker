import { initializeApp } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-app.js";
import { getAuth, OAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.3.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "TON_API_KEY",
  authDomain: "tonisstudios.firebaseapp.com",
  projectId: "tonisstudios",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new OAuthProvider('microsoft.com');

provider.setCustomParameters({
  prompt: 'consent',
  tenant: 'common'
});

export function loginWithMicrosoft() {
  return signInWithPopup(auth, provider);
}
