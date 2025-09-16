import { machines } from "./machines.js";

export function initUpgrades(deps) {
  const { els, state, save, renderMain, formatCompact, costFor, machines: machinesData } = deps;

  // Récupère le placeholder du HTML
  let modal = els.storeModal;
  modal.className = "modal";
  modal.setAttribute("aria-hidden", "true");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-labelledby", "storeTitle");

  // Injection du contenu de la modale (même structure que devModal)
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

  // Style interne comme le dev menu
  Object.assign(body.style, {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "16px",
    gap: "12px",
  });

  // Fonctions ouverture/fermeture
  function openStore() {
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeStore() {
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  // Rendu du contenu
  function renderAmeliorations() {
    body.innerHTML = "";

    const upgradesList = document.createElement("div");
    upgradesList.id = "upgradesList";
    upgradesList.className = "list";

    const machinesList = document.createElement("div");
    machinesList.id = "machinesList";
    machinesList.className = "list";

    const statsList = document.createElement("div");
    statsList.id = "statsList";
    statsList.className = "list";

    // Helper pour créer un item
    function addItem(title, keyName, baseCost, container) {
      const owned = keyName === "pointsPerClick" ? state.pointsPerClick - 1 : state[keyName];
      const max = 150;
      const cost1 = costFor(baseCost, owned);

      const item = document.createElement("div");
      item.className = "item";
      item.innerHTML = `
        <div>
          <div class="item-title">${title}</div>
          <div class="item-meta">${formatCompact(cost1)} 💰 • x${owned}</div>
        </div>
        <div style="display:flex;gap:4px;">
          <button class="item-btn" ${state.points < cost1 || owned >= max ? "disabled" : ""}>1x</button>
          <button class="item-btn" ${state.points < cost1 || owned >= max ? "disabled" : ""}>10x</button>
          <button class="item-btn" ${state.points < cost1 || owned >= max ? "disabled" : ""}>Max</button>
        </div>
      `;
      container.appendChild(item);
    }

    // Sections
    const sectionUpgrades = document.createElement("section");
    sectionUpgrades.className = "section";
    sectionUpgrades.innerHTML = `<h3 class="section-title">💡 Améliorations basiques</h3>`;
    sectionUpgrades.appendChild(upgradesList);

    const sectionMachines = document.createElement("section");
    sectionMachines.className = "section";
    sectionMachines.innerHTML = `<h3 class="section-title">⚙️ Machines</h3>`;
    sectionMachines.appendChild(machinesList);

    const sectionStats = document.createElement("section");
    sectionStats.className = "section";
    sectionStats.innerHTML = `<h3 class="section-title">📊 Statistiques</h3>`;
    sectionStats.appendChild(statsList);

    body.append(sectionUpgrades, sectionMachines, sectionStats);

    // Remplissage
    addItem("🔁 Auto-Clicker", "autoClickers", 10, upgradesList);
    addItem("⌑ Double Clicker", "pointsPerClick", 20, upgradesList);
    for (const m of machinesData) addItem(m.title, m.key, m.base, machinesList);
    for (const m of machinesData) {
      const row = document.createElement("div");
      row.className = "stat";
      row.innerHTML = `<span>${m.title}</span><strong>${state[m.key]}</strong>`;
      statsList.appendChild(row);
    }
  }

  // Événements
  els.openStoreBtn.addEventListener("click", () => {
    renderAmeliorations();
    openStore();
  });

  els.closeStoreBtn.addEventListener("click", closeStore);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeStore();
  });
}
