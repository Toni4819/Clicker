import { machines } from "./machines.js";

/**
 * Initialise le menu Améliorations (anciennement Boutique)
 * @param {Object} deps
 * @param {Object} deps.els
 * @param {Object} deps.state
 * @param {Function} deps.save
 * @param {Function} deps.renderMain
 * @param {Function} deps.openModal
 * @param {Function} deps.closeModal
 * @param {Function} deps.formatCompact
 * @param {Function} deps.costFor
 * @param {Array}  deps.machines
 */
export function initUpgrades(deps) {
  const {
    els,
    state,
    save,
    renderMain,
    openModal,
    closeModal,
    formatCompact,
    costFor,
    machines,
  } = deps;

  function renderAmeliorations() {
    // Titre du modal
    const title = els.storeModal.querySelector(".modal-title");
    if (title) title.textContent = "Améliorations";

    // Liste des améliorations
    els.upgradesList.innerHTML = "";

    // Auto-Clicker
    {
      const owned = state.autoClickers;
      const cost = costFor(10, owned);
      const item = document.createElement("div");
      item.className = "item";

      const left = document.createElement("div");
      left.innerHTML = `
        <div class="item-title">🔁 Auto-Clicker</div>
        <div class="item-meta">${formatCompact(cost)} 💰 • x${owned}</div>
      `;

      const btn = document.createElement("button");
      btn.className = "item-btn";
      btn.textContent = "Acheter";
      if (owned >= 150) btn.disabled = true;

      btn.addEventListener("click", () => {
        if (state.points >= cost && owned < 150) {
          state.points -= cost;
          state.autoClickers++;
          save();
          renderMain();
          renderAmeliorations();
        }
      });

      item.append(left, btn);
      els.upgradesList.appendChild(item);
    }

    // Double Clicker
    {
      const owned = state.pointsPerClick - 1;
      const cost = costFor(20, owned);
      const item = document.createElement("div");
      item.className = "item";

      const left = document.createElement("div");
      left.innerHTML = `
        <div class="item-title">⌑ Double Clicker</div>
        <div class="item-meta">${formatCompact(cost)} 💰 • x${owned}</div>
      `;

      const btn = document.createElement("button");
      btn.className = "item-btn";
      btn.textContent = "Acheter";

      btn.addEventListener("click", () => {
        if (state.points >= cost) {
          state.points -= cost;
          state.pointsPerClick++;
          save();
          renderMain();
          renderAmeliorations();
        }
      });

      item.append(left, btn);
      els.upgradesList.appendChild(item);
    }

    // Machines N1..N10
    els.machinesList.innerHTML = "";
    for (const m of machines) {
      const owned = state[m.key];
      const cost = costFor(m.base, owned);
      const item = document.createElement("div");
      item.className = "item";

      const left = document.createElement("div");
      left.innerHTML = `
        <div class="item-title">${m.title}</div>
        <div class="item-meta">${formatCompact(cost)} 💰 • x${owned}</div>
      `;

      const btn = document.createElement("button");
      btn.className = "item-btn";
      btn.textContent = "Acheter";
      if (owned >= 150) btn.disabled = true;

      btn.addEventListener("click", () => {
        if (state.points >= cost && state[m.key] < 150) {
          state.points -= cost;
          state[m.key]++;
          save();
          renderMain();
          renderAmeliorations();
        }
      });

      item.append(left, btn);
      els.machinesList.appendChild(item);
    }

    // Statistiques
    els.statsList.innerHTML = "";
    const stats = [
      { label: "Auto-clickers", value: state.autoClickers },
      { label: "Points/clic", value: state.pointsPerClick },
      ...machines.map(m => ({ label: `Machines N${m.level}`, value: state[m.key] })),
    ];
    for (const { label, value } of stats) {
      const row = document.createElement("div");
      row.className = "stat";
      row.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
      els.statsList.appendChild(row);
    }
  }

  // Ouverture du modal Améliorations
  els.openStoreBtn.addEventListener("click", () => {
    renderAmeliorations();
    openModal(els.storeModal);
  });

  // Fermeture du modal Améliorations
  els.closeStoreBtn.addEventListener("click", () => {
    save();
    closeModal(els.storeModal);
  });
}
