// main.js
console.log("✅ main.js chargé !");

// ─── Clés et état (localStorage) ───
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
  "pointsPerClick"
];

const state = Object.fromEntries(keys.map(k => [k, 0]));
state.pointsPerClick = 1;
state.rebirths = 0;

function load() {
  for (const k of keys) {
    const raw = localStorage.getItem(k);
    if (raw != null && raw !== "") {
      const n = parseFloat(raw);
      state[k] = Number.isFinite(n) ? n : 0;
    }
  }
  if (state.pointsPerClick < 1) state.pointsPerClick = 1;
}

function save() {
  for (const k of keys) {
    localStorage.setItem(k, String(state[k]));
  }
}

function formatNumberTrimZeros(n) {
  const s = (Math.round(n * 100) / 100).toFixed(2);
  return s.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

function formatNumberFloat(n) {
  return parseFloat(n.toFixed(2)).toString();
}

function formatCompact(num) {
  if (!Number.isFinite(num)) return String(num);
  const abs = Math.abs(num);
  const units = [
    { value: 1e45, symbol: "QNT (10^45)" },
    { value: 1e42, symbol: "TT (10^42)" },
    { value: 1e39, symbol: "DD (10^39)" },
    { value: 1e36, symbol: "U (10^36)" },
    { value: 1e33, symbol: "D (10^33)" },
    { value: 1e30, symbol: "N (10^30)" },
    { value: 1e27, symbol: "OC (10^27)" },
    { value: 1e24, symbol: "SP (10^24)" },
    { value: 1e21, symbol: "SXT (10^21)" },
    { value: 1e18, symbol: "QT (10^18)" },
    { value: 1e15, symbol: "Q (10^15)" },
    { value: 1e12, symbol: "T (10^12)" },
    { value: 1e9,  symbol: "B (10^9)" },
    { value: 1e6,  symbol: "M (10^6)" },
    { value: 1e3,  symbol: "K (10^3)" }
  ];
  for (const u of units) {
    if (abs >= u.value) {
      return formatNumberTrimZeros(num / u.value) + " " + u.symbol;
    }
  }
  return formatNumberTrimZeros(num);
}

function formatPercentNoZeros(p) {
  const s = (Math.round(p * 100) / 100).toFixed(2);
  return s.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}


// ─── Boost Rebirth & CPS ───
function getRebirthBoostFactor() {
  return Math.pow(1.05, state.rebirths);
}

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

function totalAutoClicksPerSecond() {
  return totalAutoClicksPerSecondBase() * getRebirthBoostFactor();
}

function costFor(base, owned) {
  return Math.floor(base * Math.pow(1.15, owned));
}

// ─── Imports ───
import { machines }          from "./machines.js";
import { initUpgrades }      from "./upgrades.js";
import { initDevMenu }       from "./dev.js";
import { initRebirthSystem } from "./rebirthSystem.js";
import { initReset }         from "./reset.js";
import { initStats }         from "./stats.js";
import { animateClick, animatePassive } from "./animations.js";

// ─── Sélecteurs DOM ───
const els = {
  pointsValue:     document.getElementById("pointsValue"),
  autoClicksValue: document.getElementById("autoClicksValue"),
  tapBtn:          document.getElementById("tapBtn"),
  openStoreBtn:    document.getElementById("openStoreBtn"),
  shopBtn:         document.getElementById("shopBtn"),
  rebirthBtn:      document.getElementById("rebirthBtn"),
  versionText:     document.getElementById("versionText"),
  storeModal:      document.getElementById("storeModal"),
  devTrigger:      document.getElementById("devTrigger"),
  devModal:        document.getElementById("devModal"),
  closeDevBtn:     document.getElementById("closeDevBtn"),
  devBody:         document.getElementById("devBody"),
  resetBtn:        document.getElementById("resetBtn"),
  // upgrades.js attribuera: machinesList, upgradesList, statsList, closeStoreBtn
};

// ─── Modales ───
function openModal(modal) {
  modal.setAttribute("aria-hidden", "false");
}

function closeModal(modal) {
  modal.setAttribute("aria-hidden", "true");
}

// ─── Rendu principal ───
function renderMain() {
  els.pointsValue.textContent     = formatCompact(state.points);
  els.autoClicksValue.textContent = formatCompact(totalAutoClicksPerSecond());

  const realPerClick = state.pointsPerClick * getRebirthBoostFactor();
  els.tapBtn.textContent = `👇 Tapper (+${formatNumberTrimZeros(realPerClick)})`;

  els.versionText.textContent = `Toni’s Studios – v2.0`;
}

// ─── Initialisation ───
load();
renderMain();
save();

// Gains automatiques chaque seconde
setInterval(() => {
  const inc = totalAutoClicksPerSecond();
  if (inc > 0) {
    state.points += inc;
    save();
    renderMain();
    // on passe soit la liste des machines, soit le bouton
    animatePassive(inc, els.machinesList || els.tapBtn, formatNumberNoZeros);
  }
}, 1000);

// Clic manuel
els.tapBtn.addEventListener("click", () => {
  const realPerClick = state.pointsPerClick * getRebirthBoostFactor();
  state.points += realPerClick;
  save();
  renderMain();
  animateClick(realPerClick, els.tapBtn, formatNumberNoZeros);

  // Relance l’animation pulse
  els.tapBtn.classList.remove("pulse");
  void els.tapBtn.offsetWidth;
  els.tapBtn.classList.add("pulse");
});

// ─── Modules ───
initUpgrades({
  els,
  state,
  save,
  renderMain,
  openModal,
  closeModal,
  formatCompact,
  costFor,
  machines
});

initDevMenu({
  els,
  state,
  save,
  renderMain,
  renderStore: () => {},
  openModal,
  closeModal,
  machines
});

initRebirthSystem({
  els,
  state,
  keys,
  save,
  renderMain,
  renderStore: () => {},
  formatCompact,
  getRebirthBoostFactor,
  formatPercentNoZeros,
  formatNumberTrimZeros
});

initReset({
  els,
  state,
  keys,
  save,
  renderMain
});

initStats({
  els,
  state,
  formatCompact,
  totalAutoClicksPerSecond,
  getRebirthBoostFactor,
  formatPercentNoZeros,
  formatNumberNoZeros
});

// Sauvegarde avant fermeture
window.addEventListener("beforeunload", save);

// Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("./sw.js")
    .then(() => console.log("✅ Service Worker enregistré"))
    .catch(err => console.error("❌ Erreur Service Worker", err));
}
