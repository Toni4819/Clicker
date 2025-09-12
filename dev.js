// Clé Base64 fragmentée
const _devKeyParts = ["NT", "Zz", "QV", "VD", "RT", "Ey"];
const base64Code = _devKeyParts.join(""); // "MzRTYXVjZTEy"
let devUnlocked = false;

/**
 * Affiche le contenu du menu développeur ou le formulaire de code.
 * @param {Object} deps
 */
function renderDev(deps) {
  const { els, state, save, renderMain, renderStore, closeModal } = deps;

  if (!devUnlocked) {
    // Formulaire d’entrée de code
    els.devBody.innerHTML = `
      <div class="section">
        <h3 class="section-title">🔐 Entrer le code développeur</h3>
        <div class="list">
          <input id="devCodeInput" type="password" placeholder="Code" />
          <div>
            <button id="devValidateBtn" class="btn btn-secondary">Valider</button>
          </div>
          <div>
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
    // Vue du menu Dev
    els.devBody.innerHTML = `
      <div class="section">
        <h3 class="section-title">Mode Dev</h3>
        <div class="list">
          <div class="item" style="justify-content:flex-start; gap:12px;">
            <label for="pointsInput" class="item-title">Définir les points:</label>
            <input id="pointsInput" type="number" min="0" step="1" value="${state.points}" />
            <button id="setPointsBtn" class="item-btn">Appliquer</button>
          </div>
          <div class="item" style="justify-content:space-between;">
            <div class="item-title">Ajouter rapidement</div>
            <button id="plus1kBtn" class="item-btn">+1 000</button>
          </div>
          <div>
            <button id="devExitBtn" class="btn" style="background:#2b2f3a;color:#fff;">
              🚪 Quitter le Mode Dev
            </button>
          </div>
        </div>
      </div>
    `;
    document.getElementById("setPointsBtn").addEventListener("click", () => {
      const v = parseInt(
        document.getElementById("pointsInput").value,
        10
      );
      if (Number.isFinite(v) && v >= 0) {
        state.points = v;
        save();
        renderMain();
        renderStore();
      }
    });
    document.getElementById("plus1kBtn").addEventListener("click", () => {
      state.points += 1000;
      save();
      renderMain();
      renderStore();
    });
    document.getElementById("devExitBtn").addEventListener("click", () => {
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
  const { els, openModal } = deps;

  els.devTrigger.addEventListener("click", () => {
    devUnlocked = false;
    renderDev(deps);
    openModal(els.devModal);
  });

  els.closeDevBtn.addEventListener("click", () => {
    deps.closeModal(els.devModal);
  });
}
