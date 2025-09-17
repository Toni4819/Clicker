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
  // Utiliser la même modal que "storeModal" dans main.js
  const modal = els.storeModal;

  // Multiplicateur temporaire (×1 par défaut)
  state.tempShopBoostFactor = 1;
  let tempBoostTimer = null;

  // Ouvrir la boutique
  els.shopBtn.addEventListener("click", () => {
    renderShop();
    openModal(modal);
  });

  function renderShop() {
    // Coûts fixes
    const cost1 = 500_000;    // 1 minute
    const cost5 = 1_000_000;  // 5 minutes

    // Contenu de la modal en galerie
    modal.innerHTML = `
      <div class="modal-content">
        <header class="modal-header">
          <h2>🛍️ Shop</h2>
          <button id="closeShopBtn" class="close-btn" aria-label="Fermer">✕</button>
        </header>
        <div class="modal-body gallery">
          <button id="buyTemp1Btn" class="btn btn-primary">
            🕐 ×2 pendant 1 min — ${formatCompact(cost1)} pts
          </button>
          <button id="buyTemp5Btn" class="btn btn-primary">
            ⏳ ×2 pendant 5 min — ${formatCompact(cost5)} pts
          </button>
        </div>
      </div>
    `;

    // Fermer la modal
    modal.querySelector("#closeShopBtn")
      .addEventListener("click", () => closeModal(modal));

    // Acheter ×2 pour 1 min
    modal.querySelector("#buyTemp1Btn")
      .addEventListener("click", () => {
        if (state.points >= cost1) {
          state.points -= cost1;
          startTempBoost(60_000);
        }
      });

    // Acheter ×2 pour 5 min
    modal.querySelector("#buyTemp5Btn")
      .addEventListener("click", () => {
        if (state.points >= cost5) {
          state.points -= cost5;
          startTempBoost(300_000);
        }
      });
  }

  // Lance le boost temporaire et planifie sa fin
  function startTempBoost(durationMs) {
    state.tempShopBoostFactor = 2;
    save();
    renderMain();
    renderShop();

    if (tempBoostTimer) clearTimeout(tempBoostTimer);
    tempBoostTimer = setTimeout(() => {
      state.tempShopBoostFactor = 1;
      save();
      renderMain();
      renderShop();
    }, durationMs);
  }
}
