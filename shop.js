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
  const modal = document.getElementById("shopModal");

  // Ouvrir la boutique
  els.shopBtn.addEventListener("click", () => {
    renderShop();
    openModal(modal);
  });

  // Génère le contenu de la modal shop à chaque ouverture/achat
  function renderShop() {
    // Coût augmenté selon l’effet déjà acheté
    const x2Cost = 100 * state.shopBoost;
    const x5Cost = 500 * state.shopBoost;

    modal.innerHTML = `
      <div class="modal-content">
        <header class="modal-header">
          <h2>🛍️ Shop</h2>
          <button id="closeShopBtn" class="close-btn" aria-label="Fermer">✕</button>
        </header>
        <div class="modal-body">
          <button id="buyX2Btn" class="btn btn-primary">
            x2 Boost (${formatCompact(x2Cost)} pts)
          </button>
          <button id="buyX5Btn" class="btn btn-primary">
            x5 Boost (${formatCompact(x5Cost)} pts)
          </button>
        </div>
      </div>
    `;

    // Fermer la modal
    document
      .getElementById("closeShopBtn")
      .addEventListener("click", () => closeModal(modal));

    // Achat ×2
    document
      .getElementById("buyX2Btn")
      .addEventListener("click", () => {
        if (state.points >= x2Cost) {
          state.points -= x2Cost;
          state.shopBoost *= 2;
          save();
          renderMain();
          renderShop();
        }
      });

    // Achat ×5
    document
      .getElementById("buyX5Btn")
      .addEventListener("click", () => {
        if (state.points >= x5Cost) {
          state.points -= x5Cost;
          state.shopBoost *= 5;
          save();
          renderMain();
          renderShop();
        }
      });
  }
}
