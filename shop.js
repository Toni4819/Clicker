// shop.js
export function initShop({
  els,
  state,
  save,
  renderMain,
  formatCompact
}) {
  const shopBtn = els.shopBtn;
  const modal   = els.shopModal;

  if (!shopBtn || !modal) {
    console.error("initShop : #shopBtn ou #shopModal introuvable");
    return;
  }

  // 1) Structure initiale de la modale Shop
  modal.className = "modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-labelledby", "shopTitle");
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `
    <div class="modal-content">
      <header class="modal-header">
        <h2 id="shopTitle">🛍️ Shop</h2>
        <button class="close-btn" aria-label="Fermer">✕</button>
      </header>
      <div class="modal-body gallery">
        <button class="btn btn-primary buy-temp-1">
          🕐 ×2 • 1 min — ${formatCompact(500_000)}
        </button>
        <button class="btn btn-primary buy-temp-5">
          ⏳ ×2 • 5 min — ${formatCompact(1_000_000)}
        </button>
      </div>
    </div>
  `;

  const closeBtn = modal.querySelector(".close-btn");
  const btn1     = modal.querySelector(".buy-temp-1");
  const btn5     = modal.querySelector(".buy-temp-5");

  // 2) Helpers d’ouverture / fermeture
  function openShop() {
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }
  function closeShop() {
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  // 3) Gestion du boost temporaire
  let timeoutId;
  function startTempBoost(durationMs, cost) {
    if (state.points < cost) return;

    // débit du coût et calcul de l’expiration
    state.points -= cost;
    state.tempShopBoostFactor    = (state.tempShopBoostFactor || 1) * 2;
    state.tempShopBoostExpiresAt = Date.now() + durationMs;
    localStorage.setItem(
      "shopTempExpiresAt",
      String(state.tempShopBoostExpiresAt)
    );

    save();
    renderMain();

    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      state.tempShopBoostFactor    = 1;
      state.tempShopBoostExpiresAt = 0;
      localStorage.removeItem("shopTempExpiresAt");
      save();
      renderMain();
    }, durationMs);
  }

  // 4) Restauration après reload si boost actif
  const expiresAt = parseInt(
    localStorage.getItem("shopTempExpiresAt") || "0",
    10
  );
  if (expiresAt > Date.now()) {
    const remaining = expiresAt - Date.now();
    state.tempShopBoostFactor    = 2;
    state.tempShopBoostExpiresAt = expiresAt;

    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      state.tempShopBoostFactor    = 1;
      state.tempShopBoostExpiresAt = 0;
      localStorage.removeItem("shopTempExpiresAt");
      save();
      renderMain();
    }, remaining);
  }

  // 5) Événements
  shopBtn.addEventListener("click", openShop);
  closeBtn.addEventListener("click", closeShop);
  modal.addEventListener("click", e => {
    if (e.target === modal) closeShop();
  });

  btn1.addEventListener("click", () => startTempBoost(60_000,  500_000));
  btn5.addEventListener("click", () => startTempBoost(300_000,1_000_000));
}
