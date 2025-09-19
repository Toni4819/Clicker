export function initCoinDrop({ els, state, save, renderMain }) {
  const DROP_INTERVAL = 5 * 60 * 1000; // 5 minutes
  const DROP_CHANCE   = 0.5;
  const RARE_CHANCE   = 0.01;

  // Création du conteneur de messages en bas de l’écran
  const msgContainer = document.createElement("div");
  Object.assign(msgContainer.style, {
    position: "fixed",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    zIndex: "1001"
  });
  document.body.appendChild(msgContainer);

  // Affiche une bulle d'info et la supprime au bout de 3s
  function showMessage(text) {
    const msg = document.createElement("div");
    Object.assign(msg.style, {
      backgroundColor: "#2196F3",
      color: "#fff",
      padding: "8px 12px",
      borderRadius: "4px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
      fontSize: "14px",
      opacity: "0",
      transform: "translateY(10px)",
      transition: "opacity 0.3s, transform 0.3s"
    });
    msg.textContent = text;
    msgContainer.appendChild(msg);

    // trigger animation d'entrée
    requestAnimationFrame(() => {
      msg.style.opacity = "1";
      msg.style.transform = "translateY(0)";
    });

    // fondu et suppression
    setTimeout(() => {
      msg.style.opacity = "0";
      msg.style.transform = "translateY(10px)";
      setTimeout(() => msg.remove(), 300);
    }, 3000);
  }

  // Génère une pièce à intervalle défini
  function spawnCoin() {
    if (Math.random() > DROP_CHANCE) return;

    const coin = document.createElement("div");
    coin.className = "coin-drop";
    coin.textContent = "💰";
    Object.assign(coin.style, {
      position: "fixed",
      zIndex: "1000",
      fontSize: "32px",
      cursor: "pointer",
      transition: "transform 0.2s",
      top: `${Math.random() * 80 + 10}%`,
      left: `${Math.random() * 80 + 10}%`
    });

    document.body.appendChild(coin);

    coin.addEventListener("click", event => {
      const isRare = Math.random() < RARE_CHANCE;
      const multiplier = isRare ? 100 : Math.floor(Math.random() * 10) + 1;
      const gain = state.passiveClicksPerSecond * multiplier;

      state.points += gain;
      save();
      renderMain();

      // retour visuel sur la pièce
      const target = event.currentTarget;
      target.textContent = isRare ? "💎 +100×!" : `💰 ×${multiplier}`;
      target.style.transform = "scale(1.5)";

      // message d’info en bas de l’écran
      showMessage(`+${gain} pts ${isRare ? "(rare)" : ""}`);

      setTimeout(() => target.remove(), 800);
    });

    // auto-suppression au bout de 30s si non cliquée
    setTimeout(() => {
      if (coin.parentNode) coin.remove();
    }, 30_000);
  }

  // lancement du cycle de drop
  setInterval(spawnCoin, DROP_INTERVAL);
}
