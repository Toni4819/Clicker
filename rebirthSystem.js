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
  const BASE_COST = 10000;
  let rebirthCount = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);

  function getNextCost() {
    return Math.floor(BASE_COST * Math.pow(1.1, rebirthCount));
  }

  function getBoostFactor() {
    return Math.pow(1.1, rebirthCount);
  }

  // 🔁 Réutilise le bouton existant resetBtn
  const btn = els.resetBtn;
  btn.textContent = "🌱 Rebirth";
  btn.title = "Rebirth";
  btn.classList.add("btn", "btn-warning");

  // 📊 Bloc d’info Rebirth
  let info = document.getElementById("rebirthInfo");
  if (!info) {
    info = document.createElement("div");
    info.id = "rebirthInfo";
    info.style.fontSize = "0.9em";
    info.style.margin = "4px 0";
    info.style.color = "#8d8d8d";
    btn.insertAdjacentElement("afterend", info);
  }

  function updateInfo() {
    const cost = getNextCost();
    info.textContent = `Rebirths : ${rebirthCount} — Coût suivant : ${formatCompact(cost)}`;
    const boost = getBoostFactor();
    els.tapBtn.textContent = `👇 Tapper (+${(state.pointsPerClick * boost).toFixed(0)})`;
  }

  btn.addEventListener("click", () => {
    const cost = getNextCost();
    if (state.points < cost) {
      alert("Tu n’as pas assez de points pour rebirth !");
      return;
    }
    const ok = confirm(
      `Rebirth #${rebirthCount + 1} pour ${formatCompact(cost)} points ?\n` +
      `→ Toutes tes machines seront remises à zéro\n` +
      `→ Tu récupéreras 50% de ton argent restant après paiement\n` +
      `→ Tes gains par clic et par seconde seront boostés de 10% de façon cumulative`
    );
    if (!ok) return;

    state.points -= cost;

    for (const k of keys) {
      if (k !== "points" && k !== "pointsPerClick") {
        state[k] = 0;
      }
    }

    state.points = Math.floor(state.points / 2);
    rebirthCount += 1;
    localStorage.setItem(STORAGE_KEY, String(rebirthCount));

    const boost = getBoostFactor();
    state.pointsPerClick = Math.max(1, Math.floor(state.pointsPerClick * boost));

    save();
    renderMain();
    renderStore();
    updateInfo();
  });

  updateInfo();
}
