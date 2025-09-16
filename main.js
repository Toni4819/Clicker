// ─── État et persistance (localStorage) ───
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
state.rebirths      = 0;  // synchronisé par rebirthSystem

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

// ─── Formatage ───
const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 2
});
function formatCompact(num) {
  return compactFormatter.format(num);
}
function formatPercentNoZeros(p) {
  const s = (Math.round(p * 100) / 100).toFixed(2);
  return s.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}
function formatNumberNoZeros(n) {
  const s = (Math.round(n * 100) / 100).toFixed(2);
  return s.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

// ─── Boost global Rebirth + CPS ───
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

// ─── Import des modules ───
import { machines }             from "./machines.js";
import { initDevMenu }          from "./dev.js";
import { initUpgrades }         from "./upgrades.js";
import { initRebirthSystem }    from "./rebirthSystem.js";
import { initReset }            from "./reset.js";
import { initStats }            from "./stats.js";  // <-- UNE SEULE IMPORTATION

// ─── Sélecteurs DOM ───
const els = {
  pointsValue:    document.getElementById("pointsValue"),
  autoClicksValue:document.getElementById("autoClicksValue"),
  tapBtn:         document.getElementById("tapBtn"),
  openStoreBtn:   document.getElementById("openStoreBtn"),
  rebirthBtn:     document.getElementById("rebirthBtn"),
  versionText:    document.getElementById("versionText"),
  storeModal:     document.getElementById("storeModal"),
  closeStoreBtn:  document.getElementById("closeStoreBtn"),
  upgradesList:   document.getElementById("upgradesList"),
  machinesList:   document.getElementById("machinesList"),
  statsList:      document.getElementById("statsList"),
  devTrigger:     document.getElementById("devTrigger"),
  devModal:       document.getElementById("devModal"),
  closeDevBtn:    document.getElementById("closeDevBtn"),
  devBody:        document.getElementById("devBody"),
  resetBtn:       document.getElementById("resetBtn"),
};

// ─── Rendu de l’écran principal ───
function renderMain() {
  els.pointsValue.textContent     = formatCompact(state.points);
  els.autoClicksValue.textContent = formatCompact(totalAutoClicksPerSecond());

  const realPerClick = state.pointsPerClick * getRebirthBoostFactor();
  els.tapBtn.textContent          = `👇 Tapper (+${formatNumberNoZeros(realPerClick)})`;

}

// ─── Animation “+N” ───
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

// ─── Modales ───
function openModal(modal) {
  modal.setAttribute("aria-hidden", "false");
}
function closeModal(modal) {
  modal.setAttribute("aria-hidden", "true");
}

// ─── Initialisation ───
load();
renderMain();
save();

setInterval(() => {
  const inc = totalAutoClicksPerSecond();
  if (inc > 0) {
    state.points += inc;
    save();
    renderMain();
  }
}, 1000);

// ─── Clic principal ───
els.tapBtn.addEventListener("click", () => {
  const realPerClick = state.pointsPerClick * getRebirthBoostFactor();
  state.points += realPerClick;
  save();
  renderMain();
  animateClick(realPerClick);

  els.tapBtn.classList.remove("pulse");
  void els.tapBtn.offsetWidth;
  els.tapBtn.classList.add("pulse");
});

// ─── Modules ───
initUpgrades({
  els, state, save, renderMain,
  openModal, closeModal,
  formatCompact, costFor, machines,
});

initDevMenu({
  els, state, save, renderMain,
  renderStore: () => {}, openModal, closeModal,
});

initRebirthSystem({
  els, state, keys, save, renderMain,
  renderStore: () => {}, formatCompact,
  getRebirthBoostFactor, formatPercentNoZeros, formatNumberNoZeros
});

initReset({ els, state, keys, save, renderMain });

initStats({  // <-- UN SEUL APPEL À initStats
  els, state, formatCompact,
  totalAutoClicksPerSecond,
  getRebirthBoostFactor,
  formatPercentNoZeros,
  formatNumberNoZeros
});

// Sauvegarde avant fermeture
window.addEventListener("beforeunload", save);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("./sw.js")
    .then(() => console.log("✅ Service Worker enregistré"))
    .catch(err => console.error("❌ Erreur SW", err));
}
