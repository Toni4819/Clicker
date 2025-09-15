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
  // rebirths est stocké à part par rebirthSystem (localStorage 'rebirthCount'),
  // mais on le garde en mémoire dans state.rebirths
];
const state = Object.fromEntries(keys.map(k => [k, 0]));
state.pointsPerClick = 1;
state.rebirths = 0; // synchro par rebirthSystem

function load() {
  for (const k of keys) {
    const raw = localStorage.getItem(k);
    if (raw !== null && raw !== "") {
      const n = parseFloat(raw); // autorise les décimaux (ex: 34.65)
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

// Format compact
const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 2
});
function formatCompact(num) {
  return compactFormatter.format(num);
}

// Utilitaires de format
function formatPercentNoZeros(p) {
  // Affiche max 2 décimales mais supprime les .00 inutiles
  const s = (Math.round(p * 100) / 100).toFixed(2);
  return s.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}
function formatNumberNoZeros(n) {
  // Jusqu’à 2 décimales, sans zéros inutiles
  const s = (Math.round(n * 100) / 100).toFixed(2);
  return s.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

// Boost Rebirth
function getRebirthBoostFactor() {
  // +5% cumulatif par rebirth
  return Math.pow(1.05, state.rebirths || 0);
}

// CPS “base” (sans boost)
function totalAutoClicksPerSecondBase() {
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

// CPS boosté (réel)
function totalAutoClicksPerSecond() {
  return totalAutoClicksPerSecondBase() * getRebirthBoostFactor();
}

function costFor(base, owned) {
  return Math.floor(base * Math.pow(1.15, owned));
}

// Import des modules
import { machines } from "./machines.js";
import { initDevMenu } from "./dev.js";
import { initUpgrades } from "./upgrades.js";
import { initRebirthSystem } from "./rebirthSystem.js";
import { initReset } from "./reset.js";
import { initStats } from "./stats.js";

// Sélecteurs DOM
const els = {
  pointsValue:   document.getElementById("pointsValue"),
  autoClicksValue: document.getElementById("autoClicksValue"),
  tapBtn:        document.getElementById("tapBtn"),
  openStoreBtn:  document.getElementById("openStoreBtn"),
  rebirthBtn:    document.getElementById("rebirthBtn"),
  versionText:   document.getElementById("versionText"),
  storeModal:    document.getElementById("storeModal"),
  closeStoreBtn: document.getElementById("closeStoreBtn"),
  upgradesList:  document.getElementById("upgradesList"),
  machinesList:  document.getElementById("machinesList"),
  statsList:     document.getElementById("statsList"),
  devTrigger:    document.getElementById("devTrigger"),
  devModal:      document.getElementById("devModal"),
  closeDevBtn:   document.getElementById("closeDevBtn"),
  devBody:       document.getElementById("devBody"),
  resetBtn: document.getElementById("resetBtn"),
};

// Rendu écran principal
function renderMain() {
  els.pointsValue.textContent = formatCompact(state.points);
  els.autoClicksValue.textContent = formatCompact(totalAutoClicksPerSecond());
  // Affiche le gain par clic réel (boosté)
  const realPerClick = state.pointsPerClick * getRebirthBoostFactor();
  els.tapBtn.textContent = `👇 Tapper (+${formatNumberNoZeros(realPerClick)})`;
  els.versionText.textContent = `Toni’s Studios – v1.1`;
}

// Animation “+N”
function animateClick(amount) {
  const span = document.createElement("span");
  span.textContent = `+${formatNumberNoZeros(amount)}`;
  span.classList.add("click-burst");

  const rect = els.tapBtn.getBoundingClientRect();
  span.style.left = `${rect.left + rect.width / 2}px`;
  span.style.top  = `${rect.top - 10}px`;

  document.body.appendChild(span);
  span.addEventListener("animationend", () => span.remove());
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
  const inc = totalAutoClicksPerSecond(); // boosté
  if (inc > 0) {
    state.points += inc;
    save();
    renderMain();
  }
}, 1000);

// Actions principales
els.tapBtn.addEventListener("click", () => {
  const realPerClick = state.pointsPerClick * getRebirthBoostFactor(); // ex: 33 -> 34.65 au lvl1
  state.points += realPerClick;
  save();
  renderMain();

  // +N animé
  animateClick(realPerClick);

  // Relancer l’animation “pulse” même si elle est déjà en cours
  els.tapBtn.classList.remove("pulse");
  void els.tapBtn.offsetWidth; // reset animation
  els.tapBtn.classList.add("pulse");
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

// Rebirth system (nouvelle version UI + logique boost global)
initRebirthSystem({
  els,
  state,
  keys,
  save,
  renderMain,
  renderStore: () => {},
  formatCompact,
  getRebirthBoostFactor,         // on expose le facteur au module si besoin
  formatPercentNoZeros,
  formatNumberNoZeros
});

initReset({ els, state, keys, save, renderMain });

// Stats (quick + boutique)
import { initStats } from "./stats.js";
initStats({
  els,
  state,
  formatCompact,
  totalAutoClicksPerSecond,  // boosté
  getRebirthBoostFactor,
  formatPercentNoZeros,
  formatNumberNoZeros
});

// Sauvegarde à la fermeture
window.addEventListener("beforeunload", save);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("./sw.js")
    .then(() => console.log("✅ Service Worker enregistré"))
    .catch((err) => console.error("❌ Erreur Service Worker", err));
}
