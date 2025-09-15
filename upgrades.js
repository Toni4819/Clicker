import { machines } from "./machines.js";

/**
 * Initialise le menu Améliorations (anciennement Boutique)
 * @param {Object} deps
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

  // ─── Création du modal si absent ───
  let modal = els.storeModal;
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "storeModal";
    document.body.appendChild(modal);
    els.storeModal = modal;
  }

  // Styles et attributs du modal
  modal.className = "modal";
  modal.setAttribute("aria-hidden", "true");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-labelledby", "storeTitle");
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    background: rgba(0,0,0,0.5);
    z-index: 1000;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
  `;

  // ─── Injection du contenu HTML ───
  modal.innerHTML = `
    <div class="modal-content" style="
      background: #1a1a1a;
      border-radius: 12px;
      padding: 16px;
      width: min(500px, 92vw);
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 8px 30px rgba(0,0,0,0.4);
    ">
      <header class="modal-header" style="display:flex;justify-content:space-between;align-items:center;">
        <h2 id="storeTitle" class="modal-title">🆙 Améliorations</h2>
        <button id="closeStoreBtn" class="close-btn" aria-label="Fermer" style="
          background:none;border:none;color:#bbb;font-size:1.2rem;cursor:pointer;
        ">✕</button>
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

  // ─── Sélecteurs internes ───
  els.upgradesList  = modal.querySelector("#upgradesList");
  els.machinesList  = modal.querySelector("#machinesList");
  els.statsList     = modal.querySelector("#statsList");
  els.closeStoreBtn = modal.querySelector("#closeStoreBtn");

  // ─── Fonctions ouverture/fermeture ───
  function openStore() {
    modal.setAttribute("aria-hidden", "false");
    modal.style.opacity = "1";
    modal.style.pointerEvents = "auto";
  }
  function closeStore() {
    modal.setAttribute("aria-hidden", "true");
    modal.style.opacity = "0";
    modal.style.pointerEvents = "none";
  }

  // ─── Rendu des items ───
  function renderAmeliorations() {
    els.upgradesList.innerHTML = "";
    els.machinesList.innerHTML = "";
    els.statsList.innerHTML    = "";

    // Helper pour créer un item avec 1x / 10x / Max
    function addItem(title, keyName, baseCost, container) {
      const owned = keyName === "pointsPerClick"
        ? state.pointsPerClick - 1
        : state[keyName];
      const max   = 150;
      const cost1 = costFor(baseCost, owned);

      const item = document.createElement("div");
      item.className = "item";

      const left = document.createElement("div");
      left.innerHTML = `
        <div class="item-title">${title}</div>
        <div class="item-meta">${formatCompact(cost1)} 💰 • x${owned}</div>
      `;

      const controls = document.createElement("div");
      controls.className = "item-controls";
      controls.style.display = "flex";
      controls.style.gap = "4px";

      const btn1 = document.createElement("button");
      btn1.className = "item-btn";
      btn1.textContent = "1x";
      btn1.disabled = state.points < cost1 || owned >= max;

      const btn10 = document.createElement("button");
      btn10.className = "item-btn";
      btn10.textContent = "10x";
      btn10.disabled = btn1.disabled;

      const btnMax = document.createElement("button");
      btnMax.className = "item-btn";
      btnMax.textContent = "Max";
      btnMax.disabled = btn1.disabled;

      controls.append(btn1, btn10, btnMax);
      item.append(left, controls);
      container.appendChild(item);

      // Achat 1x
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

      // Achat 10x
      btn10.addEventListener("click", () => {
        let bought = 0;
        for (let i = 0; i < 10; i++) {
          const own2 = keyName === "pointsPerClick"
            ? state.pointsPerClick - 1
            : state[keyName];
          const c = costFor(baseCost, own2);
          if (state.points >= c && own2 < max) {
            state.points -= c;
            if (keyName === "pointsPerClick") state.pointsPerClick++;
            else state[keyName]++;
            bought++;
          } else break;
        }
        if (bought > 0) {
          save();
          renderMain();
          renderAmeliorations();
        }
      });

      // Achat Max
      btnMax.addEventListener("click", () => {
        let bought = 0;
        while (true) {
          const own2 = keyName === "pointsPerClick"
            ? state.pointsPerClick - 1
            : state[keyName];
          const c = costFor(baseCost, own2);
          if (state.points >= c && own2 < max) {
            state.points -= c;
            if (keyName === "pointsPerClick") state.pointsPerClick++;
            else state[keyName]++;
            bought++;
          } else break;
        }
        if (bought > 0) {
          save();
          renderMain();
          renderAmeliorations();
        }
      });
    }

    // Améliorations basiques
    addItem("🔁 Auto-Clicker",   "autoClickers",   10, els.upgradesList);
    addItem("⌑ Double Clicker",  "pointsPerClick", 20, els.upgradesList);

    // Machines
    for (const m of machinesData) {
      addItem(m.title, m.key, m.base, els.machinesList);
    }

    // Statistiques
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

  // ─── Événements ───
  els.openStoreBtn.addEventListener("click", () => {
    renderAmeliorations();
    openStore();
  });

  els.closeStoreBtn.addEventListener("click", () => {
    save();
    closeStore();
  });

  // Fermer en cliquant hors contenu
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeStore();
  });
}
