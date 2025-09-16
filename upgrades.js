import { machines } from "./machines.js";

export function initUpgrades(deps) {
  const {
    els,
    state,
    save,
    renderMain,
    formatCompact,
    costFor,
    machines: machinesData,
  } = deps;

  // Initialise le modal
  let modal = els.storeModal;
  modal.className = "modal";
  modal.setAttribute("aria-hidden", "true");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-labelledby", "storeTitle");

  modal.innerHTML = `
    <div class="modal-content">
      <header class="modal-header">
        <h2 id="storeTitle">🆙 Améliorations</h2>
        <button id="closeStoreBtn" class="close-btn" aria-label="Fermer">✕</button>
      </header>
      <div class="modal-body" id="upgradesBody"></div>
    </div>
  `;
  els.closeStoreBtn = modal.querySelector("#closeStoreBtn");
  const body = modal.querySelector("#upgradesBody");

  // Corps du modal : items en colonne pleine largeur
  Object.assign(body.style, {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    padding: "16px",
    gap: "12px",
  });

  function openStore() {
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeStore() {
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  function renderAmeliorations() {
    body.innerHTML = "";

    // Liste des améliorations basiques
    const upgradesList = document.createElement("div");
    upgradesList.id = "upgradesList";
    upgradesList.className = "list";

    // Liste des machines
    const machinesList = document.createElement("div");
    machinesList.id = "machinesList";
    machinesList.className = "list";

    // Fonction d'ajout d'un item full-width
    function addItem(title, keyName, baseCost, container) {
      const owned =
        keyName === "pointsPerClick"
          ? state.pointsPerClick - 1
          : state[keyName];
      const max = 150;
      const cost1 = costFor(baseCost, owned);
      const isBuyable = state.points >= cost1 && owned < max;

      const item = document.createElement("div");
      item.className = "item" + (isBuyable ? " item-available" : "");
      // force pleine largeur
      item.style.width = "100%";

      item.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div class="item-title">${title}</div>
            <div class="item-meta">${formatCompact(cost1)} 💰 • x${owned}</div>
          </div>
          <div style="display:flex;gap:4px;">
            <button class="item-btn" ${!isBuyable ? "disabled" : ""}>1x</button>
            <button class="item-btn" ${!isBuyable ? "disabled" : ""}>10x</button>
            <button class="item-btn" ${!isBuyable ? "disabled" : ""}>Max</button>
          </div>
        </div>
      `;
      container.appendChild(item);

      const buttons = item.querySelectorAll(".item-btn");
      const quantities = [1, 10, "max"];
      buttons.forEach((btn, i) => {
        btn.addEventListener("click", () => {
          let toBuy = 0;
          const qty = quantities[i];
          let current =
            keyName === "pointsPerClick"
              ? state.pointsPerClick - 1
              : state[keyName];

          if (qty === "max") {
            let cost = costFor(baseCost, current);
            while (state.points >= cost && current + toBuy < max) {
              state.points -= cost;
              toBuy++;
              cost = costFor(baseCost, current + toBuy);
            }
          } else {
            for (let j = 0; j < qty; j++) {
              const cost = costFor(baseCost, current + toBuy);
              if (state.points >= cost && current + toBuy < max) {
                state.points -= cost;
                toBuy++;
              } else {
                break;
              }
            }
          }

          if (toBuy > 0) {
            if (keyName === "pointsPerClick") {
              state.pointsPerClick += toBuy;
            } else {
              state[keyName] += toBuy;
            }
            save();
            renderAmeliorations();
            renderMain();
          }
        });
      });
    }

    // Section Améliorations basiques
    const sectionUpgrades = document.createElement("section");
    sectionUpgrades.className = "section";
    sectionUpgrades.innerHTML = `
      <h3 class="section-title">💡 Améliorations basiques</h3>
    `;
    sectionUpgrades.appendChild(upgradesList);

    // Section Machines
    const sectionMachines = document.createElement("section");
    sectionMachines.className = "section";
    sectionMachines.innerHTML = `
      <h3 class="section-title">⚙️ Machines</h3>
    `;
    sectionMachines.appendChild(machinesList);

    // Ajout au DOM
    body.append(sectionUpgrades, sectionMachines);

    // Instanciation des items
    addItem("🔁 Auto-Clicker", "autoClickers", 10, upgradesList);
    addItem("⌑ Double Clicker", "pointsPerClick", 20, upgradesList);
    machinesData.forEach((m) =>
      addItem(m.title, m.key, m.base, machinesList)
    );
  }

  // Événements d'ouverture/fermeture
  els.openStoreBtn.addEventListener("click", () => {
    renderAmeliorations();
    openStore();
  });
  els.closeStoreBtn.addEventListener("click", closeStore);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeStore();
  });
}
