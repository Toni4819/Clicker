// URL OAuth2 Discord
const discordAuthURL = "https://discord.com/oauth2/authorize?client_id=1415716108031361185&response_type=token&redirect_uri=https%3A%2F%2Ftoni4819.github.io%2FClicker%2F&scope=identify%20email";

// Variables globales
window.discordUserId = null;
window.discordUsername = null;

// Bouton de connexion Discord
window.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("discordLoginBtn");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      window.location.href = discordAuthURL;
    });
  }

  const hash = window.location.hash;
  const token = new URLSearchParams(hash.substring(1)).get("access_token");

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

      const info = document.getElementById("discordUserInfo");
      if (info) {
        info.textContent = `Connecté en tant que ${window.discordUsername}`;
      }

      // Charge les données du jeu pour cet utilisateur
      if (typeof window.loadDiscordData === "function") {
        window.loadDiscordData();
      }
    });
  }
});
