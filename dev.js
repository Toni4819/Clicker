// dev.js

// Clé Base64 fragmentée
const _devKeyParts = ["NT", "Zz", "QV", "VD", "RT", "Ey"];
const base64Code = _devKeyParts.join(""); // "MzRTYXVjZTEy"
let devUnlocked = false;

/**
 * Affiche ou met à jour le contenu du menu Dev.
 */
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

  // Style de base pour centrer tout
  const body = els.devBody;
  Object.assign(body.style, {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "16px",
    gap: "12px",
  });

  body.innerHTML = ""; // clear

  if (!devUnlocked) {
    // ── Formulaire de code centré ──
    body.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
        <h3 class="section-title">🔐 Code Développeur</h3>
        <input id="devCodeInput" 
               type="password" 
               placeholder="Entrez le code" 
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

  } else {
    // ── Menu Dev Avancé centré ──
    let html = `<h3 class="section-title">🔧 Mode Dev Avancé</h3>`;

    // Helper pour créer une ligne d'input + bouton
    const makeLine = (label, id, value, min = 0) => `
      <div style="display:flex; align-items:center; gap:8px; width:100%; max-width:360px;">
        <label for="${id}" style="flex:1; text-align:right;">${label}</label>
        <input id="${id}" 
               type="number" 
               min="${min}" 
               value="${value}" 
               style="flex:1; padding:4px;" />
        <button id="btn-${id}" class="item-btn">OK</button>
      </div>
    `;

    html += makeLine("Points",            "pointsInput",          state.points,        0);
    html += `
      <div style="display:flex; align-items:center; gap:8px; max-width:360px;">
        <span style="flex:1; text-align:right;">Ajout rapide</span>
        <button id="plus1kBtn"  class="item-btn">+1 000</button>
        <button id="plus10kBtn" class="item-btn">+10 000</button>
        <button id="plus100kBtn"class="item-btn">+100 000</button>
        <button id="plus1MBtn"  class="item-btn">+1 000 000</button>
      </div>
    `;
    html += makeLine("Points/Clic",       "clickPowerInput",     state.pointsPerClick,1);
    html += makeLine("Auto-clickers",     "autoClickersInput",   state.autoClickers,  0);

    // Machines N1→N10
    for (const m of machines) {
      html += makeLine(`${m.title}`, `machine-${m.key}-input`, state[m.key], 0);
    }

    // Réinitialisations & sortie
    html += `
      <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center; margin-top:12px;">
        <button id="resetRebirthsBtn"    class="item-btn">Réinit Rebirths</button>
        <button id="resetAllStorageBtn"  class="item-btn">Vider Storage & Reload</button>
      </div>
      <button id="devExitBtn" class="btn btn-secondary" style="margin-top:12px;">
        🚪 Quitter Mode Dev
      </button>
    `;

    body.innerHTML = html;

    // ── Listeners pour chaque ligne ──

    // Points
    body.querySelector("#btn-pointsInput").addEventListener("click", () => {
      const v = parseInt(body.querySelector("#pointsInput").value, 10);
      if (v >= 0) { state.points = v; save(); renderMain(); renderStore(); }
    });

    // Quick adds
    body.querySelector("#plus1kBtn").addEventListener("click", () => {
      state.points += 1e3; save(); renderMain(); renderStore();
    });
    body.querySelector("#plus10kBtn").addEventListener("click", () => {
      state.points += 1e4; save(); renderMain(); renderStore();
    });
    body.querySelector("#plus100kBtn").addEventListener("click", () => {
      state.points += 1e5; save(); renderMain(); renderStore();
    });
    body.querySelector("#plus1MBtn").addEventListener("click", () => {
      state.points += 1e6; save(); renderMain(); renderStore();
    });

    // Points/Clic
    body.querySelector("#btn-clickPowerInput").addEventListener("click", () => {
      const v = parseInt(body.querySelector("#clickPowerInput").value, 10);
      if (v >= 1) { state.pointsPerClick = v; save(); renderMain(); renderStore(); }
    });

    // Auto-clickers
    body.querySelector("#btn-autoClickersInput").addEventListener("click", () => {
      const v = parseInt(body.querySelector("#autoClickersInput").value, 10);
      if (v >= 0) { state.autoClickers = v; save(); renderMain(); renderStore(); }
    });

    // Machines
    for (const m of machines) {
      body.querySelector(`#btn-machine-${m.key}-input`)
        .addEventListener("click", () => {
          const id  = `#machine-${m.key}-input`;
          const v   = parseInt(body.querySelector(id).value, 10);
          if (v >= 0) { state[m.key] = v; save(); renderMain(); renderStore(); }
        });
    }

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
}

/**
 * Initialise le menu Dev.
 */
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
