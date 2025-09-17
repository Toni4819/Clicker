// shop.js
export function initShop({
  els,
  state,
  save,
  renderMain,
  formatCompact
}) {
  const shopBtn = els.shopBtn;
  // fallback si tu n’as pas ajouté #shopModal dans l’HTML
  const modal   = els.shopModal || els.storeModal;

  if (!shopBtn || !modal) {
    console.error("initShop : #shopBtn ou #shopModal/#storeModal introuvable");
    return;
  }

  // Timer pour la fin du boost
  let tempTimer;

  // Démarre ou restaure le boost temporaire
  function startTempBoost(durationMs, cost) {
    if (state.points < cost) return;

    // On débite, applique et stocke l’expiration
    state.points -= cost;
    state.tempShopBoostFactor    = 2;
    state.tempShopBoostExpiresAt = Date.now() + durationMs;
    localStorage.setItem("shopTempExpiresAt", String(state.tempShopBoostExpiresAt));

    save();
    renderMain();

    clearTimeout(tempTimer);
    tempTimer = setTimeout(() => {
      state.tempShopBoostFactor    = 1;
      state.tempShopBoostExpiresAt = 0;
      localStorage.removeItem("shopTempExpiresAt");
      save();
      renderMain();
    }, durationMs);
  }

  // Injecte le HTML du shop à chaque ouverture
  function renderShop() {
    const cost1 = 500_000;   // ×2 pour 1 min
    const cost5 = 1_000_000; // ×2 pour 5 min

    modal.innerHTML = `
      <div class="modal-content">
        <header class="modal-header">
          <h2>🛍️ Shop</h2>
          <button class="close-btn" aria-label="Fermer">✕</button>
        </header>
        <div class="modal-body gallery">
          <button class="btn btn-primary buy-temp-1">
            🕐 ×2 • 1 min — ${formatCompact(cost1)}
          </button>
          <button class="btn btn-primary buy-temp-5">
            ⏳ ×2 • 5 min — ${formatCompact(cost5)}
          </button>
        </div>
      </div>
    `;

    // Brancher les écouteurs sur le nouveau contenu
    const closeBtn = modal.querySelector(".close-btn");
    const btn1     = modal.querySelector(".buy-temp-1");
    const btn5     = modal.querySelector(".buy-temp-5");

    closeBtn.addEventListener("click", closeShop);
    btn1    .addEventListener("click", () => startTempBoost(60_000, cost1));
    btn5    .addEventListener("click", () => startTempBoost(300_000, cost5));
  }

  // Ouvre et ferme la modal
  function openShop() {
    renderShop();
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeShop() {
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  // Fermeture au clic hors contenu
  modal.addEventListener("click", e => {
    if (e.target === modal) closeShop();
  });

  // Restaure le boost si on reload en cours de timer
  const expiresAt = parseInt(localStorage.getItem("shopTempExpiresAt") || "0", 10);
  if (expiresAt > Date.now()) {
    const remaining = expiresAt - Date.now();
    state.tempShopBoostFactor    = 2;
    state.tempShopBoostExpiresAt = expiresAt;
    clearTimeout(tempTimer);
    tempTimer = setTimeout(() => {
      state.tempShopBoostFactor    = 1;
      state.tempShopBoostExpiresAt = 0;
      localStorage.removeItem("shopTempExpiresAt");
      save();
      renderMain();
    }, remaining);
  }

  // Événement d’ouverture sur ton vrai bouton #shopBtn
  shopBtn.addEventListener("click", openShop);
}
