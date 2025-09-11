// 🔥 Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";

// ✅ Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBRavjkGz8F_mM3WZ2cmYzOzudzT0sAiwE",
  authDomain: "clicker-cloud-92001.firebaseapp.com",
  projectId: "clicker-cloud-92001",
  storageBucket: "clicker-cloud-92001.firebasestorage.app",
  messagingSenderId: "394775732759",
  appId: "1:394775732759:web:1ea325bb0b186489427252",
  measurementId: "G-QELQ4GJ8F6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🌐 Discord OAuth2
const discordAuthURL = "https://discord.com/oauth2/authorize?client_id=1415716108031361185&response_type=token&redirect_uri=https%3A%2F%2Ftoni4819.github.io%2FClicker%2F&scope=identify%20email";

window.discordUserId = null;
window.discordUsername = null;
window.discordAvatarURL = null;

// 🔁 Sauvegarde Firestore
window.saveCloudData = async function (userId, state) {
  try {
    await setDoc(doc(db, "users", userId), state);
    updateSaveStatus("✅ Sauvegarde réussie");
  } catch (error) {
    console.error("Erreur Firestore :", error);
    updateSaveStatus("❌ Erreur de sauvegarde");
  }
};

// 📥 Chargement Firestore
window.loadCloudData = async function (userId) {
  try {
    const docSnap = await getDoc(doc(db, "users", userId));
    if (docSnap.exists()) {
      updateSaveStatus("📦 Données chargées");
      return docSnap.data();
    } else {
      updateSaveStatus("📭 Aucune donnée trouvée");
      return null;
    }
  } catch (error) {
    console.error("Erreur de chargement :", error);
    updateSaveStatus("❌ Erreur de chargement");
    return null;
  }
};

// 🧠 Mise à jour du statut
function updateSaveStatus(text) {
  const status = document.getElementById("saveStatus");
  if (status) status.textContent = text;
}

// 🔐 Connexion Discord
window.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("discordLoginBtn");

  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      if (window.discordUserId) {
        const confirmLogout = confirm("Se déconnecter de Discord ?");
        if (confirmLogout) {
          sessionStorage.removeItem("discord_token");
          window.discordUserId = null;
          window.discordUsername = null;
          window.discordAvatarURL = null;
          location.href = location.origin + location.pathname;
        }
      } else {
        window.location.href = discordAuthURL;
      }
    });
  }

  const hash = window.location.hash;
  let token = new URLSearchParams(hash.substring(1)).get("access_token");

  if (!token) {
    token = sessionStorage.getItem("discord_token");
  } else {
    sessionStorage.setItem("discord_token", token);
    history.replaceState(null, "", location.pathname);
  }

  if (token) {
    fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(user => {
      window.discordUserId = user.id;
      window.discordUsername = user.username + "#" + user.discriminator;
      window.discordAvatarURL = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;

      const btn = document.getElementById("discordLoginBtn");
      if (btn) {
        btn.innerHTML = `
          <img src="${window.discordAvatarURL}" alt="avatar" style="width:24px;height:24px;border-radius:50%;vertical-align:middle;margin-right:8px;">
          ${window.discordUsername}
        `;
      }

      if (typeof window.loadDiscordData === "function") {
        window.loadDiscordData();
      }
    });
  }
});
