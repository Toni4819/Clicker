// shop.js
export function initShop({
  els,
  state,
  save,
  renderMain,
  openModal,
  closeModal,
  formatCompact
}) {
  const modal = els.shopBtn;              // ← utilise shopModal, pas storeModal

  // 1) Charger l’expiration depuis localStorage
  const expires = parseInt(localStorage.getItem("shopTempExpiresAt") || "0", 10);
  state.tempShopBoostExpiresAt = expires;
  state.tempShopBoostFactor = 1;

  // 2) Initialiser le boost temporaire si toujours valide
  function restoreTempBoost() {
    const now = Date.now();
    if (state.tempShopBoostExpiresAt > now) {
      state.tempShopBoostFactor = 2;
      // programmer la fin du boost
      setTimeout(endTempBoost, state.tempShopBoostExpiresAt - now);
    } else {
      endTempBoost();
    }
  }
  function endTempBoost() {
    state.tempShopBoostFactor      = 1;
    state.tempShopBoostExpiresAt   = 0;
    localStorage.removeItem("shopTempExpiresAt");
    save();
    renderMain();
  }
  restoreTempBoost();

  // 3) Ouvrir la boutique
  els.shopBtn.addEventListener("click", () => {
    renderShop();
    openModal(modal);
  });

  function renderShop() {
    const cost1 = 500_000;   // ×2 pendant 1 min
    const cost5 =1_000_000;  // ×2 pendant 5 min

    modal.innerHTML = `
      <div class="modal-content">
        <header class="modal-header">
          <h2>🛍️ Shop</h2>
          <button id="closeShopBtn" class="close-btn" aria-label="Fermer">✕</button>
        </header>
        <div class="modal-body gallery">
          <button id="buyTemp1Btn" class="btn btn-primary">
            🕐 ×2 • 1 min — ${formatCompact(cost1)} pts
          </button>
          <button id="buyTemp5Btn" class="btn btn-primary">
            ⏳ ×2 • 5 min — ${formatCompact(cost5)} pts
          </button>
        </div>
      </div>
    `;

    modal.querySelector("#closeShopBtn")
      .addEventListener("click", () => closeModal(modal));

    modal.querySelector("#buyTemp1Btn")
      .addEventListener("click", () => {
        if (state.points < cost1) return;
        state.points -= cost1;
        startTempBoost(60_000);
      });

    modal.querySelector("#buyTemp5Btn")
      .addEventListener("click", () => {
        if (state.points < cost5) return;
        state.points -= cost5;
        startTempBoost(300_000);
      });
  }

  // 4) Démarrer un boost temporaire
  function startTempBoost(durationMs) {
    state.tempShopBoostFactor    = 2;
    state.tempShopBoostExpiresAt = Date.now() + durationMs;
    localStorage.setItem(
      "shopTempExpiresAt",
      String(state.tempShopBoostExpiresAt)
    );
    save();
    renderMain();
    renderShop();
    // programmer fin si reload immédiat
    setTimeout(endTempBoost, durationMs);
  }
}
