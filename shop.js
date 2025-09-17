// shop.js
export function initShop({
  els,
  state,
  save,
  renderMain,
  formatCompact
}) {
  // 1) Le bouton qui déclenche
  const shopBtn = els.shopBtn;
  if (!shopBtn) {
    console.error("initShop : #shopBtn introuvable");
    return;
  }

  // 2) Cherche d’abord #shopModal, sinon on retombe sur #storeModal
  const modal =
    document.getElementById("shopModal") ||
    document.getElementById("storeModal");

  if (!modal) {
    console.error("initShop : ni #shopModal ni #storeModal introuvable");
    return;
  }

  // 3) Structure de la modale (identique à upgrades.js)
  modal.className = "modal";
  modal.setAttribute("aria-hidden", "true");
  modal.setAttribute("role",       "dialog");
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

  const closeBtn = modal.querySelector("#closeShopBtn");
  const body     = modal.querySelector("#shopBody");

  // 4) Ouvrir / fermer
  function openShop() {
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }
  function closeShop() {
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  // 5) Renderer du contenu (2 boosts temporaires)
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

  // 6) Gestion du boost temporaire
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

  // 7) Restauration après reload (si boost en cours)
  const expires = parseInt(
    localStorage.getItem("shopTempExpiresAt") || "0",
    10
  );
  if (expires > Date.now()) {
    // on relance sans redébiter les points
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

  // 8) Brancher l’ouverture & la fermeture
  shopBtn.addEventListener("click", () => {
    renderShopBody();
    openShop();
  });
  closeBtn.addEventListener("click", closeShop);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeShop();
  });
}
