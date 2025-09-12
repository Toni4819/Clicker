// État et persistance (localStorage)
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
state.pointsPerClick = 1;

function load() {
  for (const k of keys) {
    const raw = localStorage.getItem(k);
    if (raw !== null && raw !== "") {
      const n = parseInt(raw, 10);
      state[k] = Number.isFinite(n) ? n : 0;
    }
  }
  if (!state.pointsPerClick || state.pointsPerClick < 1) {
    state.pointsPerClick = 1;
  }
}

function save() {
  for (const k of keys) {
    localStorage.setItem(k, String(state[k]));
  }
}

function formatCompact(n) {
  const abs = Math.abs(n);
  const nf1 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

  if (abs >= 1e18) return nf1.format(n / 1e18) + 'QT';
  if (abs >= 1e15) return nf1.format(n / 1e15) + 'Q';
  if (abs >= 1e12) return nf1.format(n / 1e12) + 'T';
  if (abs >= 1e9)  return nf1.format(n / 1e9) + 'B';
  if (abs >= 1e6)  return nf1.format(n / 1e6) + 'M';
  if (abs >= 1e3)  return nf1.format(n / 1e3) + 'k';

  return nf1.format(n);
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
  return Math.floor(base * Math.pow(1.15, owned));
}

// Import des modules
import { machines } from "./machines.js";
import { initDevMenu } from "./dev.js";
import { initUpgrades } from "./upgrades.js";
import { initRebirthSystem } from "./rebirthSystem.js";


// Sélecteurs DOM
const els = {
  pointsValue: document.getElementById("pointsValue"),
  autoClicksValue: document.getElementById("autoClicksValue"),
  tapBtn: document.getElementById("tapBtn"),
  openStoreBtn: document.getElementById("openStoreBtn"),
  rebirthBtn: document.getElementById("rebirthBtn"),
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

// Rendu écran principal
function renderMain() {
  els.pointsValue.textContent = formatCompact(state.points);
  els.autoClicksValue.textContent = formatCompact(totalAutoClicksPerSecond());
  els.tapBtn.textContent = `👇 Tapper (+${state.pointsPerClick})`;
  els.versionText.textContent = `Toni’s Studios – v1.1`;
}

// Modales
function openModal(modal) {
  modal.setAttribute("aria-hidden", "false");
}
function closeModal(modal) {
  modal.setAttribute("aria-hidden", "true");
}

// Initialisation
load();
renderMain();
save();

// Tick auto (1s)
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

// Extraction du menu “Améliorations”
initUpgrades({
  els,
  state,
  save,
  renderMain,
  openModal,
  closeModal,
  formatCompact,
  costFor,
  machines,
});

// Extraction du menu Dev
initDevMenu({
  els,
  state,
  save,
  renderMain,
  renderStore: () => {},
  openModal,
  closeModal,
});

initRebirthSystem({
  els,
  state,
  keys,
  save,
  renderMain,
  renderStore: () => {},
  formatCompact
});


// Sauvegarde à la fermeture
window.addEventListener("beforeunload", save);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("./sw.js")
    .then(() => console.log("✅ Service Worker enregistré"))
    .catch((err) => console.error("❌ Erreur Service Worker", err));
}
