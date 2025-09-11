// rebrithSystem.js

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
  // --- CONSTANTES ET ÉTAT STOCKÉ ---
  const STORAGE_KEY = "rebirthCount";
  const BASE_COST = 10000;   // coût de base du 1er Rebirth
  let rebirthCount = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);

  // --- FONCTIONS UTILES ---
  function getNextCost() {
    // exponentiel +10% par rebirth : base * (1.1^rebirthCount)
    return Math.floor(BASE_COST * Math.pow(1.1, rebirthCount));
  }

  function getBoostFactor() {
    // +10% de boost cumulatif : 1.1^rebirthCount
    return Math.pow(1.1, rebirthCount);
  }

  // Création dynamique du bouton Rebirth (si pas dans ton HTML)
  let btn = els.rebirthBtn;
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "rebirthBtn";
    btn.className = "btn btn-warning";
    btn.textContent = "🌱 Rebirth";
    // on l’ajoute juste après le bouton reset pour pas toucher à l’HTML
    els.resetBtn.insertAdjacentElement("afterend", btn);
    els.rebirthBtn = btn;
  }

  // Création du bloc d’info Rebirth
  let info = document.getElementById("rebirthInfo");
  if (!info) {
    info = document.createElement("div");
    info.id = "rebirthInfo";
    info.style.fontSize = "0.9em";
    info.style.margin = "4px 0";
    info.style.color = "#8d8d8d";
    btn.insertAdjacentElement("afterend", info);
  }

  // Met à jour l’affichage du nb de Rebirths et du coût
  function updateInfo() {
    const cost = getNextCost();
    info.textContent = `Rebirths : ${rebirthCount} — Coût suivant : ${formatCompact(cost)}`;
    // on met à jour le label du bouton Tap pour afficher la puissance actuelle
    const boost = getBoostFactor();
    els.tapBtn.textContent = `👇 Tapper (+${(state.pointsPerClick * boost).toFixed(0)})`;
  }

  // Action de Rebirth
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

    // 1) payer le coût
    state.points -= cost;

    // 2) reset de toutes les machines et auto-clickers
    for (const k of keys) {
      if (k !== "points" && k !== "pointsPerClick") {
        // on remet à zéro autoClickers et machinesLevelX
        state[k] = 0;
      }
    }

    // 3) on divise l’argent restant par 2
    state.points = Math.floor(state.points / 2);

    // 4) on augmente le compteur et on stocke
    rebirthCount += 1;
    localStorage.setItem(STORAGE_KEY, String(rebirthCount));

    // 5) on boost les points par clic
    const boost = getBoostFactor();
    state.pointsPerClick = Math.max(1, Math.floor(state.pointsPerClick * boost));

    // 6) on sauve et on rafraîchit l’UI
    save();
    renderMain();
    renderStore();
    updateInfo();
  });

  // Initialisation de l’affichage
  updateInfo();
}
