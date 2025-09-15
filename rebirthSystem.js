// rebirthSystem.js

/**
 * Système de “Rebirth” complet :
 * - Chaque Rebirth reset les machines à zéro
 * - Coût de Rebirth exponentiel (+10% par Rebirth)
 * - À chaque Rebirth, tes gains par clic sont multipliés par +10% (cumulatif)
 * - À chaque Rebirth, tu récupères 50% de ton argent avant reset
 * - Stockage de la progression de Rebirth dans localStorage
 *
 * @param {Object} deps
 * @param {Object} deps.els            — tes sélecteurs DOM (resetBtn, tapBtn, etc.)
 * @param {Object} deps.state          — ton état global (points, autoClickers, machinesLevelX, pointsPerClick…)
 * @param {Array<string>} deps.keys    — la liste des clés persistées (pour reset des machines)
 * @param {Function} deps.save         — fonction pour sauver dans localStorage
 * @param {Function} deps.renderMain   — fonction pour rafraîchir l’affichage principal
 * @param {Function} deps.renderStore  — fonction pour rafraîchir la boutique (facultatif)
 * @param {Function} deps.formatCompact— formatage compact de tes nombres
 */
// rebirthSystem.js

export function initRebirthSystem({
  els,
  state,
  keys,
  save,
  renderMain,
  renderStore = () => {},
  formatCompact,
}) {
  const STORAGE_KEY = "rebirthCount";
  const BASE_COST   = 10_000;
  const BOOST_RATE  = 1.1;

  // 1) Charger le compteur depuis localStorage dans state
  state.rebirths = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);

  // 2) Helpers de coût et de boost
  const getNextCost    = () => Math.floor(BASE_COST * Math.pow(BOOST_RATE, state.rebirths));
  const getBoostFactor = () => Math.pow(BOOST_RATE, state.rebirths);

  // 3) Créer / récupérer l’info-bar si nécessaire
  let info = document.getElementById("rebirthInfo");
  if (!info) {
    info = document.createElement("div");
    info.id = "rebirthInfo";
    info.style.cssText = "font-size:0.9em; margin:4px 0; color:#8d8d8d;";
    els.rebirthBtn.insertAdjacentElement("afterend", info);
  }

  // 4) Mise à jour de l’UI
  function updateInfo() {
    const cost  = getNextCost();
    const boost = getBoostFactor();
    info.textContent      = `Rebirths : ${state.rebirths} — Coût suivant : ${formatCompact(cost)}`;
    els.tapBtn.textContent = `👇 Tapper (+${Math.floor(state.pointsPerClick * boost)})`;
  }

  // 5) Gestion du clic Rebirth
  els.rebirthBtn.addEventListener("click", () => {
    const cost = getNextCost();
    if (state.points < cost) {
      alert("Tu n’as pas assez de points pour rebirth !");
      return;
    }

    const ok = confirm(
      `Rebirth #${state.rebirths + 1} pour ${formatCompact(cost)} points ?\n` +
      `→ Toutes tes machines seront remises à zéro\n` +
      `→ Tu récupéreras 50% de ton argent après paiement\n` +
      `→ Tes gains par clic seront boostés de 10% (cumulatif)`
    );
    if (!ok) return;

    // 5.1) Payer le coût
    state.points -= cost;

    // 5.2) Reset machines / auto-clickers
    keys.forEach(k => {
      if (k !== "points" && k !== "pointsPerClick") {
        state[k] = 0;
      }
    });

    // 5.3) Récupérer 50% de l’argent restant
    state.points = Math.floor(state.points / 2);

    // 5.4) Incrémenter et stocker le compteur
    state.rebirths += 1;
    localStorage.setItem(STORAGE_KEY, String(state.rebirths));

    // 5.5) Appliquer le boost de clic
    state.pointsPerClick *= BOOST_RATE;

    // 5.6) Sauvegarde et UI
    save();
    renderMain();
    renderStore();
    updateInfo();
  });

  // 6) Initial UI refresh
  updateInfo();
}
