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

  // Crée ou récupère la modale
  let modal = els.shopModal;
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "shopModal";
    modal.className = "modal";
    modal.setAttribute("aria-hidden", "true");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-labelledby", "shopTitle");
    document.body.append(modal);
    els.shopModal = modal;
  }

  // Squelette de la modale
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

  // Ouvrir / fermer
  function openShop() {
    renderShopBody();
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }
  function closeShop() {
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  // Contenu de la boutique
  function renderShopBody() {
    const cost1 = 25_000_000;   // ×2 • 1 min
    const cost5 = 100_000_000;  // ×2 • 5 min

    body.innerHTML = `
      <div class="shop-tile">
        <div class="emoji">🕐</div>
        <h3>×2 pour 1 min</h3>
        <button class="btn btn-primary buy-temp-1">
          Acheter — ${formatCompact(cost1)}
        </button>
      </div>
      <div class="shop-tile">
        <div class="emoji">⏳</div>
        <h3>×2 pour 5 min</h3>
        <button class="btn btn-primary buy-temp-5">
          Acheter — ${formatCompact(cost5)}
        </button>
      </div>
    `;

    body.querySelector(".buy-temp-1")
        .addEventListener("click", () => startTempBoost(60_000,  cost1));
    body.querySelector(".buy-temp-5")
        .addEventListener("click", () => startTempBoost(300_000, cost5));
  }

  // Gestion du boost cumulable
  let tempTimer;
  function startTempBoost(durationMs, cost) {
    if (state.points < cost) return;

    state.points -= cost;

    // calcul de la nouvelle expiration
    const now = Date.now();
    const baseExpire = state.tempShopBoostExpiresAt > now
      ? state.tempShopBoostExpiresAt
      : now;
    state.tempShopBoostExpiresAt = baseExpire + durationMs;

    // empilement du multiplicateur
    const currentFactor = state.tempShopBoostFactor > 1
      ? state.tempShopBoostFactor
      : 1;
    state.tempShopBoostFactor = currentFactor * 2;

    // persistence
    localStorage.setItem(
      "shopTempExpiresAt",
      String(state.tempShopBoostExpiresAt)
    );
    localStorage.setItem(
      "shopTempBoostFactor",
      String(state.tempShopBoostFactor)
    );

    save();
    renderMain();

    // relancer le timer
    clearTimeout(tempTimer);
    tempTimer = setTimeout(() => {
      state.tempShopBoostFactor    = 1;
      state.tempShopBoostExpiresAt = 0;
      localStorage.removeItem("shopTempExpiresAt");
      localStorage.removeItem("shopTempBoostFactor");
      save();
      renderMain();
    }, state.tempShopBoostExpiresAt - now);
  }

  // Restauration après reload
  const expiresAtStored = parseInt(
    localStorage.getItem("shopTempExpiresAt") || "0",
    10
  );
  const factorStored = parseInt(
    localStorage.getItem("shopTempBoostFactor") || "1",
    10
  );
  if (expiresAtStored > Date.now()) {
    state.tempShopBoostFactor    = factorStored;
    state.tempShopBoostExpiresAt = expiresAtStored;

    clearTimeout(tempTimer);
    tempTimer = setTimeout(() => {
      state.tempShopBoostFactor    = 1;
      state.tempShopBoostExpiresAt = 0;
      localStorage.removeItem("shopTempExpiresAt");
      localStorage.removeItem("shopTempBoostFactor");
      save();
      renderMain();
    }, expiresAtStored - Date.now());
  }

  // Événements d'ouverture / fermeture
  shopBtn.addEventListener("click", openShop);
  closeBtn.addEventListener("click", closeShop);
  modal.addEventListener("click", e => {
    if (e.target === modal) closeShop();
  });
}
