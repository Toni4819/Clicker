// dev.js — Menu développeur sécurisé, autonome et modulaire

const salt = "X9!a#";
const expectedHash = "bb58f0471dac25dc294e8af3f16b8dba28c302dee303ce24a69c1914462dee954";


let devUnlocked = false;

async function hashString(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function checkDevCode(input) {
  const hash = await hashString(input + salt);
  return hash === expectedHash;
}

function prepareDevModal(els) {
  if (!els.devModal) return;
  els.devModal.className = "modal";
  els.devModal.setAttribute("aria-hidden", "true");
  els.devModal.setAttribute("role", "dialog");
  els.devModal.setAttribute("aria-labelledby", "devTitle");

  els.devModal.innerHTML = `
    <div class="modal-content">
      <header class="modal-header">
        <h2 id="devTitle">🔧 Mode Développeur</h2>
        <button id="closeDevBtn" class="close-btn" aria-label="Fermer">✕</button>
      </header>
      <div class="modal-body" id="devBody"></div>
    </div>
  `;

  els.closeDevBtn = els.devModal.querySelector("#closeDevBtn");
  els.devBody     = els.devModal.querySelector("#devBody");
}

export function renderDev(deps) {
  const { els, state, save, renderMain, renderStore, closeModal, machines } = deps;

  if (!els.devBody) prepareDevModal(els);
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

    body.querySelector("#devValidateBtn").addEventListener("click", async () => {
      const code = body.querySelector("#devCodeInput").value || "";
      if (await checkDevCode(code)) {
        devUnlocked = true;
        renderDev(deps);
      } else {
        body.querySelector("#devCodeInput").value = "";
        alert("Code incorrect");
      }
    });

    body.querySelector("#devCancelBtn").addEventListener("click", () => {
      devUnlocked = false;
      closeModal(els.devModal);
    });

    return;
  }

  const makeLine = (label, id, value, min = 0) => `
    <div style="display:flex; align-items:center; gap:8px; width:100%; max-width:380px;">
      <label for="${id}" style="flex:1; text-align:right;">${label}</label>
      <input id="${id}" type="number" min="${min}" value="${value}" style="flex:1; padding:4px;" />
      <button id="btn-${id}" class="item-btn">OK</button>
    </div>
  `;

  let html = `<h3 class="section-title">🔧 Mode Dev Avancé</h3>`;

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

  html += `<h4>🏭 Production</h4>`;
  html += makeLine("Auto-clickers", "autoClickersInput", state.autoClickers, 0);
  for (const m of machines) {
    html += makeLine(m.title, `machine-${m.key}-input`, state[m.key], 0);
  }

  html += `<h4>🚀 Boosts</h4>`;
  html += makeLine("Boost Shop permanent", "shopBoostInput", state.shopBoost || 1, 1);
  html += makeLine("Boost Temporaire ×", "tempBoostFactorInput", state.tempShopBoostFactor || 1, 1);
  html += makeLine("Temp Boost expire (timestamp)", "tempBoostExpireInput", state.tempShopBoostExpiresAt || 0, 0);
  html += makeLine("Boost Rebirth ×", "rebirthBoostInput", state.rebirthBoost || 1, 1);

  html += `<h4>🌱 Rebirths</h4>`;
  html += makeLine("Nombre de Rebirths", "rebirthsInput", state.rebirths || 0, 0);

  html += `
    <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center; margin-top:12px;">
      <button id="resetRebirthsBtn" class="item-btn">Réinit Rebirths</button>
      <button id="resetAllStorageBtn" class="item-btn">Vider Storage & Reload</button>
    </div>
    <button id="devExitBtn" class="btn btn-secondary" style="margin-top:12px;">🚪 Quitter Mode Dev</button>
  `;

  body.innerHTML = html;

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

  body.querySelector("#plus1kBtn").addEventListener("click", () => { state.points += 1e3; save(); renderMain(); renderStore(); });
  body.querySelector("#plus10kBtn").addEventListener("click", () => { state.points += 1e4; save(); renderMain(); renderStore(); });
  body.querySelector("#plus100kBtn").addEventListener("click", () => { state.points += 1e5; save(); renderMain(); renderStore(); });
  body.querySelector("#plus1MBtn").addEventListener("click", () => { state.points += 1e6; save(); renderMain(); renderStore(); });

  body.querySelector("#resetRebirthsBtn").addEventListener("click", () => {
    state.rebirths = 0;
    localStorage.removeItem("rebirthCount");
    save();
    renderMain();
    renderStore();
  });

  body.querySelector("#resetAllStorageBtn").addEventListener("click", () => {
    localStorage.clear();
    location.reload();
  });

  body.querySelector("#devExitBtn").addEventListener("click", () => {
    devUnlocked = false;
    closeModal(els.devModal);
  });
}

export function initDevMenu(deps) {
  const { els, openModal, closeModal } = deps;

  // Préparer la structure du modal si besoin
  if (!els.devBody) {
    prepareDevModal(els);
  }

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

(async function checkDevCode(input) {
  const code = input.trim();                     // enlève espaces avant/après
  const computedHash = await hashString(code + salt);
  console.log("🔍 code saisi      :", `"${code}"`);
  console.log("🔍 hash calculé   :", computedHash);
  console.log("🔍 hash attendu   :", expectedHash);
  return computedHash === expectedHash;
})();


(async () => {
  const code = "56sAUCE12";
  const salt = "X9!a#";
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code + salt));
  const hash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  console.log(hash);
})();


