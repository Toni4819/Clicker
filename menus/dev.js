// dev.js — Menu développeur sécurisé, autonome et modulaire
// Intègre : salt, expectedHash, devUnlocked et expose initDevMenu / renderDev

const salt = "X9!a#";
const expectedHash = "bb58f0471dac25dc294e8af3f6b8dba28c302dee3b3ce24a69c1914462dee954";
let devUnlocked = false;

// util: SHA-256 hex
async function hashString(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function checkDevCode(input) {
  const code = String(input || "").trim();
  if (!code) return false;
  const computedHash = await hashString(code + salt);
  return computedHash === expectedHash;
}

// Prépare le DOM du modal s'il n'existe pas
function prepareDevModal(els) {
  if (!els || !els.devModal) return;
  const modal = els.devModal;
  modal.className = "modal";
  modal.setAttribute("aria-hidden", "true");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-labelledby", "devTitle");

  // Accessible structure minimale, contenu injecté dynamiquement
  modal.innerHTML = `
    <div class="modal-content" role="document">
      <header class="modal-header">
        <h2 id="devTitle">🔧 Mode Développeur</h2>
        <button id="dev-close-btn" class="close-btn" aria-label="Fermer">✕</button>
      </header>
      <div class="modal-body" id="devBody" tabindex="0"></div>
    </div>
  `;

  // Expose refs propres
  els.closeDevBtn = modal.querySelector("#dev-close-btn");
  els.devBody = modal.querySelector("#devBody");
}

// Renderer principal
export function renderDev(deps) {
  const { els, state, save = () => {}, renderMain = () => {}, renderStore = () => {}, closeModal = () => {}, machines = [] } = deps;

  if (!els || !els.devModal) return;
  if (!els.devBody) prepareDevModal(els);
  const body = els.devBody;

  Object.assign(body.style, {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "16px",
    gap: "12px",
    width: "100%",
    boxSizing: "border-box"
  });

  // helper: créer ligne de contrôle (label + input number + bouton)
  const makeLine = (label, id, value, min = 0, step = 1) => {
    const safeVal = (value === undefined || value === null) ? "" : String(value);
    return `
      <div class="dev-line" style="display:flex; align-items:center; gap:8px; width:100%; max-width:480px;">
        <label for="${id}" style="flex:1; text-align:right;">${label}</label>
        <input id="${id}" type="number" min="${min}" step="${step}" value="${safeVal}" style="flex:1; padding:6px;" />
        <button data-action="set" data-target="${id}" class="item-btn">OK</button>
      </div>
    `;
  };

  // Vue : verrouillé (demande code)
  if (!devUnlocked) {
    body.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; gap:12px; width:100%;">
        <h3 class="section-title">🔐 Code Développeur</h3>
        <div style="display:flex; gap:8px; align-items:center;">
          <input id="devCodeInput" type="password" placeholder="Entrez le code" aria-label="Code développeur"
                 style="width:260px; text-align:center; padding:8px;" />
        </div>
        <div style="display:flex; gap:8px; margin-top:6px;">
          <button id="devValidateBtn" class="btn btn-primary">Valider</button>
          <button id="devCancelBtn" class="btn"">Annuler</button>
        </div>
        <div id="devFeedback" role="status" aria-live="polite" style="min-height:18px; color:#b00; margin-top:8px;"></div>
      </div>
    `;

    const input = body.querySelector("#devCodeInput");
    const validateBtn = body.querySelector("#devValidateBtn");
    const cancelBtn = body.querySelector("#devCancelBtn");
    const feedback = body.querySelector("#devFeedback");

    const showFeedback = (msg, ok = false) => {
      feedback.textContent = msg;
      feedback.style.color = ok ? "#080" : "#b00";
    };

    validateBtn.addEventListener("click", async () => {
      validateBtn.disabled = true;
      const code = input.value || "";
      const ok = await checkDevCode(code);
      validateBtn.disabled = false;
      if (ok) {
        devUnlocked = true;
        showFeedback("Accès développeur autorisé", true);
        // petit délai pour que lecteur vocal lise le feedback, puis re-render
        setTimeout(() => renderDev(deps), 250);
      } else {
        input.value = "";
        showFeedback("Code incorrect");
        input.focus();
      }
    });

    cancelBtn.addEventListener("click", () => {
      devUnlocked = false;
      closeModal(els.devModal);
    });

    // support Entrée dans l'input
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") validateBtn.click();
    });

    input.focus();
    return;
  }

  // Vue : déverrouillée — affichage des variables
  let html = `<h3 class="section-title">🔧 Mode Dev Avancé</h3>`;

  html += `<section style="width:100%; max-width:640px;">`;
  html += `<h4>💰 Points</h4>`;
  html += makeLine("Points", "pointsInput", state.points || 0, 0, 1);
  html += `
    <div style="display:flex; align-items:center; gap:8px; max-width:480px; margin-top:6px;">
      <span style="flex:1; text-align:right;">Ajout rapide</span>
      <button data-bulk="1000" class="item-btn bulk-btn">+1k</button>
      <button data-bulk="10000" class="item-btn bulk-btn">+10k</button>
      <button data-bulk="100000" class="item-btn bulk-btn">+100k</button>
      <button data-bulk="1000000" class="item-btn bulk-btn">+1M</button>
    </div>
  `;
  html += makeLine("Points/Clic", "clickPowerInput", state.pointsPerClick || 1, 1, 1);

  html += `<h4>🏭 Production</h4>`;
  html += makeLine("Auto-clickers", "autoClickersInput", state.autoClickers || 0, 0, 1);
  for (const m of machines) {
    const key = `machine-${m.key}-input`;
    html += makeLine(m.title || m.key, key, Number(state[m.key] || 0), 0, 1);
  }

  html += `<h4>🚀 Boosts</h4>`;
  html += makeLine("Boost Shop permanent", "shopBoostInput", state.shopBoost ?? 1, 1, 0.01);
  html += makeLine("Boost Temporaire ×", "tempBoostFactorInput", state.tempShopBoostFactor ?? 1, 1, 0.01);
  html += makeLine("Temp Boost expire (timestamp)", "tempBoostExpireInput", state.tempShopBoostExpiresAt ?? 0, 0, 1);
  html += makeLine("Boost Rebirth ×", "rebirthBoostInput", state.rebirthBoost ?? 1, 1, 0.01);

  html += `<h4>🌱 Rebirths</h4>`;
  html += makeLine("Nombre de Rebirths", "rebirthsInput", state.rebirths ?? 0, 0, 1);

  html += `
    <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center; margin-top:12px;">
      <button id="resetRebirthsBtn" class="item-btn">Réinit Rebirths</button>
      <button id="resetAllStorageBtn" class="danger-btn">Vider Storage & Reload</button>
    </div>
    <div style="margin-top:12px;">
      <button id="devExitBtn" class="btn btn-secondary">🚪 Quitter Mode Dev</button>
    </div>
  `;

  html += `</section>`;
  body.innerHTML = html;

  // --- délégation d'événements pour les boutons OK
  body.querySelectorAll('button[data-action="set"]').forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-target");
      const input = body.querySelector(`#${target}`);
      if (!input) return;
      const raw = input.value;
      // garder int si l'utilisateur a fourni entier, sinon float
      const parsed = raw.includes('.') ? parseFloat(raw) : parseInt(raw, 10);
      if (isNaN(parsed)) {
        input.classList.add("input-error");
        setTimeout(() => input.classList.remove("input-error"), 800);
        return;
      }
      // map target -> state key
      switch (target) {
        case "pointsInput": state.points = parsed; break;
        case "clickPowerInput": state.pointsPerClick = parsed; break;
        case "autoClickersInput": state.autoClickers = parsed; break;
        case "shopBoostInput": state.shopBoost = parsed; break;
        case "tempBoostFactorInput": state.tempShopBoostFactor = parsed; break;
        case "tempBoostExpireInput": state.tempShopBoostExpiresAt = parsed; break;
        case "rebirthBoostInput": state.rebirthBoost = parsed; break;
        case "rebirthsInput": state.rebirths = parsed; break;
        default:
          // machines: machine-{key}-input => state[key]
          if (target.startsWith("machine-") && target.endsWith("-input")) {
            const key = target.slice(8, -6); // remove "machine-" and "-input"
            state[key] = parsed;
          } else {
            // Unknown target: ignore
            return;
          }
      }
      save();
      renderMain();
      renderStore();
    });
  });

  // bulk add buttons
  body.querySelectorAll(".bulk-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const n = Number(btn.getAttribute("data-bulk") || 0);
      if (!Number.isFinite(n) || n <= 0) return;
      state.points = (Number(state.points) || 0) + n;
      save();
      renderMain();
      renderStore();
    });
  });

  // reset rebirths
  const resetRebirthsBtn = body.querySelector("#resetRebirthsBtn");
  if (resetRebirthsBtn) {
    resetRebirthsBtn.addEventListener("click", () => {
      state.rebirths = 0;
      try { localStorage.removeItem("rebirthCount"); } catch(e) {}
      save();
      renderMain();
      renderStore();
    });
  }

  // reset all storage
  const resetAllBtn = body.querySelector("#resetAllStorageBtn");
  if (resetAllBtn) {
    resetAllBtn.addEventListener("click", () => {
      // protection : confirmer nativement
      if (!confirm("Confirmer : vider le localStorage et recharger la page ?")) return;
      try { localStorage.clear(); } catch (e) {}
      location.reload();
    });
  }

  // Exit dev
  const exitBtn = body.querySelector("#devExitBtn");
  if (exitBtn) {
    exitBtn.addEventListener("click", () => {
      devUnlocked = false;
      closeModal(els.devModal);
    });
  }
}

// Initialisation : branche le trigger et prépare le modal
export function initDevMenu(deps) {
  const { els = {}, openModal = () => {}, closeModal = () => {} } = deps;

  if (!els.devModal) {
    console.warn("initDevMenu: els.devModal manquant");
    return;
  }

  // Prépare structure si nécessaire
  if (!els.devBody) prepareDevModal(els);

  // Assure qu'il n'y a pas d'écouteurs doublons
  const trigger = els.devTrigger;
  if (trigger) {
    // retire attributs précédents au besoin
    trigger.replaceWith(trigger.cloneNode(true));
    els.devTrigger = document.querySelector(trigger.matches ? null : null) || trigger; // no-op pour rester sûr
    els.devTrigger.addEventListener("click", () => {
      devUnlocked = false;
      renderDev(deps);
      openModal(els.devModal);
    });
  } else {
    console.warn("initDevMenu: els.devTrigger manquant");
  }

  if (els.closeDevBtn) {
    els.closeDevBtn.addEventListener("click", () => {
      devUnlocked = false;
      closeModal(els.devModal);
    });
  }
}
