// shop.js
export function initShop({
  els,
  state,
  save,
  renderMain,
  formatCompact
}) {
  const shopBtn = els.shopBtn;
  if (!shopBtn) {
    console.error("initShop : #shopBtn introuvable");
    return;
  }

  // 1) Récupère la modale ou la crée si elle n’existe pas
  let modal = els.shopModal;
  if (!modal) {
    modal = document.createElement("div");
    modal.id      = "shopModal";
    modal.className = "modal";
    modal.setAttribute("aria-hidden", "true");
    modal.setAttribute("role",       "dialog");
    modal.setAttribute("aria-labelledby", "shopTitle");
    document.body.append(modal);
    els.shopModal = modal;
  }

  // 2) Injecte la structure « squelette » une seule fois
  modal.innerHTML = `
    <div class="modal-content">
      <header class="modal-header">
        <h2 id="shopTitle">🛍️ Shop</h2>
        <button class="close-btn" aria-label="Fermer">✕</button>
      </header>
      <div class="modal-body gallery" id="shopBody"></div>
    </div>
  `;

  const body     = modal.querySelector("#shopBody");
  const closeBtn = modal.querySelector(".close-btn");

  // 3) Helpers d’ouverture / fermeture
  function openShop() {
    renderShopBody();
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }
  function closeShop() {
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  // 4) Rendu du contenu (chaque ouverture reconstruit shopBody)
  function renderShopBody() {
    const cost1 = 500_000;   // ×2 • 1 min
    const cost5 = 1_000_000; // ×2 • 5 min

    body.innerHTML = `
      <button class="btn btn-primary buy-temp-1">
        🕐 ×2 pour 1 min — ${formatCompact(cost1)}
      </button>
      <button class="btn btn-primary buy-temp-5">
        ⏳ ×2 pour 5 min — ${formatCompact(cost5)}
      </button>
    `;

    body.querySelector(".buy-temp-1")
        .addEventListener("click", () => startTempBoost(60_000,  cost1));
    body.querySelector(".buy-temp-5")
        .addEventListener("click", () => startTempBoost(300_000, cost5));
  }

  // 5) Logique du boost temporaire + persistence
  let tempTimer;
  function startTempBoost(durationMs, cost) {
    if (state.points < cost) return;

    state.points -= cost;
    state.tempShopBoostFactor    = 2;
    state.tempShopBoostExpiresAt = Date.now() + durationMs;
    localStorage.setItem(
      "shopTempExpiresAt",
      String(state.tempShopBoostExpiresAt)
    );

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

  // 6) Restaure après reload si boost actif
  const expiresAt = parseInt(
    localStorage.getItem("shopTempExpiresAt") || "0",
    10
  );
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

  // 7) Branche les événements
  shopBtn.addEventListener("click", openShop);
  closeBtn.addEventListener("click", closeShop);
  modal.addEventListener("click", e => {
    if (e.target === modal) closeShop();
  });
}
