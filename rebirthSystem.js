// rebirthSystem.js — Rebirth v2 (UI + progression + +25% coût, +5% boost global)
/**
 * - Reset des machines à zéro à chaque Rebirth
 * - Coût exponentiel (+25% par Rebirth)
 * - Boost permanent global des gains : +5% par Rebirth (cumulatif)
 * - On conserve 50% des points restants après paiement
 * - UI dédiée avec barre de progression vers le prochain Rebirth
 */
export function initRebirthSystem({
  els,
  state,
  keys,
  save,
  renderMain,
  renderStore = () => {},
  formatCompact,
  getRebirthBoostFactor,
  formatPercentNoZeros,
  formatNumberTrimZeros
}) {
  const STORAGE_KEY = "rebirthCount";
  const BASE_COST   = 10_000;
  const COST_RATE   = 1.25; // +25% par rebirth
  const BOOST_RATE  = 1.05; // +5% par rebirth (cumulatif)

  // Charger compteur
  state.rebirths = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);

  // Helpers
  const getCostAt = (n) => Math.floor(BASE_COST * Math.pow(COST_RATE, n));
  const getPrevCost = () => (state.rebirths > 0 ? getCostAt(state.rebirths - 1) : 0);
  const getNextCost = () => getCostAt(state.rebirths);
  const getTotalBoostFactor = (n = state.rebirths) => Math.pow(BOOST_RATE, n);
  const getTotalBoostPercent = (n = state.rebirths) => (getTotalBoostFactor(n) - 1) * 100;

  // UI: créer une modale Rebirth si absente
  let modal = document.getElementById("rebirthModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "rebirthModal";
    modal.setAttribute("aria-hidden", "true");
    modal.style.cssText = `
      position: fixed; inset: 0; display: grid; place-items: center;
      background: rgba(0,0,0,0.5); z-index: 1000; 
      opacity: 0; pointer-events: none; transition: opacity .15s ease;
    `;
    modal.innerHTML = `
      <div class="rebirth-card" role="dialog" aria-labelledby="rebirthTitle" style="
        width: min(520px, 92vw);
        background: var(--panel, #141414);
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 12px;
        box-shadow: 0 6px 30px rgba(0,0,0,.35);
        overflow: hidden;
      ">
        <header style="display:flex; align-items:center; justify-content:space-between; padding:12px 14px; background: rgba(255,255,255,.04);">
          <h2 id="rebirthTitle" style="margin:0; font-size:1.05rem;">🌱 Rebirth</h2>
          <button id="rbCloseBtn" aria-label="Fermer" style="
            background:none; border:none; color:#bbb; font-size:1.1rem; cursor:pointer; padding:6px;
          ">✕</button>
        </header>
        <div style="padding:14px; display:grid; gap:12px;">
          <div id="rbTopLine" style="font-size:.95rem; color:#ddd;"></div>

          <div>
            <div style="display:flex; justify-content:space-between; font-size:.85rem; color:#aaa; margin-bottom:6px;">
              <span>Progression vers le prochain rebirth</span>
              <span id="rbProgLabelRight">0%</span>
            </div>
            <div style="width:100%; height:12px; background: rgba(255,255,255,.08); border-radius: 999px; overflow:hidden;">
              <div id="rbProgress" style="height:100%; width:0%; background: linear-gradient(90deg,#27ae60,#2ecc71);"></div>
            </div>
          </div>

          <div id="rbCosts" style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:.9rem; color:#ccc;">
            <div style="background: rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.06); border-radius:8px; padding:10px;">
              <div style="opacity:.75; font-size:.8rem;">Coût précédent</div>
              <div id="rbPrevCost" style="font-weight:600;">—</div>
            </div>
            <div style="background: rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.06); border-radius:8px; padding:10px;">
              <div style="opacity:.75; font-size:.8rem;">Coût prochain</div>
              <div id="rbNextCost" style="font-weight:600;">—</div>
            </div>
          </div>

          <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:4px;">
            <button id="rbDoBtn" class="btn btn-warning" style="padding:10px 14px; border-radius:8px; border:none; cursor:pointer;">
              🌱 Rebirth
            </button>
          </div>

          <div style="font-size:.85rem; color:#9aa;">
            • Reset machines et auto-clickers • Conserve 50% des points restants après paiement • +5% gains permanents (clics et auto)
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  const rbCloseBtn = modal.querySelector("#rbCloseBtn");
  const rbDoBtn    = modal.querySelector("#rbDoBtn");
  const rbTopLine  = modal.querySelector("#rbTopLine");
  const rbPrevCost = modal.querySelector("#rbPrevCost");
  const rbNextCost = modal.querySelector("#rbNextCost");
  const rbProgRight= modal.querySelector("#rbProgLabelRight");
  const rbProgress = modal.querySelector("#rbProgress");

  let rafId = null;
  let modalOpen = false;

  function openModal() {
    modal.setAttribute("aria-hidden", "false");
    modal.style.opacity = "1";
    modal.style.pointerEvents = "auto";
    modalOpen = true;
    loopUpdate();
  }

  function closeModal() {
    modal.setAttribute("aria-hidden", "true");
    modal.style.opacity = "0";
    modal.style.pointerEvents = "none";
    modalOpen = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function updateUI() {
    // Ligne du haut : Rebirth actuel et prochain avec boosts cumulés
    const cur = state.rebirths;
    const next = cur + 1;
    const curBoostPct  = getTotalBoostPercent(cur);
    const nextBoostPct = getTotalBoostPercent(next);
    rbTopLine.textContent = `Rebirth actuel : ${cur} (+${formatPercentNoZeros(curBoostPct)}%) → Prochain : ${next} (+${formatPercentNoZeros(nextBoostPct)}%)`;

    // Coûts
    const prevCost = getPrevCost();
    const nextCost = getNextCost();
    rbPrevCost.textContent = prevCost > 0 ? formatCompact(prevCost) : "—";
    rbNextCost.textContent = formatCompact(nextCost);

    // Progression vers le prochain Rebirth
    const ratio = nextCost > 0 ? Math.min(1, (state.points || 0) / nextCost) : 0;
    const pct = Math.floor(ratio * 100);
    rbProgRight.textContent = `${pct}%`;
    rbProgress.style.width = `${pct}%`;

    // Etat du bouton
    const canRebirth = (state.points || 0) >= nextCost;
    rbDoBtn.disabled = !canRebirth;
    rbDoBtn.style.opacity = canRebirth ? "1" : ".6";
    rbDoBtn.style.cursor = canRebirth ? "pointer" : "not-allowed";
  }

  function loopUpdate() {
    if (!modalOpen) return;
    updateUI();
    rafId = requestAnimationFrame(loopUpdate);
  }

  // Ouvrir/fermer
  els.rebirthBtn.addEventListener("click", openModal);
  rbCloseBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Action Rebirth
  rbDoBtn.addEventListener("click", () => {
    const cost = getNextCost();
    if ((state.points || 0) < cost) return;

    // 1) Payer le coût
    state.points -= cost;

    // 2) Reset machines / auto-clickers (mais pas points ni pointsPerClick)
    keys.forEach(k => {
      if (k !== "points" && k !== "pointsPerClick") {
        state[k] = 0;
      }
    });

    // 3) Conserver 50% des points restants
    state.points = Math.floor(state.points / 2);

    // 4) Incrémenter le compteur et persister
    state.rebirths += 1;
    localStorage.setItem(STORAGE_KEY, String(state.rebirths));

    // 5) NE PAS toucher à pointsPerClick; le boost est global via getRebirthBoostFactor()

    // 6) Sauvegarde + rafraîchir UI globale
    save();
    renderMain();
    renderStore();
    updateUI();
  });

  // Sync initial du bouton Tap (affichage déjà géré par renderMain)
  updateUI();
}
