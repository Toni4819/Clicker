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

  // Charger le compteur depuis localStorage dans state
  state.rebirths = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);

  // Helpers
  const getNextCost    = () => Math.floor(BASE_COST * Math.pow(BOOST_RATE, state.rebirths));
  const getBoostFactor = () => Math.pow(BOOST_RATE, state.rebirths);

  // Mise à jour du bouton Tap uniquement
  function updateInfo() {
    const boost = getBoostFactor();
    els.tapBtn.textContent = `👇 Tapper (+${Math.floor(state.pointsPerClick * boost)})`;
  }

  // Gestion du clic Rebirth
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

    // Payer le coût
    state.points -= cost;

    // Reset machines / auto-clickers
    keys.forEach(k => {
      if (k !== "points" && k !== "pointsPerClick") {
        state[k] = 0;
      }
    });

    // Récupérer 50% de l’argent restant
    state.points = Math.floor(state.points / 2);

    // Incrémenter et stocker le compteur
    state.rebirths += 1;
    localStorage.setItem(STORAGE_KEY, String(state.rebirths));

    // Appliquer le boost de clic
    state.pointsPerClick *= BOOST_RATE;

    // Sauvegarde et UI
    save();
    renderMain();
    renderStore();
    updateInfo();
  });

  // Initial UI refresh
  updateInfo();
}
