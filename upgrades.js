import { machines } from "./machines.js";

/**
 * Initialise le menu Améliorations (anciennement Boutique),
 * crée entièrement le modal et son contenu en JS.
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
    machines: machinesData
  } = deps;

  // 1) Assurer la présence d'un container #storeModal
  let modal = els.storeModal;
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "storeModal";
    modal.className = "modal";
    modal.setAttribute("aria-hidden", "true");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-labelledby", "storeTitle");
    document.body.appendChild(modal);
    els.storeModal = modal;
  }

  // 2) Injecter le HTML “statique” du modal
  modal.innerHTML = `
    <div class="modal-content">
      <header class="modal-header">
        <h2 id="storeTitle" class="modal-title">🆙 Améliorations</h2>
        <button id="closeStoreBtn" class="close-btn" aria-label="Fermer">✕</button>
      </header>
      <div class="modal-body">
        <section class="section">
          <h3 class="section-title">💡 Améliorations basiques</h3>
          <div id="upgradesList" class="list"></div>
        </section>
        <section class="section">
          <h3 class="section-title">⚙️ Machines</h3>
          <div id="machinesList" class="list"></div>
        </section>
        <section class="section">
          <h3 class="section-title">📊 Statistiques</h3>
          <div id="statsList" class="list"></div>
        </section>
      </div>
    </div>
  `;

  // 3) Récupérer les nouvelles zones dynamiques
  els.upgradesList  = modal.querySelector("#upgradesList");
  els.machinesList  = modal.querySelector("#machinesList");
  els.statsList     = modal.querySelector("#statsList");
  els.closeStoreBtn = modal.querySelector("#closeStoreBtn");

  // 4) Fonction de rendu des items
  function renderAmeliorations() {
    els.upgradesList.innerHTML = "";
    els.machinesList.innerHTML = "";
    els.statsList.innerHTML    = "";

    // Helper pour un item 1x / 10x / Max
    function addItem(title, keyName, baseCost, container) {
      const owned = keyName === "pointsPerClick"
        ? state.pointsPerClick - 1
        : state[keyName];
      const max   = 150;
      const cost1 = costFor(baseCost, owned);

      // Créer l’item
      const item = document.createElement("div");
      item.className = "item";

      // Colonne gauche : titre + méta
      const left = document.createElement("div");
      left.innerHTML = `
        <div class="item-title">${title}</div>
        <div class="item-meta">${formatCompact(cost1)} 💰 • x${owned}</div>
      `;

      // Colonne boutons
      const controls = document.createElement("div");
      controls.className = "item-controls";

      const btn1 = document.createElement("button");
      btn1.className = "item-btn";
      btn1.textContent = "1x";
      btn1.disabled   = state.points < cost1 || owned >= max;

      const btn10 = document.createElement("button");
      btn10.className = "item-btn";
      btn10.textContent = "10x";
      btn10.disabled  = btn1.disabled;

      const btnMax = document.createElement("button");
      btnMax.className = "item-btn";
      btnMax.textContent = "Max";
      btnMax.disabled  = btn1.disabled;

      controls.append(btn1, btn10, btnMax);
      item.append(left, controls);
      container.appendChild(item);

      // Achats
      btn1.addEventListener("click", () => {
        if (state.points >= cost1 && owned < max) {
          state.points -= cost1;
          if (keyName === "pointsPerClick") state.pointsPerClick++;
          else state[keyName]++;
          save();
          renderMain();
          renderAmeliorations();
        }
      });

      btn10.addEventListener("click", () => {
        let n = 0;
        for (let i = 0; i < 10; i++) {
          const own2 = keyName === "pointsPerClick"
            ? state.pointsPerClick - 1
            : state[keyName];
          const c = costFor(baseCost, own2);
          if (state.points >= c && own2 < max) {
            state.points -= c;
            if (keyName === "pointsPerClick") state.pointsPerClick++;
            else state[keyName]++;
            n++;
          } else break;
        }
        if (n > 0) {
          save();
          renderMain();
          renderAmeliorations();
        }
      });

      btnMax.addEventListener("click", () => {
        let n = 0;
        while (true) {
          const own2 = keyName === "pointsPerClick"
            ? state.pointsPerClick - 1
            : state[keyName];
          const c = costFor(baseCost, own2);
          if (state.points >= c && own2 < max) {
            state.points -= c;
            if (keyName === "pointsPerClick") state.pointsPerClick++;
            else state[keyName]++;
            n++;
          } else break;
        }
        if (n > 0) {
          save();
          renderMain();
          renderAmeliorations();
        }
      });
    }

    // 4.1) Améliorations basiques
    addItem("🔁 Auto-Clicker",   "autoClickers",   10, els.upgradesList);
    addItem("⌑ Double Clicker",  "pointsPerClick", 20, els.upgradesList);

    // 4.2) Machines N1→N10
    for (const m of machinesData) {
      addItem(m.title, m.key, m.base, els.machinesList);
    }

    // 4.3) Statistiques brutes
    const statsData = [
      { label: "Auto-clickers", value: state.autoClickers },
      { label: "Points/clic",   value: state.pointsPerClick },
      ...machinesData.map(m => ({ label: `Machines N${m.level}`, value: state[m.key] })),
    ];
    for (const { label, value } of statsData) {
      const row = document.createElement("div");
      row.className = "stat";
      row.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
      els.statsList.appendChild(row);
    }
  }

  // 5) Ouvrir / fermer le modal
  els.openStoreBtn.addEventListener("click", () => {
    renderAmeliorations();
    openModal(els.storeModal);
  });
  els.closeStoreBtn.addEventListener("click", () => {
    save();
    closeModal(els.storeModal);
  });
}
