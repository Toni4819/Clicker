// dev.js
const _devKeyParts = ["NT", "Zz", "QV", "VD", "RT", "Ey"];
const base64Code = _devKeyParts.join("");
let devUnlocked = false;

function renderDev(deps) {
  const {
    els,
    state,
    save,
    renderMain,
    renderStore,
    closeModal,
    machines
  } = deps;

  const body = els.devBody;
  Object.assign(body.style, {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "16px",
    gap: "12px",
  });
  body.innerHTML = "";

  if (!devUnlocked) {
    body.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
        <h3 class="section-title">🔐 Code Développeur</h3>
        <input id="devCodeInput" type="password" placeholder="Entrez le code"
               style="width:200px; text-align:center; padding:6px;" />
        <div style="display:flex; gap:8px;">
          <button id="devValidateBtn" class="btn btn-secondary">Valider</button>
          <button id="devCancelBtn" class="item-btn">Annuler</button>
        </div>
      </div>
    `;
    body.querySelector("#devValidateBtn").addEventListener("click", () => {
      const code = body.querySelector("#devCodeInput").value || "";
      try {
        if (btoa(code) === base64Code) {
          devUnlocked = true;
          renderDev(deps);
        } else {
          body.querySelector("#devCodeInput").value = "";
        }
      } catch {
        body.querySelector("#devCodeInput").value = "";
      }
    });
    body.querySelector("#devCancelBtn").addEventListener("click", () => {
      devUnlocked = false;
      closeModal(els.devModal);
    });
    return;
  }

  // Helper pour créer une ligne
  const makeLine = (label, id, value, min = 0) => `
    <div style="display:flex; align-items:center; gap:8px; width:100%; max-width:380px;">
      <label for="${id}" style="flex:1; text-align:right;">${label}</label>
      <input id="${id}" type="number" min="${min}" value="${value}" style="flex:1; padding:4px;" />
      <button id="btn-${id}" class="item-btn">OK</button>
    </div>
  `;

  let html = `<h3 class="section-title">🔧 Mode Dev Avancé</h3>`;

  // Section Points
  html += `<h4>💰 Points</h4>`;
  html += makeLine("Points", "pointsInput", state.points, 0);
  html += `
    <div style="display:flex; align-items:center; gap:8px; max-width:380px;">
      <span style="flex:1; text-align:right;">Ajout rapide</span>
      <button id="plus1kBtn" class="item-btn">+1k</button>
      <button id="plus10kBtn" class="item-btn">+10k</button>
      <button id="plus100kBtn" class="item-btn">+100k</button>
      <button id="plus1MBtn" class="item-btn">+1M</button>
    </div>
  `;
  html += makeLine("Points/Clic", "clickPowerInput", state.pointsPerClick, 1);

  // Section Auto-clickers & Machines
  html += `<h4>🏭 Production</h4>`;
  html += makeLine("Auto-clickers", "autoClickersInput", state.autoClickers, 0);
  for (const m of machines) {
    html += makeLine(m.title, `machine-${m.key}-input`, state[m.key], 0);
  }

  // Section Boosts
  html += `<h4>🚀 Boosts</h4>`;
  html += makeLine("Boost Shop permanent", "shopBoostInput", state.shopBoost || 1, 1);
  html += makeLine("Boost Temporaire ×", "tempBoostFactorInput", state.tempShopBoostFactor || 1, 1);
  html += makeLine("Temp Boost expire (timestamp)", "tempBoostExpireInput", state.tempShopBoostExpiresAt || 0, 0);
  html += makeLine("Boost Rebirth ×", "rebirthBoostInput", state.rebirthBoost || 1, 1);

  // Section Rebirths
  html += `<h4>🌱 Rebirths</h4>`;
  html += makeLine("Nombre de Rebirths", "rebirthsInput", state.rebirths || 0, 0);

  // Actions
  html += `
    <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center; margin-top:12px;">
      <button id="resetRebirthsBtn" class="item-btn">Réinit Rebirths</button>
      <button id="resetAllStorageBtn" class="item-btn">Vider Storage & Reload</button>
    </div>
    <button id="devExitBtn" class="btn btn-secondary" style="margin-top:12px;">🚪 Quitter Mode Dev</button>
  `;

  body.innerHTML = html;

  // Listeners
  const setVal = (id, fn) => {
    body.querySelector(`#btn-${id}`).addEventListener("click", () => {
      const v = parseInt(body.querySelector(`#${id}`).value, 10);
      if (!isNaN(v)) { fn(v); save(); renderMain(); renderStore(); }
    });
  };

  setVal("pointsInput", v => state.points = v);
  setVal("clickPowerInput", v => state.pointsPerClick = v);
  setVal("autoClickersInput", v => state.autoClickers = v);
  for (const m of machines) {
    setVal(`machine-${m.key}-input`, v => state[m.key] = v);
  }
  setVal("shopBoostInput", v => state.shopBoost = v);
  setVal("tempBoostFactorInput", v => state.tempShopBoostFactor = v);
  setVal("tempBoostExpireInput", v => state.tempShopBoostExpiresAt = v);
  setVal("rebirthBoostInput", v => state.rebirthBoost = v);
  setVal("rebirthsInput", v => state.rebirths = v);

  // Quick adds
  body.querySelector("#plus1kBtn").addEventListener("click", () => { state.points += 1e3; save(); renderMain(); renderStore(); });
  body.querySelector("#plus10kBtn").addEventListener("click", () => { state.points += 1e4; save(); renderMain(); renderStore(); });
  body.querySelector("#plus100kBtn").addEventListener("click", () => { state.points += 1e5; save(); renderMain(); renderStore(); });
  body.querySelector("#plus1MBtn").addEventListener("click", () => { state.points += 1e6; save(); renderMain(); renderStore(); });

  // Reset Rebirths
  body.querySelector("#resetRebirthsBtn").addEventListener("click", () => {
    state.rebirths = 0;
    localStorage.removeItem("rebirthCount");
    save(); renderMain(); renderStore();
  });

  // Vider Storage
  body.querySelector("#resetAllStorageBtn").addEventListener("click", () => {
    localStorage.clear();
    location.reload();
  });

  // Quitter
  body.querySelector("#devExitBtn").addEventListener("click", () => {
    devUnlocked = false;
    closeModal(els.devModal);
  });
}

export function initDevMenu(deps) {
  const { els, openModal, closeModal } = deps;
  els.devTrigger.addEventListener("click", () => {
    devUnlocked = false;
    renderDev(deps);
    openModal(els.devModal);
  });
  els.closeDevBtn.addEventListener("click", () => {
    devUnlocked = false;
    closeModal(els.devModal);
  });
}

export { renderDev };
