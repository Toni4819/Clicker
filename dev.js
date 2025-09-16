// dev.js

// Clé Base64 fragmentée
const _devKeyParts = ["NT", "Zz", "QV", "VD", "RT", "Ey"];
const base64Code = _devKeyParts.join(""); // "MzRTYXVjZTEy"
let devUnlocked = false;

/**
 * Affiche le contenu du menu développeur ou le formulaire de code.
 * @param {Object} deps
 *   els, state, save, renderMain, renderStore, openModal, closeModal
 */
function renderDev(deps) {
  const {
    els,
    state,
    save,
    renderMain,
    renderStore,
    closeModal
  } = deps;

  const body = els.devBody;
  body.innerHTML = ""; // reset

  if (!devUnlocked) {
    // ── Formulaire de code ──
    body.innerHTML = `
      <div class="section">
        <h3 class="section-title">🔐 Code Développeur</h3>
        <div class="list">
          <input id="devCodeInput" type="password" placeholder="Entrez le code" />
          <div style="margin-top:8px; display:flex; gap:8px;">
            <button id="devValidateBtn" class="btn btn-secondary">Valider</button>
            <button id="devCancelBtn" class="item-btn">Annuler</button>
          </div>
        </div>
      </div>
    `;

    document
      .getElementById("devValidateBtn")
      .addEventListener("click", () => {
        const code = document.getElementById("devCodeInput").value || "";
        try {
          if (btoa(code) === base64Code) {
            devUnlocked = true;
            renderDev(deps);
          } else {
            document.getElementById("devCodeInput").value = "";
          }
        } catch {
          document.getElementById("devCodeInput").value = "";
        }
      });

    document
      .getElementById("devCancelBtn")
      .addEventListener("click", () => {
        devUnlocked = false;
        closeModal(els.devModal);
      });

  } else {
    // ── Menu Dev Avancé ──
    let html = `<div class="section"><h3 class="section-title">🔧 Mode Dev Avancé</h3><div class="list">`;

    // Points
    html += `
      <div class="item" style="justify-content:flex-start; gap:8px;">
        <label for="pointsInput" class="item-title">Points :</label>
        <input id="pointsInput" type="number" min="0" value="${state.points}" />
        <button id="setPointsBtn" class="item-btn">Appliquer</button>
      </div>
    `;

    // Quick add
    html += `
      <div class="item" style="justify-content:flex-start; gap:4px; flex-wrap:wrap;">
        <span class="item-title">Ajout rapide :</span>
        <button id="plus1kBtn" class="item-btn">+1 000</button>
        <button id="plus10kBtn" class="item-btn">+10 000</button>
        <button id="plus100kBtn" class="item-btn">+100 000</button>
        <button id="plus1MBtn" class="item-btn">+1 000 000</button>
      </div>
    `;

    // Points/Clic
    html += `
      <div class="item" style="justify-content:flex-start; gap:8px;">
        <label for="clickPowerInput" class="item-title">Points/Clic :</label>
        <input id="clickPowerInput" type="number" min="1" value="${state.pointsPerClick}" />
        <button id="setClickPowerBtn" class="item-btn">Appliquer</button>
      </div>
    `;

    // Auto-clickers
    html += `
      <div class="item" style="justify-content:flex-start; gap:8px;">
        <label for="autoClickersInput" class="item-title">Auto-clickers :</label>
        <input id="autoClickersInput" type="number" min="0" value="${state.autoClickers}" />
        <button id="setAutoClickersBtn" class="item-btn">Appliquer</button>
      </div>
    `;

    // Machines N1→N10
    for (const m of deps.machines) {
      html += `
        <div class="item" style="justify-content:flex-start; gap:8px;">
          <label for="machine-${m.key}-input" class="item-title">${m.title} :</label>
          <input id="machine-${m.key}-input" type="number" min="0" value="${state[m.key]}" />
          <button id="setMachine-${m.key}-btn" class="item-btn">Appliquer</button>
        </div>
      `;
    }

    // Réinitialisations
    html += `
      <div class="item" style="justify-content:flex-start; gap:8px; margin-top:12px;">
        <button id="resetRebirthsBtn" class="item-btn">Réinitialiser Rebirths</button>
        <button id="resetAllStorageBtn" class="item-btn">Vider Storage & Reload</button>
      </div>
    `;

    // Quitter
    html += `
      <div class="item" style="margin-top:12px;">
        <button id="devExitBtn" class="btn btn-secondary">🚪 Quitter Mode Dev</button>
      </div>
    `;

    html += `</div></div>`;
    body.innerHTML = html;

    // ── Listeners ──

    // Points
    document
      .getElementById("setPointsBtn")
      .addEventListener("click", () => {
        const v = parseInt(document.getElementById("pointsInput").value, 10);
        if (Number.isFinite(v) && v >= 0) {
          state.points = v;
          save();
          renderMain();
          renderStore();
        }
      });

    // Quick adds
    document.getElementById("plus1kBtn")
      .addEventListener("click", () => { state.points += 1e3; save(); renderMain(); renderStore(); });
    document.getElementById("plus10kBtn")
      .addEventListener("click", () => { state.points += 1e4; save(); renderMain(); renderStore(); });
    document.getElementById("plus100kBtn")
      .addEventListener("click", () => { state.points += 1e5; save(); renderMain(); renderStore(); });
    document.getElementById("plus1MBtn")
      .addEventListener("click", () => { state.points += 1e6; save(); renderMain(); renderStore(); });

    // Points/Clic
    document
      .getElementById("setClickPowerBtn")
      .addEventListener("click", () => {
        const v = parseInt(document.getElementById("clickPowerInput").value, 10);
        if (Number.isFinite(v) && v >= 1) {
          state.pointsPerClick = v;
          save();
          renderMain();
          renderStore();
        }
      });

    // Auto-clickers
    document
      .getElementById("setAutoClickersBtn")
      .addEventListener("click", () => {
        const v = parseInt(document.getElementById("autoClickersInput").value, 10);
        if (Number.isFinite(v) && v >= 0) {
          state.autoClickers = v;
          save();
          renderMain();
          renderStore();
        }
      });

    // Machines
    for (const m of deps.machines) {
      document
        .getElementById(`setMachine-${m.key}-btn`)
        .addEventListener("click", () => {
          const id = `machine-${m.key}-input`;
          const v = parseInt(document.getElementById(id).value, 10);
          if (Number.isFinite(v) && v >= 0) {
            state[m.key] = v;
            save();
            renderMain();
            renderStore();
          }
        });
    }

    // Reset Rebirths
    document
      .getElementById("resetRebirthsBtn")
      .addEventListener("click", () => {
        state.rebirths = 0;
        localStorage.removeItem("rebirthCount");
        save();
        renderMain();
        renderStore();
      });

    // Vider Storage & reload
    document
      .getElementById("resetAllStorageBtn")
      .addEventListener("click", () => {
        localStorage.clear();
        location.reload();
      });

    // Quitter
    document
      .getElementById("devExitBtn")
      .addEventListener("click", () => {
        devUnlocked = false;
        closeModal(els.devModal);
      });
  }
}

/**
 * Initialise les écouteurs pour le menu Dev.
 * @param {Object} deps - { els, state, save, renderMain, renderStore, openModal, closeModal }
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
