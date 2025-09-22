// rebirthSystem.js
export function initRebirthSystem({
  els,
  state,
  keys,
  save,
  renderMain,
  renderStore = () => {},
  formatCompact
}) {
  const STORAGE_KEY = "rebirthCount";
  const BOOST_RATE  = 1.10;       // +5% par Rebirth
  const costTable   = [           // coûts par palier
    1e6,    // 1 M
    1e8,    // 100 M
    5e8,    // 500 M
    1e9,    // 1 B
    1e11,    // 100 B
    5e11,
    1e13,
    1e15,
    5e15,
    1e16,
    1e18,
    5e18,
    1e20,
    1e22,
    5e22,
    1e24
    
    
    // … ajouter d'autres paliers si besoin
  ];

  // Charger le compteur de Rebirths
  state.rebirths = parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10);

  // Calcul du coût précédent / prochain
  function getNextCost(n = state.rebirths) {
    if (costTable[n] !== undefined) {
      return costTable[n];
    }
    // au-delà de costTable, on continue en appliquant BOOST_RATE
    const lastBase = costTable[costTable.length - 1];
    const extra    = n - (costTable.length - 1);
    return Math.floor(lastBase * Math.pow(BOOST_RATE, extra));
  }

  function getPrevCost() {
    return state.rebirths > 0
      ? getNextCost(state.rebirths - 1)
      : 0;
  }

  // Boost global
  function getTotalBoostFactor(n = state.rebirths) {
    return Math.pow(BOOST_RATE, n);
  }

  // Création de la modale Rebirth (HTML & styles)
  let modal = document.getElementById("rebirthModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "rebirthModal";
    modal.setAttribute("aria-hidden", "true");
    Object.assign(modal.style, {
      position: "fixed",
      inset:     "0",
      display:   "grid",
      placeItems:"center",
      background:"rgba(0,0,0,0.5)",
      zIndex:    "1000",
      opacity:   "0",
      pointerEvents: "none",
      transition:    "opacity .15s ease"
    });
    modal.innerHTML = `
      <div class="rebirth-card" role="dialog" aria-labelledby="rebirthTitle" style="
        width:min(520px,92vw);
        background:var(--panel,#141414);
        border:1px solid rgba(255,255,255,.08);
        border-radius:12px;
        box-shadow:0 6px 30px rgba(0,0,0,.35);
        overflow:hidden;
      ">
        <header style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:rgba(255,255,255,.04);">
          <h2 id="rebirthTitle" style="margin:0;font-size:1.05rem;">🌱 Rebirth</h2>
          <button id="rbCloseBtn" aria-label="Fermer" style="
            background:none;border:none;color:#bbb;font-size:1.1rem;cursor:pointer;padding:6px;
          ">✕</button>
        </header>
        <div style="padding:14px;display:grid;gap:12px;">
          <div id="rbTopLine" style="font-size:.95rem;color:#ddd;"></div>
          <div>
            <div style="display:flex;justify-content:space-between;font-size:.85rem;color:#aaa;margin-bottom:6px;">
              <span>Progression vers le prochain rebirth</span>
              <span id="rbProgLabelRight">0%</span>
            </div>
            <div style="width:100%;height:12px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden;">
              <div id="rbProgress" style="height:100%;width:0%;background:linear-gradient(90deg,#27ae60,#2ecc71);"></div>
            </div>
          </div>
          <div id="rbCosts" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:.9rem;color:#ccc;">
            <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:10px;">
              <div style="opacity:.75;font-size:.8rem;">Coût précédent</div>
              <div id="rbPrevCost" style="font-weight:600;">—</div>
            </div>
            <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:10px;">
              <div style="opacity:.75;font-size:.8rem;">Coût prochain</div>
              <div id="rbNextCost" style="font-weight:600;">—</div>
            </div>
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:4px;">
            <button id="rbDoBtn" class="btn btn-warning" style="padding:10px 14px;border-radius:8px;border:none;cursor:pointer;">
              🌱 Rebirth
            </button>
          </div>
          <div style="font-size:.85rem;color:#9aa;">
            • Reset complet des points, upgrades, machines et boosts achetés • Boost permanent +10% par niveau
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }

  // Sélecteurs internes
  const rbCloseBtn = modal.querySelector("#rbCloseBtn");
  const rbDoBtn    = modal.querySelector("#rbDoBtn");
  const rbTopLine  = modal.querySelector("#rbTopLine");
  const rbPrevCost = modal.querySelector("#rbPrevCost");
  const rbNextCost = modal.querySelector("#rbNextCost");
  const rbProgRight= modal.querySelector("#rbProgLabelRight");
  const rbProgress = modal.querySelector("#rbProgress");

  let rafId = null;
  let open   = false;

  function openModal() {
    modal.setAttribute("aria-hidden", "false");
    modal.style.opacity = "1";
    modal.style.pointerEvents = "auto";
    open = true;
    loop();
  }

  function closeModal() {
    modal.setAttribute("aria-hidden", "true");
    modal.style.opacity = "0";
    modal.style.pointerEvents = "none";
    open = false;
    if (rafId) cancelAnimationFrame(rafId);
  }

  function updateUI() {
    const cur    = state.rebirths;
    const next   = cur + 1;
    const curPct = Math.floor((getTotalBoostFactor(cur) - 1) * 100);
    const nxtPct = Math.floor((getTotalBoostFactor(next) - 1) * 100);

    rbTopLine.textContent =
      `Rebirth actuel : ${cur} (+${curPct} %) → Prochain : ${next} (+${nxtPct} %)`;

    const prevCost = getPrevCost();
    const nextCost = getNextCost();
    rbPrevCost.textContent = prevCost > 0 ? formatCompact(prevCost) : "—";
    rbNextCost.textContent = formatCompact(nextCost);

    const ratio = nextCost > 0 ? Math.min(1, state.points / nextCost) : 0;
    const pct   = Math.floor(ratio * 100);
    rbProgRight.textContent = `${pct}%`;
    rbProgress.style.width  = `${pct}%`;

    const can = state.points >= nextCost;
    rbDoBtn.disabled = !can;
    rbDoBtn.style.opacity = can ? "1" : ".6";
    rbDoBtn.style.cursor  = can ? "pointer" : "not-allowed";
  }

  function loop() {
    if (!open) return;
    updateUI();
    rafId = requestAnimationFrame(loop);
  }

  // Listeners ouverture/fermeture
  els.rebirthBtn.addEventListener("click", openModal);
  rbCloseBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", e => {
    if (e.target === modal) closeModal();
  });

  // **Action Rebirth**
  rbDoBtn.addEventListener("click", () => {
    const cost = getNextCost();
    if (state.points < cost) return;

    // 1) dépense et reset complet
    state.points        = 0;
    state.pointsPerClick = 1;
    keys.forEach(k => {
      if (k !== "shopBoost" && k !== "points" && k !== "pointsPerClick") {
        state[k] = 0;
      }
    });

    // 2) incrémenter Rebirth et persister
    state.rebirths += 1;
    localStorage.setItem(STORAGE_KEY, String(state.rebirths));

    // 3) Sauvegarde + mise à jour UI
    save();
    renderMain();
    renderStore();
    updateUI();
  });

  // UI initiale
  updateUI();
}
