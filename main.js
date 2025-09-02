// État et persistance (équivalent UserDefaults -> localStorage)
const keys = [
  "points",
  "autoClickers",
  "machinesLevel1",
  "machinesLevel2",
  "machinesLevel3",
  "machinesLevel4",
  "machinesLevel5",
  "machinesLevel6",
  "machinesLevel7",
  "machinesLevel8",
  "machinesLevel9",
  "machinesLevel10",
  "pointsPerClick",
];

const state = Object.fromEntries(keys.map(k => [k, 0]));
state.pointsPerClick = 1; // valeur par défaut si manquante

function load() {
  for (const k of keys) {
    const raw = localStorage.getItem(k);
    if (raw !== null && raw !== "") {
      const n = parseInt(raw, 10);
      state[k] = Number.isFinite(n) ? n : 0;
    }
  }
  if (!state.pointsPerClick || state.pointsPerClick < 1) state.pointsPerClick = 1;
}

function save() {
  for (const k of keys) localStorage.setItem(k, String(state[k]));
}

// Format compact comme la func Swift formatNumber (k/M/B/T, 1 décimale max)
const nf1 = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 1 });
function formatCompact(n) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000_000) return `${nf1.format(n / 1_000_000_000_000)}T`;
  if (abs >= 1_000_000_000)     return `${nf1.format(n / 1_000_000_000)}B`;
  if (abs >= 1_000_000)         return `${nf1.format(n / 1_000_000)}M`;
  if (abs >= 1_000)             return `${nf1.format(n / 1_000)}k`;
  return String(n);
}

function totalAutoClicksPerSecond() {
  return (
    state.autoClickers +
    state.machinesLevel1 * 5 +
    state.machinesLevel2 * 10 +
    state.machinesLevel3 * 25 +
    state.machinesLevel4 * 50 +
    state.machinesLevel5 * 100 +
    state.machinesLevel6 * 250 +
    state.machinesLevel7 * 500 +
    state.machinesLevel8 * 1000 +
    state.machinesLevel9 * 2500 +
    state.machinesLevel10 * 5000
  );
}

function costFor(base, owned) {
  // Swift: Int(Double(base) * pow(1.15, Double(owned))) -> troncature
  return Math.floor(base * Math.pow(1.15, owned));
}

// Mapping machines (titre + coût de base + propriété)
const machines = [
  { level: 1,  title: "Machine N1 (+5/s)",    base: 50,       key: "machinesLevel1"  },
  { level: 2,  title: "Machine N2 (+10/s)",   base: 100,      key: "machinesLevel2"  },
  { level: 3,  title: "Machine N3 (+25/s)",   base: 250,      key: "machinesLevel3"  },
  { level: 4,  title: "Machine N4 (+50/s)",   base: 500,      key: "machinesLevel4"  },
  { level: 5,  title: "Machine N5 (+100/s)",  base: 1_000,    key: "machinesLevel5"  },
  { level: 6,  title: "Machine N6 (+250/s)",  base: 10_000,   key: "machinesLevel6"  },
  { level: 7,  title: "Machine N7 (+500/s)",  base: 50_000,   key: "machinesLevel7"  },
  { level: 8,  title: "Machine N8 (+1000/s)", base: 100_000,  key: "machinesLevel8"  },
  { level: 9,  title: "Machine N9 (+2500/s)", base: 500_000,  key: "machinesLevel9"  },
  { level: 10, title: "Machine N10 (+5000/s)",base: 1_000_000,key: "machinesLevel10" },
];

// DOM
const els = {
  pointsValue: document.getElementById("pointsValue"),
  autoClicksValue: document.getElementById("autoClicksValue"),
  tapBtn: document.getElementById("tapBtn"),
  openStoreBtn: document.getElementById("openStoreBtn"),
  resetBtn: document.getElementById("resetBtn"),
  versionText: document.getElementById("versionText"),
  storeModal: document.getElementById("storeModal"),
  closeStoreBtn: document.getElementById("closeStoreBtn"),
  upgradesList: document.getElementById("upgradesList"),
  machinesList: document.getElementById("machinesList"),
  statsList: document.getElementById("statsList"),
  devTrigger: document.getElementById("devTrigger"),
  devModal: document.getElementById("devModal"),
  closeDevBtn: document.getElementById("closeDevBtn"),
  devBody: document.getElementById("devBody"),
};

function renderMain() {
  els.pointsValue.textContent = formatCompact(state.points);
  els.autoClicksValue.textContent = formatCompact(totalAutoClicksPerSecond());
  els.tapBtn.textContent = `👆 Tapper (+${state.pointsPerClick})`;
  els.versionText.textContent = `Toni’s Studios – v1.1`;
}

function renderStore() {
  // Améliorations
  els.upgradesList.innerHTML = "";
  // Auto-Clicker (max 150)
  {
    const owned = state.autoClickers;
    const cost = costFor(10, owned);
    const item = document.createElement("div");
    item.className = "item";
    const left = document.createElement("div");
    left.innerHTML = `<div class="item-title">🔁 Auto-Clicker</div>
                      <div class="item-meta">${formatCompact(cost)} 💰 • x${owned}</div>`;
    const btn = document.createElement("button");
    btn.className = "item-btn";
    btn.textContent = "Acheter";
    if (owned >= 150) btn.disabled = true;
    btn.addEventListener("click", () => {
      if (state.points >= cost && state.autoClickers < 150) {
        state.points -= cost;
        state.autoClickers += 1;
        save(); renderMain(); renderStore();
      }
    });
    item.append(left, btn);
    els.upgradesList.appendChild(item);
  }
  // Double Clicker (augmente pointsPerClick, sans limite 150)
  {
    const owned = state.pointsPerClick - 1; // comme Swift
    const cost = costFor(20, owned);
    const item = document.createElement("div");
    item.className = "item";
    const left = document.createElement("div");
    left.innerHTML = `<div class="item-title">🖱️ Double Clicker</div>
                      <div class="item-meta">${formatCompact(cost)} 💰 • x${owned}</div>`;
    const btn = document.createElement("button");
    btn.className = "item-btn";
    btn.textContent = "Acheter";
    btn.addEventListener("click", () => {
      if (state.points >= cost) {
        state.points -= cost;
        state.pointsPerClick += 1;
        save(); renderMain(); renderStore();
      }
    });
    item.append(left, btn);
    els.upgradesList.appendChild(item);
  }

  // Machines 1..10 (max 150)
  els.machinesList.innerHTML = "";
  for (const m of machines) {
    const owned = state[m.key];
    const cost = costFor(m.base, owned);
    const item = document.createElement("div");
    item.className = "item";
    const left = document.createElement("div");
    left.innerHTML = `<div class="item-title">${m.title}</div>
                      <div class="item-meta">${formatCompact(cost)} 💰 • x${owned}</div>`;
    const btn = document.createElement("button");
    btn.className = "item-btn";
    btn.textContent = "Acheter";
    if (owned >= 150) btn.disabled = true;
    btn.addEventListener("click", () => {
      if (state.points >= cost && state[m.key] < 150) {
        state.points -= cost;
        state[m.key] += 1;
        save(); renderMain(); renderStore();
      }
    });
    item.append(left, btn);
    els.machinesList.appendChild(item);
  }

  // Statistiques
  els.statsList.innerHTML = "";
  addStat("Auto-clickers", state.autoClickers);
  addStat("Points/clic", state.pointsPerClick);
  for (const m of machines) addStat(`Machines N${m.level}`, state[m.key]);

  function addStat(label, value) {
    const row = document.createElement("div");
    row.className = "stat";
    row.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    els.statsList.appendChild(row);
  }
}

function openModal(modal) {
  modal.setAttribute("aria-hidden", "false");
}
function closeModal(modal) {
  modal.setAttribute("aria-hidden", "true");
}

/* Dev menu */
const base64Code = "MzRTYXVjZTEy"; // "34Sauce12"
let devUnlocked = false;

function renderDev() {
  if (!devUnlocked) {
    els.devBody.innerHTML = `
      <div class="section">
        <h3 class="section-title">🔑 Entrer le code développeur</h3>
        <div class="list">
          <input id="devCodeInput" type="password" placeholder="Code" />
          <div>
            <button id="devValidateBtn" class="btn btn-secondary">Valider</button>
          </div>
          <div>
            <button id="devCancelBtn" class="item-btn">Annuler</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById("devValidateBtn").addEventListener("click", () => {
      const code = document.getElementById("devCodeInput").value || "";
      try {
        if (btoa(code) === base64Code) {
          devUnlocked = true;
          renderDev();
        } else {
          // reset champ si mauvais code
          document.getElementById("devCodeInput").value = "";
        }
      } catch {
        document.getElementById("devCodeInput").value = "";
      }
    });
    document.getElementById("devCancelBtn").addEventListener("click", () => {
      devUnlocked = false;
      closeModal(els.devModal);
    });
  } else {
    els.devBody.innerHTML = `
      <div class="section">
        <h3 class="section-title">Mode Dev</h3>
        <div class="list">
          <div class="item" style="justify-content:flex-start; gap:12px;">
            <label for="pointsInput" class="item-title">Définir les points:</label>
            <input id="pointsInput" type="number" min="0" step="1" value="${state.points}" />
            <button id="setPointsBtn" class="item-btn">Appliquer</button>
          </div>
          <div class="item" style="justify-content:space-between;">
            <div class="item-title">Ajouter rapidement</div>
            <button id="plus1kBtn" class="item-btn">+1 000</button>
          </div>
          <div>
            <button id="devExitBtn" class="btn" style="background:#2b2f3a;color:#fff;">🚪 Quitter le Mode Dev</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById("setPointsBtn").addEventListener("click", () => {
      const v = parseInt(document.getElementById("pointsInput").value, 10);
      if (Number.isFinite(v) && v >= 0) {
        state.points = v; save(); renderMain(); renderStore();
      }
    });
    document.getElementById("plus1kBtn").addEventListener("click", () => {
      state.points += 1000; save(); renderMain(); renderStore();
    });
    document.getElementById("devExitBtn").addEventListener("click", () => {
      devUnlocked = false;
      closeModal(els.devModal);
    });
  }
}

// Init
load();
renderMain();
save();

// Tick automatique (1s)
setInterval(() => {
  const inc = totalAutoClicksPerSecond();
  if (inc > 0) {
    state.points += inc;
    save();
    renderMain();
  }
}, 1000);

// Actions principales
els.tapBtn.addEventListener("click", () => {
  state.points += state.pointsPerClick;
  save();
  renderMain();
});

els.openStoreBtn.addEventListener("click", () => {
  renderStore();
  openModal(els.storeModal);
});

els.closeStoreBtn.addEventListener("click", () => {
  save();
  closeModal(els.storeModal);
});

els.resetBtn.addEventListener("click", () => {
  const ok = confirm("Réinitialiser le jeu ?\nCette action supprimera toute votre progression.");
  if (!ok) return;

  state.points = 0;
  state.autoClickers = 0;
  state.machinesLevel1 = 0;
  state.machinesLevel2 = 0;
  state.machinesLevel3 = 0;
  state.machinesLevel4 = 0;
  state.machinesLevel5 = 0;
  state.machinesLevel6 = 0;
  state.machinesLevel7 = 0;
  state.machinesLevel8 = 0;
  state.machinesLevel9 = 0;
  state.machinesLevel10 = 0;
  state.pointsPerClick = 1;

  save();
  renderMain();
  if (els.storeModal.getAttribute("aria-hidden") === "false") renderStore();
});

// Dev menu
els.devTrigger.addEventListener("click", () => {
  devUnlocked = false;
  renderDev();
  openModal(els.devModal);
});
els.closeDevBtn.addEventListener("click", () => closeModal(els.devModal));

// Sauvegarder à la fermeture
window.addEventListener("beforeunload", save);
