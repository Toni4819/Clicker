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

  // --- Création / récupération de la modale ---
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

  function openShop() {
    renderShopBody();
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }
  function closeShop() {
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  // --- Paramètres du boost temporaire ---
  const MAX_BOOST_MS = 60 * 60 * 1000; // 1h
  let tempTimer;

  function renderShopBody() {
    const cost1 = 25_000_000;   // 1 min
    const cost5 = 100_000_000;  // 5 min

    // Calcul du temps restant
    const now       = Date.now();
    const expiresAt = state.tempShopBoostExpiresAt > now
      ? state.tempShopBoostExpiresAt
      : now;
    const remaining = expiresAt - now;

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

    const btn1 = body.querySelector(".buy-temp-1");
    const btn5 = body.querySelector(".buy-temp-5");

    // Activation / désactivation selon fonds et plafond horaire
    const canBuy1 = state.points >= cost1 && (remaining + 60_000) <= MAX_BOOST_MS;
    const canBuy5 = state.points >= cost5 && (remaining + 300_000) <= MAX_BOOST_MS;

    btn1.disabled = !canBuy1;
    btn5.disabled = !canBuy5;

    if (canBuy1) btn1.addEventListener("click", () => startTempBoost(60_000,  cost1));
    if (canBuy5) btn5.addEventListener("click", () => startTempBoost(300_000, cost5));
  }

  function startTempBoost(durationMs, cost) {
    if (state.points < cost) return;

    state.points -= cost;

    const now       = Date.now();
    const baseExpire = state.tempShopBoostExpiresAt > now
      ? state.tempShopBoostExpiresAt
      : now;

    // On cumule le temps, mais on plafonne à 1h
    const newExpire = Math.min(baseExpire + durationMs, now + MAX_BOOST_MS);
    state.tempShopBoostExpiresAt = newExpire;

    // On pose un facteur fixe ×2 (pas de stacking)
    state.tempShopBoostFactor = 2;

    // Sauvegarde
    localStorage.setItem("shopTempExpiresAt", String(state.tempShopBoostExpiresAt));
    localStorage.setItem("shopTempBoostFactor", String(state.tempShopBoostFactor));

    save();
    renderMain();

    // Reset après expiration
    clearTimeout(tempTimer);
    tempTimer = setTimeout(() => {
      state.tempShopBoostFactor    = 1;
      state.tempShopBoostExpiresAt = 0;
      localStorage.removeItem("shopTempExpiresAt");
      localStorage.removeItem("shopTempBoostFactor");
      save();
      renderMain();
    }, newExpire - now);
  }

  // Restauration après reload
  const expiresAtStored = parseInt(localStorage.getItem("shopTempExpiresAt") || "0", 10);
  const factorStored    = parseInt(localStorage.getItem("shopTempBoostFactor") || "1",  10);
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

  // Liens d’ouverture / fermeture
  shopBtn.addEventListener("click", openShop);
  closeBtn.addEventListener("click", closeShop);
  modal.addEventListener("click", e => {
    if (e.target === modal) closeShop();
  });
}
