// firebase.js
import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyBVZKPSVzpkNehiJlnrNErrEvXwWnK8TtY",
  authDomain: "tonisstudios.firebaseapp.com",
  projectId: "tonisstudios",
  storageBucket: "tonisstudios.firebasestorage.app",
  messagingSenderId: "769862192373",
  appId: "1:769862192373:web:7526cf19a81385532cc9bc"
};

// Initialise seulement si aucune app n’existe
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export default app;
