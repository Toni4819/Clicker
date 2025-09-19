export function initCoinDrop({ els, state, save, renderMain }) {
  const DROP_INTERVAL = 5 * 60 * 1000; // 5 min
  const DROP_CHANCE   = 0.5;
  const RARE_CHANCE   = 0.01;

  let coinEl;

  function spawnCoin() {
    if (Math.random() > DROP_CHANCE) return;

    coinEl = document.createElement("div");
    coinEl.className = "coin-drop";
    coinEl.textContent = "💰";
    coinEl.style.position = "fixed";
    coinEl.style.zIndex = "1000";
    coinEl.style.fontSize = "32px";
    coinEl.style.cursor = "pointer";
    coinEl.style.transition = "transform 0.2s";
    coinEl.style.top  = `${Math.random() * 80 + 10}%`;
    coinEl.style.left = `${Math.random() * 80 + 10}%`;

    document.body.appendChild(coinEl);

    coinEl.addEventListener("click", () => {
      const isRare = Math.random() < RARE_CHANCE;
      const multiplier = isRare ? 100 : Math.floor(Math.random() * 10) + 1;
      const gain = state.passiveClicksPerSecond * multiplier;

      state.points += gain;
      save();
      renderMain();

      // Feedback visuel
      coinEl.textContent = isRare ? "💎 +100x!" : `💰 ×${multiplier}`;
      coinEl.style.transform = "scale(1.5)";
      setTimeout(() => coinEl.remove(), 800);
    });

    // Auto-despawn après 30s
    setTimeout(() => {
      if (coinEl && coinEl.parentNode) coinEl.remove();
    }, 30_000);
  }

  // Lancement du cycle
  setInterval(spawnCoin, DROP_INTERVAL);
}
