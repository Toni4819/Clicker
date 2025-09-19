import { machines } from "/machines.js";

let storeInterval = null;

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

    // Lancement de l'actualisation continue
    if (storeInterval === null) {
      storeInterval = setInterval(renderAmeliorations, 500);
    }
  }

  function closeStore() {
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");

    // Arrêt de l'actualisation continue
    if (storeInterval !== null) {
      clearInterval(storeInterval);
      storeInterval = null;
    }
  }

  function renderAmeliorations() {
    const prevScroll = body.scrollTop;
    body.innerHTML = "";

    // Conteneurs
    const upgradesList = document.createElement("div");
    upgradesList.id = "upgradesList";
    upgradesList.className = "list";

    const machinesList = document.createElement("div");
    machinesList.id = "machinesList";
    machinesList.className = "list";

    // Ajout d'un item full-width
    function addItem(title, keyName, baseCost, container) {
      const owned =
        keyName === "pointsPerClick"
          ? state.pointsPerClick - 1
          : state[keyName];
      const max = 1000;
      const cost1 = costFor(baseCost, owned);
      const isBuyable = state.points >= cost1 && owned < max;

      const item = document.createElement("div");
      item.className = "item" + (isBuyable ? " item-available" : "");
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

    // Sections DOM
    const sectionUpgrades = document.createElement("section");
    sectionUpgrades.className = "section";
    sectionUpgrades.innerHTML = `<h3 class="section-title">💡 Améliorations basiques</h3>`;
    sectionUpgrades.appendChild(upgradesList);

    const sectionMachines = document.createElement("section");
    sectionMachines.className = "section";
    sectionMachines.innerHTML = `<h3 class="section-title">⚙️ Machines</h3>`;
    sectionMachines.appendChild(machinesList);

    body.append(sectionUpgrades, sectionMachines);

    // Instanciation des items
    addItem("🔁 Auto-Clicker", "autoClickers", 10, upgradesList);
    addItem("⌑ Double Clicker", "pointsPerClick", 50, upgradesList);
    machinesData.forEach((m) =>
      addItem(m.title, m.key, m.base, machinesList)
    );

    // Restauration du scroll
    body.scrollTop = prevScroll;
  }

  // Événements
  els.upgradesBtn.addEventListener("click", () => {
    renderAmeliorations();
    openStore();
  });
  els.closeStoreBtn.addEventListener("click", closeStore);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeStore();
  });
}
