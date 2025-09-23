// menus/dev.js
// Dev menu autonome : mot de passe fixé, prompt() pour entrer le code, modal éditable, verrouillage automatique.
// Usage (type="module"):
// import { initDevMenu, openDev } from './menus/dev.js';
// initDevMenu({ devTriggerId: 'devTrigger', devModalId: 'devModal', api: { getState, setState } });

const DEFAULT = {
  devTriggerId: 'devTrigger',
  devModalId: 'devModal',
  modalClass: 'dev-modal',
  modalContentClass: 'dev-modal__content',
  closeBtnClass: 'dev-modal__close',
  salt: 'X9!a#',
  // IMPORTANT : remplacez la chaîne ci‑dessous par le SHA256 hex du (motDePasse + salt)
  EXPECTED_HASH: 'bb58f0471dac25dc294e8af3f6b8dba28c302dee3b3ce24a69c1914462dee954'
};

let cfg = { ...DEFAULT };
let els = {};
let api = {};
let state = { open: false, unlocked: false, sessionKey: null, snapshot: {} };

/* util : sha-256 -> hex */
async function sha256Hex(str) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ensure modal exists and contains expected structure even if devModal div exists in HTML */
function ensureModal(id) {
  let modal = document.getElementById(id);
  const needsPopulate = !modal || !modal.querySelector(`#${id}-main`);
  if (!modal) {
    modal = document.createElement('div');
    modal.id = id;
    document.body.appendChild(modal);
  }
  if (needsPopulate) {
    modal.className = cfg.modalClass;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-hidden', 'true');
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="${cfg.modalContentClass}" role="document">
        <button class="${cfg.closeBtnClass}" aria-label="Fermer">✕</button>
        <header><h2>Mode développeur</h2><p id="${id}-status">Initialisation...</p></header>
        <main id="${id}-main" class="dev-main" tabindex="0"></main>
        <footer class="dev-footer" style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
          <button id="${id}-btn-apply" class="btn">Appliquer</button>
          <button id="${id}-btn-lock" class="btn">Fermer et verrouiller</button>
        </footer>
      </div>
    `;
    injectStyles();
  }
  return modal;
}

/* minimal styles injected for self-containment */
function injectStyles() {
  if (document.getElementById('dev-modal-styles')) return;
  const css = `
    .${cfg.modalClass} { position:fixed; inset:0; display:none; align-items:center; justify-content:center; background:rgba(0,0,0,.55); z-index:10000; }
    .${cfg.modalContentClass} { background:#0e1117; color:#e6eef8; padding:14px; border-radius:8px; width:calc(100% - 48px); max-width:920px; position:relative; box-shadow:0 8px 24px rgba(0,0,0,.6); }
    .${cfg.closeBtnClass} { position:absolute; right:12px; top:12px; background:transparent; border:0; color:#cbd5e1; font-size:18px; cursor:pointer; }
    .dev-main { max-height:70vh; overflow:auto; margin-top:8px; }
    .dev-section { margin:10px 0; }
    .dev-row { display:flex; gap:8px; align-items:center; margin:8px 0; flex-wrap:wrap; }
    .dev-row label { min-width:140px; color:#cbd5e1; }
    .dev-row input, .dev-row textarea, .dev-row select { background:#0b0d10; color:#e6eef8; border:1px solid #24303a; padding:6px 8px; border-radius:4px; }
    .dev-footer .btn { background:#132032; color:#e6eef8; border:0; padding:6px 10px; border-radius:6px; cursor:pointer; }
  `;
  const s = document.createElement('style');
  s.id = 'dev-modal-styles';
  s.textContent = css;
  document.head.appendChild(s);
}

/* open/close modal */
function openModal(modal) {
  if (!modal) return;
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden', 'false');
  document.documentElement.style.overflow = 'hidden';
  state.open = true;
  const first = modal.querySelector('input,button,textarea,select');
  if (first) first.focus();
}
function closeModal(modal) {
  if (!modal) return;
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
  document.documentElement.style.overflow = '';
  state.open = false;
  // always lock on close as requested
  state.unlocked = false;
  state.sessionKey = null;
}

/* Build U I without JSON: editable controls for known variables */
function buildMain(modal) {
  const main = modal.querySelector(`#${modal.id}-main`);
  if (!main) return;
  main.innerHTML = '';

  // Acquire current game state from provided API or common globals
  let cur = {};
  try {
    if (api.getState) cur = api.getState() || {};
    else if (window.gameState) cur = window.gameState;
    else if (window.state) cur = window.state;
    else if (window.store && typeof window.store.getState === 'function') cur = window.store.getState();
    else cur = {};
  } catch (e) { cur = {}; }

  // Normalize expected editable vars with safe defaults (common names found in clicker projects)
  const editable = {
    points: Number(cur.points ?? cur.coins ?? cur.score ?? 0),
    autoClicks: Number(cur.autoClicks ?? cur.auto ?? cur.cps ?? 0),
    clickPower: Number((cur.multipliers && cur.multipliers.clickPower) ?? cur.clickPower ?? cur.click_power ?? 1),
    autoPower: Number((cur.multipliers && cur.multipliers.autoPower) ?? cur.autoPower ?? 1),
    version: cur.version ?? document.getElementById('versionText')?.textContent ?? '',
    // upgrades/items: keep as JSON textarea but not exported/imported
    upgrades: cur.upgrades ?? cur.items ?? {},
  };

  state.snapshot = JSON.parse(JSON.stringify(editable));

  // Session status
  const prot = !!cfg.EXPECTED_HASH && cfg.EXPECTED_HASH !== 'REPLACE_WITH_SHA256_HEX_OF_PASSWORD_PLUS_SALT';
  const sessHtml = `
    <section class="dev-section">
      <h3>Session</h3>
      <div class="dev-row"><label>Protection</label><span id="${modal.id}-prot">${prot ? 'Activée' : 'Désactivée'}</span></div>
      <div class="dev-row"><label>Code</label><input id="${modal.id}-pwd" type="password" placeholder="${prot ? 'Entrez le code' : 'Aucun code configuré'}" /><button id="${modal.id}-btn-unlock" class="btn">${prot ? 'Entrer' : 'Déverrouiller'}</button></div>
    </section>
  `;
  main.insertAdjacentHTML('beforeend', sessHtml);

  // Variables
  const varsHtml = `
    <section class="dev-section">
      <h3>Variables</h3>
      <div class="dev-row"><label>Points</label><input id="${modal.id}-points" type="number" value="${escapeHtml(editable.points)}" /></div>
      <div class="dev-row"><label>Clics/s</label><input id="${modal.id}-autoClicks" type="number" value="${escapeHtml(editable.autoClicks)}" /></div>
      <div class="dev-row"><label>Click Power</label><input id="${modal.id}-clickPower" type="number" step="0.1" value="${escapeHtml(editable.clickPower)}" /></div>
      <div class="dev-row"><label>Auto Power</label><input id="${modal.id}-auto-power" type="number" step="0.1" value="${escapeHtml(editable.autoPower)}" /></div>
      <div class="dev-row"><label>Version</label><input id="${modal.id}-version" type="text" value="${escapeHtml(editable.version)}" /></div>
    </section>
  `;
  main.insertAdjacentHTML('beforeend', varsHtml);

  // Upgrades / items editable as textarea for convenience (no JSON import/export in UI)
  const upgradesHtml = `
    <section class="dev-section">
      <h3>Upgrades / Items</h3>
      <div class="dev-row"><label>Editeur</label><textarea id="${modal.id}-upgrades" rows="6" style="min-width:360px;">${escapeHtml(JSON.stringify(editable.upgrades, null, 2))}</textarea></div>
    </section>
  `;
  main.insertAdjacentHTML('beforeend', upgradesHtml);

  // Wire buttons
  wireMainButtons(modal);
  updateStatus(modal, 'Prêt');
}

/* Wire actions: unlock via prompt flow, apply, close(lock) */
function wireMainButtons(modal) {
  const pwdBtn = modal.querySelector(`#${modal.id}-btn-unlock`);
  const pwdInput = modal.querySelector(`#${modal.id}-pwd`);
  const applyBtn = modal.querySelector(`#${modal.id}-btn-apply`);
  const lockBtn = modal.querySelector(`#${modal.id}-btn-lock`);
  const closeBtn = modal.querySelector(`.${cfg.closeBtnClass}`);

  // Unlock flow: use prompt if no input value present (prompt first-use); simpler UI: prompt then open menu content
  if (pwdBtn) {
    pwdBtn.addEventListener('click', async () => {
      const prot = !!cfg.EXPECTED_HASH && cfg.EXPECTED_HASH !== 'REPLACE_WITH_SHA256_HEX_OF_PASSWORD_PLUS_SALT';
      let code = pwdInput.value || '';
      if (!code) {
        // use prompt for convenience (requesting user input in a popup)
        code = prompt('Entrez le code développeur :') || '';
      }
      if (!prot) {
        // no password configured at build time -> unlock freely
        state.unlocked = true;
        state.sessionKey = 'session_nopw_' + Date.now();
        updateStatus(modal, 'Déverrouillé (aucun code configuré)');
        buildMain(modal); // refresh UI
        return;
      }
      // verify
      const candidate = await sha256Hex(code + cfg.salt);
      if (candidate === cfg.EXPECTED_HASH) {
        state.unlocked = true;
        state.sessionKey = 'session_' + Math.random().toString(36).slice(2);
        updateStatus(modal, 'Code correct — menu ouvert');
        // Display variables now (rebuild to reflect unlocked state)
        buildMain(modal);
      } else {
        updateStatus(modal, 'Code incorrect');
        // keep locked; do not open
      }
    });
  }

  // Apply changes: only if unlocked or no protection configured
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      const prot = !!cfg.EXPECTED_HASH && cfg.EXPECTED_HASH !== 'REPLACE_WITH_SHA256_HEX_OF_PASSWORD_PLUS_SALT';
      if (prot && !state.unlocked) return updateStatus(modal, 'Verrouillé — entrez le code pour appliquer');
      const main = modal.querySelector(`#${modal.id}-main`);
      if (!main) return;
      const points = Number(main.querySelector(`#${modal.id}-points`).value || 0);
      const autoClicks = Number(main.querySelector(`#${modal.id}-autoClicks`).value || 0);
      const clickPower = Number(main.querySelector(`#${modal.id}-click-power`).value || main.querySelector(`#${modal.id}-click-power`)?.value || 1);
      const autoPower = Number(main.querySelector(`#${modal.id}-auto-power`).value || 1);
      const version = main.querySelector(`#${modal.id}-version`).value || '';
      let upgrades;
      try { upgrades = JSON.parse(main.querySelector(`#${modal.id}-upgrades`).value || '{}'); } catch (e) { return updateStatus(modal, 'JSON Upgrades invalide'); }

      const changes = {
        points, autoClicks,
        multipliers: { clickPower, autoPower },
        upgrades, version
      };

      // apply via api if fourni
      try {
        if (api.setState) api.setState(changes);
        else if (api.applyChanges) api.applyChanges(changes);
        else {
          // best-effort: try to mutate common globals
          if (window.gameState) Object.assign(window.gameState, changes);
          if (window.state) Object.assign(window.state, changes);
          if (document.getElementById('pointsValue')) document.getElementById('pointsValue').textContent = String(points);
          if (document.getElementById('autoClicksValue')) document.getElementById('autoClicksValue').textContent = String(autoClicks);
          if (document.getElementById('versionText')) document.getElementById('versionText').textContent = String(version);
        }
        updateStatus(modal, 'Modifications appliquées');
      } catch (e) {
        updateStatus(modal, 'Erreur lors de l\'application');
      }
    });
  }

  // Close and lock always locks
  const doLockAndClose = () => {
    closeModal(els.devModal);
    state.unlocked = false;
    state.sessionKey = null;
    updateStatus(els.devModal, 'Fermé et verrouillé');
  };
  if (lockBtn) lockBtn.addEventListener('click', doLockAndClose);
  if (closeBtn) closeBtn.addEventListener('click', doLockAndClose);
}

/* Public init: binds trigger click to prompt -> show modal if code correct */
export function initDevMenu(options = {}) {
  cfg = { ...cfg, ...options };
  if (options.api) api = options.api;
  els.devTrigger = document.getElementById(cfg.devTriggerId);
  els.devModal = ensureModal(cfg.devModalId);

  // attach trigger: on click ask for code via prompt and then show modal if OK
  if (els.devTrigger) {
    els.devTrigger.addEventListener('click', async (e) => {
      e.preventDefault();
      // open flow: prompt for code first (user asked for popup)
      const prot = !!cfg.EXPECTED_HASH && cfg.EXPECTED_HASH !== 'REPLACE_WITH_SHA256_HEX_OF_PASSWORD_PLUS_SALT';
      let code = prompt('Entrez le code développeur :') || '';
      if (!prot) {
        // no code configured -> open directly
        buildMain(els.devModal);
        openModal(els.devModal);
        return;
      }
      const candidate = await sha256Hex((code || '') + cfg.salt);
      if (candidate === cfg.EXPECTED_HASH) {
        state.unlocked = true;
        state.sessionKey = 'session_' + Math.random().toString(36).slice(2);
        buildMain(els.devModal);
        openModal(els.devModal);
        updateStatus(els.devModal, 'Déverrouillé');
      } else {
        updateStatus(els.devModal, 'Code incorrect');
        // brief visual feedback: open modal for status then auto-close after 1200ms
        buildMain(els.devModal);
        openModal(els.devModal);
        setTimeout(() => { closeModal(els.devModal); }, 1200);
      }
    });
  }

  // close by clicking outside
  els.devModal.addEventListener('click', (e) => {
    const content = els.devModal.querySelector(`.${cfg.modalContentClass}`);
    if (content && !content.contains(e.target)) {
      closeModal(els.devModal);
      state.unlocked = false;
      state.sessionKey = null;
    }
  });

  // Esc closes (and locks)
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Escape' || e.key === 'Esc') && state.open) {
      closeModal(els.devModal);
      state.unlocked = false;
      state.sessionKey = null;
    }
  });

  // expose minimal console helpers
  if (typeof window !== 'undefined') {
    window.__CLICKER_DEV__ = {
      open: () => { buildMain(els.devModal); openModal(els.devModal); },
      close: () => { closeModal(els.devModal); state.unlocked = false; state.sessionKey = null; },
      computeHash: async (pwd) => await sha256Hex(pwd + cfg.salt),
      cfg,
      state
    };
  }
  return { cfg, els, state };
}

/* helpers */
function updateStatus(modal, text) {
  const id = modal && modal.id ? modal.id : cfg.devModalId;
  const el = document.getElementById(`${id}-status`);
  if (el) el.textContent = text;
}
function escapeHtml(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
export { openModal as openDev, closeModal as closeDev };
