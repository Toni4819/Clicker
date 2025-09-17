// shop.js
export function initShop({
  els,
  state,
  save,
  renderMain,
  formatCompact
}) {
  // 1) Récupère le container modal réservé au shop
  const modal = els.shopModal;
  if (!modal) {
    console.error("initShop : #shopModal introuvable");
    return;
  }

  // 2) Structure initiale de la modale (idem upgrades.js)
  modal.className = "modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-labelledby", "shopTitle");
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `
    <div class="modal-content">
      <header class="modal-header">
        <h2 id="shopTitle">🛍️ Shop</h2>
        <button id="closeShopBtn" class="close-btn" aria-label="Fermer">✕</button>
      </header>
      <div class="modal-body gallery" id="shopBody"></div>
    </div>
  `;

  const body     = modal.querySelector("#shopBody");
  const closeBtn = modal.querySelector("#closeShopBtn");
  const shopBtn  = els.shopBtn;

  // 3) Helpers d’ouverture/fermeture
  function openShop() {
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }
  function closeShop() {
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  // 4) Rendu du contenu (2 offres temporaires ×2)
  function renderShopBody() {
    const cost1 = 500_000;    // ×2 • 1 min
    const cost5 = 1_000_000;  // ×2 • 5 min

    body.innerHTML = `
      <button id="buyTemp1Btn" class="btn btn-primary">
        🕐 ×2 pour 1 min — ${formatCompact(cost1)}
      </button>
      <button id="buyTemp5Btn" class="btn btn-primary">
        ⏳ ×2 pour 5 min — ${formatCompact(cost5)}
      </button>
    `;

    body
      .querySelector("#buyTemp1Btn")
      .addEventListener("click", () => startTempBoost(60_000, cost1));

    body
      .querySelector("#buyTemp5Btn")
      .addEventListener("click", () => startTempBoost(300_000, cost5));
  }

  // 5) Lancement et restauration du boost temporaire
  let tempTimer;
  function startTempBoost(durationMs, cost) {
    if (state.points < cost) return;

    // débit et stockage de l’expiration
    state.points -= cost;
    state.tempShopBoostFactor    = 2;
    state.tempShopBoostExpiresAt = Date.now() + durationMs;
    localStorage.setItem("shopTempExpiresAt", String(state.tempShopBoostExpiresAt));

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

  // 6) Si reload en cours de boost, on restaure
  const expires = parseInt(localStorage.getItem("shopTempExpiresAt") || "0", 10);
  if (expires > Date.now()) {
    const remaining = expires - Date.now();
    state.tempShopBoostFactor    = 2;
    state.tempShopBoostExpiresAt = expires;
    clearTimeout(tempTimer);
    tempTimer = setTimeout(() => {
      state.tempShopBoostFactor    = 1;
      state.tempShopBoostExpiresAt = 0;
      localStorage.removeItem("shopTempExpiresAt");
      save();
      renderMain();
      renderShopBody();
    }, remaining);
  }

  // 7) Événements
  shopBtn.addEventListener("click", () => {
    renderShopBody();
    openShop();
  });
  closeBtn.addEventListener("click", closeShop);
  modal.addEventListener("click", e => {
    if (e.target === modal) closeShop();
  });
}
