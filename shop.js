// shop.js
export function initShop({
  els,
  state,
  save,
  renderMain,
  formatCompact
}) {
  // 1) Récupère la bonne modale
  const modal = els.shopBtn;
  if (!modal) {
    console.error("initShop : #shopBtn introuvable");
    return;
  }

  // 2) Initialise le container comme pour Upgrades
  modal.className = "modal";
  modal.setAttribute("aria-hidden", "true");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-labelledby", "shopTitle");

  modal.innerHTML = `
    <div class="modal-content">
      <header class="modal-header">
        <h2 id="shopTitle">🛍️ Shop</h2>
        <button id="closeShopBtn" class="close-btn" aria-label="Fermer">✕</button>
      </header>
      <div class="modal-body gallery" id="shopBody"></div>
    </div>
  `;

  // 3) Sélecteurs internes
  const closeBtn = modal.querySelector("#closeShopBtn");
  const body     = modal.querySelector("#shopBody");

  // 4) Ouvre/ferme la modale
  function openShop() {
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }
  function closeShop() {
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  // 5) Corps de la boutique : deux boosts temporaires
  function renderShopBody() {
    const cost1 = 500_000;    // ×2 pendant 1 min
    const cost5 = 1_000_000;  // ×2 pendant 5 min

    body.innerHTML = `
      <button id="buyTemp1Btn" class="btn btn-primary">
        🕐 ×2 • 1 min — ${formatCompact(cost1)}
      </button>
      <button id="buyTemp5Btn" class="btn btn-primary">
        ⏳ ×2 • 5 min — ${formatCompact(cost5)}
      </button>
    `;

    // 6) Gestion des achats
    body.querySelector("#buyTemp1Btn").addEventListener("click", () => {
      if (state.points < cost1) return;
      state.points -= cost1;
      startTempBoost(60_000);
    });

    body.querySelector("#buyTemp5Btn").addEventListener("click", () => {
      if (state.points < cost5) return;
      state.points -= cost5;
      startTempBoost(300_000);
    });
  }

  // 7) Démarre un boost temporaire, garde l’UI à jour
  let tempTimer;
  function startTempBoost(durationMs) {
    // Définit le multiplicateur et son expiration
    state.tempShopBoostFactor    = 2;
    state.tempShopBoostExpiresAt = Date.now() + durationMs;
    localStorage.setItem(
      "shopTempExpiresAt",
      String(state.tempShopBoostExpiresAt)
    );

    save();
    renderMain();
    renderShopBody();

    clearTimeout(tempTimer);
    tempTimer = setTimeout(() => {
      state.tempShopBoostFactor    = 1;
      state.tempShopBoostExpiresAt = 0;
      localStorage.removeItem("shopTempExpiresAt");
      save();
      renderMain();
      renderShopBody();
    }, durationMs);
  }

  // 8) Restaure le boost après reload si encore valide
  const expires = parseInt(localStorage.getItem("shopTempExpiresAt") || "0", 10);
  if (expires > Date.now()) {
    startTempBoost(expires - Date.now());
  }

  // 9) Brancher l’ouverture / fermeture
  els.shopBtn.addEventListener("click", () => {
    renderShopBody();
    openShop();
  });
  closeBtn.addEventListener("click", closeShop);
  modal.addEventListener("click", e => {
    if (e.target === modal) closeShop();
  });
}
