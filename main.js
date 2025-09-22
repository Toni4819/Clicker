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
  "machinesLevel11",
  "machinesLevel12",
  "machinesLevel13",
  "machinesLevel14",
  "machinesLevel15",
  "machinesLevel16",
  "machinesLevel17",
  "machinesLevel18",
  "machinesLevel19",
  "machinesLevel20",
  "pointsPerClick",
  "shopBoost"
];


const state = Object.fromEntries(keys.map(k => [k, 0]));
state.pointsPerClick = 1;
state.rebirths = 0;
state.shopBoost = 1;
state.tempShopBoostFactor = 1;

function load() {
  for (const k of keys) {
    const raw = localStorage.getItem(k);
    if (raw != null && raw !== "") {
      const n = parseFloat(raw);
      state[k] = Number.isFinite(n) ? n : 0;
    }
  }

  // Sécuriser les valeurs minimales
  if (state.pointsPerClick < 1) state.pointsPerClick = 1;
  if (state.shopBoost < 1) state.shopBoost = 1;
  if (!Number.isFinite(state.points)) state.points = 0;
}

function save() {
  for (const k of keys) {
    localStorage.setItem(k, String(state[k]));
  }
}

function getShopBoostFactor() {
  const perm = state.shopBoost || 1;
  const temp = state.tempShopBoostFactor || 1;
  return perm * temp;
}

function getRebirthBoostFactor() {
  return Math.pow(1.10, state.rebirths);
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
    state.machinesLevel10 * 5000 +
    state.machinesLevel11 * 50000 +
    state.machinesLevel12 * 125000 +
    state.machinesLevel13 * 300000 +
    state.machinesLevel14 * 750000 +
    state.machinesLevel15 * 2000000 +
    state.machinesLevel16 * 5000000 +
    state.machinesLevel17 * 12500000 +
    state.machinesLevel18 * 30000000 +
    state.machinesLevel19 * 75000000 +
    state.machinesLevel20 * 200000000
  );
}



function totalAutoClicksPerSecond() {
  return (
    totalAutoClicksPerSecondBase() *
    getRebirthBoostFactor() *
    getShopBoostFactor()
  );
}

function costFor(base, owned) {
  return Math.floor(base * Math.pow(1.25, owned));
}

// ─── Imports ───
import { formatCompact, toggleFormatMode }              from "./modules/formatters.js";
import { machines }                   from "./menus/machines.js";
import { initUpgrades }               from "./menus/upgrades.js";
import { initDevMenu }                from "./menus/dev.js";
import { initRebirthSystem }          from "./rebirthSystem.js";
import { initStats }                  from "./modules/stats.js";
import { animateClick, animatePassive } from "./modules/animations.js";
import { initShop }                   from "./menus/shop.js";
import { initSettings, openSettings } from "./menus/settings.js";
import { initCoinDrop } from "./modules/initCoinDrop.js";

// ─── Sélecteurs DOM ───
const els = {
  pointsValue:     document.getElementById("pointsValue"),
  autoClicksValue: document.getElementById("autoClicksValue"),
  tapBtn:          document.getElementById("tapBtn"),
  upgradesBtn:     document.getElementById("upgradesBtn"),
  shopBtn:         document.getElementById("shopBtn"),
  rebirthBtn:      document.getElementById("rebirthBtn"),
  versionText:     document.getElementById("versionText"),
  storeModal:      document.getElementById("storeModal"),
  shopModal:       document.getElementById("shopModal"),
  devTrigger:      document.getElementById("devTrigger"),
  devModal:        document.getElementById("devModal"),
  closeDevBtn:     document.getElementById("closeDevBtn"),
  devBody:         document.getElementById("devBody"),
  boostValue:      document.getElementById("boostValue"),
  settingsBtn:     document.getElementById("settingsBtn"),
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

  const realPerClick =
    state.pointsPerClick *
    getRebirthBoostFactor() *
    getShopBoostFactor();

  els.tapBtn.textContent = `👇 Tapper (+${realPerClick.toFixed(2)})`;
  els.versionText.textContent = `Toni’s Studios – v2.5`;

  if (els.boostValue) {
    const totalBoost = getRebirthBoostFactor() * getShopBoostFactor();
    els.boostValue.textContent = `x${totalBoost.toFixed(2)}`;
  }
}

// switch formatter
els.pointsValue.closest("h1").addEventListener("click", () => {
  toggleFormatMode();
  renderMain();
});

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

    // Animation passive avec format simple
    const formattedInc = inc.toFixed(2);
    animatePassive(inc, els.machinesList || els.tapBtn, () => formattedInc);
  }
}, 1000);

// Clic manuel
els.tapBtn.addEventListener("click", () => {
  const realPerClick =
    state.pointsPerClick *
    getRebirthBoostFactor() *
    getShopBoostFactor();

  state.points += realPerClick;
  save();
  renderMain();

  // Animation : du bouton vers le compteur de points
  animateClick(realPerClick, els.tapBtn, els.pointsValue);

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
  getRebirthBoostFactor
});


initStats({
  els,
  state,
  formatCompact,
  totalAutoClicksPerSecond,
  getRebirthBoostFactor,
  getShopBoostFactor
});

initShop({
  els,
  state,
  save,
  renderMain,
  openModal,
  closeModal,
  formatCompact
});
initSettings({
  state,
  save,
  renderMain
});

initCoinDrop({ els, state, save, renderMain });

// Sauvegarde avant fermeture
window.addEventListener("beforeunload", save);

// Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("./sw.js")
    .then(() => console.log("✅ Service Worker enregistré"))
    .catch(err => console.error("❌ Erreur Service Worker", err));
}
