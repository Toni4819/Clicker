// menus/dev.js

const DEFAULT = {
  devTriggerId: 'devTrigger',
  devModalId: 'devModal',
  pwdModalId: 'devPwdModal',
  modalClass: 'dev-modal',
  modalContentClass: 'dev-modal__content',
  closeBtnClass: 'dev-modal__close',
  salt: 'X9!a#',
  // Replace with real hex: SHA256(password + salt)
  EXPECTED_HASH: 'bb58f0471dac25dc294e8af3f6b8dba28c302dee3b3ce24a69c1914462dee954',
};

// canonical variables discovered in repo (main.js / upgrades / rebirth / stats)
const KNOWN_KEYS = [
  'points', 'pointsPerClick', 'autoClickers',
  'machinesLevel1','machinesLevel2','machinesLevel3','machinesLevel4','machinesLevel5',
  'machinesLevel6','machinesLevel7','machinesLevel8','machinesLevel9','machinesLevel10',
  'machinesLevel11','machinesLevel12','machinesLevel13','machinesLevel14','machinesLevel15',
  'machinesLevel16','machinesLevel17','machinesLevel18','machinesLevel19','machinesLevel20',
  'shopBoost','tempShopBoostFactor','tempShopBoostExpiresAt',
  'rebirths'
];

let cfg = { ...DEFAULT };
let els = {};
let api = {};
let session = { unlocked: false, key: null, open: false };

/* ---------- crypto helper ---------- */
async function sha256Hex(str) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

/* ---------- DOM helpers & styles ---------- */
function injectStyles() {
  if (document.getElementById('dev-modal-styles')) return;
  const css = `
  .${cfg.modalClass} { position:fixed; inset:0; display:none; align-items:center; justify-content:center; background:rgba(0,0,0,.55); z-index:10000; }
  .${cfg.modalContentClass} { background:#0e1117; color:#e6eef8; padding:14px; border-radius:8px; width:calc(100% - 48px); max-width:980px; position:relative; box-shadow:0 8px 24px rgba(0,0,0,.6); }
  .${cfg.closeBtnClass} { position:absolute; right:12px; top:12px; background:transparent; border:0; color:#cbd5e1; font-size:18px; cursor:pointer; }
  .dev-section { margin:10px 0; }
  .dev-row { display:flex; gap:8px; align-items:center; margin:8px 0; flex-wrap:wrap; }
  .dev-row label { min-width:160px; color:#cbd5e1; }
  .dev-row input, .dev-row textarea, .dev-row select { background:#0b0d10; color:#e6eef8; border:1px solid #24303a; padding:6px 8px; border-radius:4px; }
  .dev-footer { display:flex; gap:8px; justify-content:flex-end; margin-top:10px; }
  .dev-footer .btn { background:#132032; color:#e6eef8; border:0; padding:6px 10px; border-radius:6px; cursor:pointer; }
  .dev-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
  .pwd-modal { position:fixed; inset:0; display:none; align-items:center; justify-content:center; background:rgba(0,0,0,.55); z-index:11000; }
  .pwd-card { background:#0e1117; padding:16px; border-radius:8px; width:320px; box-shadow:0 8px 24px rgba(0,0,0,.6); color:#e6eef8; }
  `;
  const s = document.createElement('style');
  s.id = 'dev-modal-styles';
  s.textContent = css;
  document.head.appendChild(s);
}

/* ---------- ensure modal nodes exist ---------- */
function ensureDevModal() {
  let modal = document.getElementById(cfg.devModalId);
  const needsPopulate = !modal || !modal.querySelector(`#${cfg.devModalId}-main`);
  if (!modal) {
    modal = document.createElement('div');
    modal.id = cfg.devModalId;
    document.body.appendChild(modal);
  }
  if (needsPopulate) {
    modal.className = cfg.modalClass;
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.setAttribute('aria-hidden','true');
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="${cfg.modalContentClass}" role="document">
        <button class="${cfg.closeBtnClass}" aria-label="Fermer">✕</button>
        <header><h2>Mode Développeur</h2><p id="${cfg.devModalId}-status">Prêt</p></header>
        <main id="${cfg.devModalId}-main" class="dev-main" tabindex="0"></main>
        <div class="dev-footer">
          <button id="${cfg.devModalId}-apply" class="btn">Appliquer</button>
          <button id="${cfg.devModalId}-close-lock" class="btn">Fermer et verrouiller</button>
        </div>
      </div>
    `;
  }
  return modal;
}

function ensurePwdModal() {
  let pm = document.getElementById(cfg.pwdModalId);
  if (pm) return pm;
  pm = document.createElement('div');
  pm.id = cfg.pwdModalId;
  pm.className = 'pwd-modal';
  pm.innerHTML = `
    <div class="pwd-card" role="dialog" aria-modal="true" aria-labelledby="${cfg.pwdModalId}-title">
      <h3 id="${cfg.pwdModalId}-title">Code développeur</h3>
      <div style="margin-top:8px;">
        <label for="${cfg.pwdModalId}-input" style="display:block;margin-bottom:6px;color:#cbd5e1">Entrer le code</label>
        <input id="${cfg.pwdModalId}-input" type="password" autocomplete="new-password" style="width:100%;box-sizing:border-box" />
      </div>
      <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end;">
        <button id="${cfg.pwdModalId}-cancel" class="btn">Annuler</button>
        <button id="${cfg.pwdModalId}-ok" class="btn">OK</button>
      </div>
    </div>
  `;
  document.body.appendChild(pm);
  return pm;
}

/* ---------- open/close logic (lock on close) ---------- */
function openModal(modal) {
  if (!modal) return;
  modal.style.display = 'flex';
  modal.setAttribute('aria-hidden','false');
  document.documentElement.style.overflow = 'hidden';
  session.open = true;
  const first = modal.querySelector('input,button,textarea,select');
  if (first) first.focus();
}
function closeModal(modal) {
  if (!modal) return;
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden','true');
  document.documentElement.style.overflow = '';
  session.open = false;
  // always lock on close
  session.unlocked = false;
  session.key = null;
}

/* ---------- get and normalize state from api or globals ---------- */
function readGameState() {
  let cur = {};
  try {
    if (api.getState) cur = api.getState() || {};
    else if (window.state) cur = window.state;
    else if (window.gameState) cur = window.gameState;
    else cur = {};
  } catch (e) { cur = {}; }
  // Build normalized object with known keys
  const out = {};
  for (const k of KNOWN_KEYS) {
    out[k] = k in cur ? cur[k] : 0;
  }
  // keep upgrades structure if present
  out.upgrades = cur.upgrades ?? cur.items ?? {};
  return { raw: cur, normalized: out };
}

/* ---------- build dev UI with explicit controls ---------- */
function buildDevMain(modal) {
  const main = modal.querySelector(`#${cfg.devModalId}-main`);
  if (!main) return;
  main.innerHTML = '';

  const { raw, normalized } = readGameState();

  // Session status row
  const prot = !!cfg.EXPECTED_HASH && cfg.EXPECTED_HASH !== 'REPLACE_WITH_SHA256_HEX_OF_PASSWORD_PLUS_SALT';
  const sessionHtml = `
    <section class="dev-section">
      <div class="dev-row"><label>Protection</label><span>${prot ? 'Activée' : 'Désactivée'}</span></div>
      <div class="dev-row"><label>Session</label><span id="${cfg.devModalId}-session">${session.unlocked ? 'Déverrouillée' : 'Verrouillée'}</span></div>
    </section>
  `;
  main.insertAdjacentHTML('beforeend', sessionHtml);

  // Grid of primitive variables (two columns)
  const vars = KNOWN_KEYS.slice(0, 14); // show main ones first
  let gridHtml = `<section class="dev-section"><h3>Variables clés</h3><div class="dev-grid">`;
  for (const key of vars) {
    gridHtml += `<div class="dev-row"><label for="${cfg.devModalId}-${key}">${key}</label><input id="${cfg.devModalId}-${key}" type="number" value="${escapeHtml(normalized[key] ?? 0)}" /></div>`;
  }
  gridHtml += `</div></section>`;
  main.insertAdjacentHTML('beforeend', gridHtml);

  // Machines rest (if any remaining)
  const machinesRest = KNOWN_KEYS.slice(14);
  if (machinesRest.length) {
    let mHtml = `<section class="dev-section"><h3>Autres machines</h3><div class="dev-grid">`;
    for (const key of machinesRest) {
      mHtml += `<div class="dev-row"><label for="${cfg.devModalId}-${key}">${key}</label><input id="${cfg.devModalId}-${key}" type="number" value="${escapeHtml(normalized[key] ?? 0)}" /></div>`;
    }
    mHtml += `</div></section>`;
    main.insertAdjacentHTML('beforeend', mHtml);
  }

  // multipliers / misc
  const multHtml = `
    <section class="dev-section">
      <h3>Multiplicateurs & version</h3>
      <div class="dev-row"><label for="${cfg.devModalId}-pointsPerClick">pointsPerClick</label><input id="${cfg.devModalId}-pointsPerClick" type="number" step="0.1" value="${escapeHtml(normalized.pointsPerClick ?? 1)}" /></div>
      <div class="dev-row"><label for="${cfg.devModalId}-shopBoost">shopBoost</label><input id="${cfg.devModalId}-shopBoost" type="number" step="0.1" value="${escapeHtml(normalized.shopBoost ?? 1)}" /></div>
      <div class="dev-row"><label for="${cfg.devModalId}-tempShopBoostFactor">tempShopBoostFactor</label><input id="${cfg.devModalId}-tempShopBoostFactor" type="number" step="0.1" value="${escapeHtml(normalized.tempShopBoostFactor ?? 1)}" /></div>
      <div class="dev-row"><label for="${cfg.devModalId}-rebirths">rebirths</label><input id="${cfg.devModalId}-rebirths" type="number" value="${escapeHtml(normalized.rebirths ?? 0)}" /></div>
    </section>
  `;
  main.insertAdjacentHTML('beforeend', multHtml);

  // upgrades / items editor as interactive (no raw JSON apply)
  const upgradesVal = JSON.stringify(normalized.upgrades || {}, null, 2);
  const upgradesHtml = `
    <section class="dev-section">
      <h3>Upgrades / Items (éditeur)</h3>
      <div class="dev-row"><label for="${cfg.devModalId}-upgrades">Editeur</label><textarea id="${cfg.devModalId}-upgrades" rows="8" style="min-width:360px;">${escapeHtml(upgradesVal)}</textarea></div>
    </section>
  `;
  main.insertAdjacentHTML('beforeend', upgradesHtml);

  // wire footer buttons
  wireDevButtons(modal, raw);
}

/* ---------- wire apply + close buttons ---------- */
function wireDevButtons(modal, rawStateRef) {
  const applyBtn = modal.querySelector(`#${cfg.devModalId}-apply`);
  const closeLockBtn = modal.querySelector(`#${cfg.devModalId}-close-lock`);
  const closeBtn = modal.querySelector(`.${cfg.closeBtnClass}`);

  const doApply = () => {
    // only if unlocked or no protection configured
    const prot = !!cfg.EXPECTED_HASH && cfg.EXPECTED_HASH !== 'REPLACE_WITH_SHA256_HEX_OF_PASSWORD_PLUS_SALT';
    if (prot && !session.unlocked) {
      updateStatus(modal, 'Verrouillé — entrez le code');
      return;
    }

    // Build changes object from inputs
    const changes = {};
    for (const k of KNOWN_KEYS) {
      const el = document.getElementById(`${cfg.devModalId}-${k}`);
      if (el) {
        const val = Number(el.value);
        changes[k] = Number.isFinite(val) ? val : (rawStateRef[k] ?? 0);
      }
    }

    // multipliers and misc
    const ppcEl = document.getElementById(`${cfg.devModalId}-pointsPerClick`);
    if (ppcEl) changes.pointsPerClick = Number(ppcEl.value) || 1;
    const shopBoostEl = document.getElementById(`${cfg.devModalId}-shopBoost`);
    if (shopBoostEl) changes.shopBoost = Number(shopBoostEl.value) || 1;
    const tmpEl = document.getElementById(`${cfg.devModalId}-tempShopBoostFactor`);
    if (tmpEl) changes.tempShopBoostFactor = Number(tmpEl.value) || 1;
    const rebEl = document.getElementById(`${cfg.devModalId}-rebirths`);
    if (rebEl) changes.rebirths = Number(rebEl.value) || 0;

    // upgrades textarea: parse, but do not allow malformed JSON
    const upTxt = document.getElementById(`${cfg.devModalId}-upgrades`).value;
    let parsedUpgrades = null;
    try { parsedUpgrades = JSON.parse(upTxt || '{}'); changes.upgrades = parsedUpgrades; }
    catch (e) { updateStatus(modal, 'JSON Upgrades invalide'); return; }

    // apply via api.setState if provided, else mutate globals best-effort
    try {
      if (api.setState) {
        api.setState(changes);
        if (api.save) api.save();
        if (api.renderMain) api.renderMain();
      } else {
        // try to merge into known global objects
        if (window.state) Object.assign(window.state, changes);
        if (window.gameState) Object.assign(window.gameState, changes);
        // ensure UI updates
        if (document.getElementById('pointsValue')) document.getElementById('pointsValue').textContent = String(changes.points ?? window.state?.points ?? window.gameState?.points ?? 0);
        if (document.getElementById('autoClicksValue')) document.getElementById('autoClicksValue').textContent = String(changes.autoClickers ?? changes.autoClicks ?? window.state?.autoClickers ?? 0);
        if (api.save) api.save();
        if (api.renderMain) api.renderMain();
      }
      updateStatus(modal, 'Modifications appliquées');
    } catch (e) {
      console.error(e);
      updateStatus(modal, 'Erreur lors de l\'application');
    }
  };

  const doCloseLock = () => {
    closeModal(modal);
    session.unlocked = false;
    session.key = null;
    updateStatus(modal, 'Fermé et verrouillé');
  };

  if (applyBtn) { applyBtn.onclick = doApply; }
  if (closeLockBtn) { closeLockBtn.onclick = doCloseLock; }
  if (closeBtn) { closeBtn.onclick = doCloseLock; }
}

/* ---------- password modal flow (modal input, OK/Cancel) ---------- */
function openPasswordModal(onOk, onCancel) {
  const pm = ensurePwdModal();
  pm.style.display = 'flex';
  const input = pm.querySelector(`#${cfg.pwdModalId}-input`);
  const ok = pm.querySelector(`#${cfg.pwdModalId}-ok`);
  const cancel = pm.querySelector(`#${cfg.pwdModalId}-cancel`);
  input.value = '';
  input.focus();

  const cleanup = () => {
    ok.onclick = null;
    cancel.onclick = null;
    pm.style.display = 'none';
  };

  ok.onclick = () => {
    const v = input.value || '';
    cleanup();
    onOk(v);
  };
  cancel.onclick = () => {
    cleanup();
    if (onCancel) onCancel();
  };
}

/* ---------- trigger flow: show password modal, verify, then show dev menu ---------- */
async function handleTriggerClick(e) {
  e.preventDefault();
  const prot = !!cfg.EXPECTED_HASH && cfg.EXPECTED_HASH !== 'REPLACE_WITH_SHA256_HEX_OF_PASSWORD_PLUS_SALT';
  // if no protection configured, open directly
  if (!prot) {
    const dm = ensureDevModal();
    buildDevMain(dm);
    openModal(dm);
    return;
  }
  // show password modal
  openPasswordModal(async (entered) => {
    const candidate = await sha256Hex((entered || '') + cfg.salt);
    if (candidate === cfg.EXPECTED_HASH) {
      session.unlocked = true;
      session.key = 's_' + Math.random().toString(36).slice(2);
      const dm = ensureDevModal();
      buildDevMain(dm);
      openModal(dm);
      updateStatus(dm, 'Code correct — menu ouvert');
    } else {
      // brief feedback: open small status then close
      const dm = ensureDevModal();
      buildDevMain(dm);
      updateStatus(dm, 'Code incorrect');
      openModal(dm);
      setTimeout(() => { closeModal(dm); updateStatus(dm, 'Fermé'); }, 1100);
    }
  }, () => {
    // canceled
  });
}

/* ---------- utilities ---------- */
function updateStatus(modal, text) {
  const el = document.getElementById(`${cfg.devModalId}-status`);
  if (el) el.textContent = text;
}
function escapeHtml(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

/* ---------- public init ---------- */
export function initDevMenu(options = {}) {
  cfg = { ...cfg, ...options };
  if (options.api) api = options.api;
  injectStyles();
  els.devTrigger = document.getElementById(cfg.devTriggerId);
  els.devModal = ensureDevModal();
  ensurePwdModal();

  if (els.devTrigger) {
    els.devTrigger.addEventListener('click', handleTriggerClick);
  } else {
    console.warn('initDevMenu: #devTrigger introuvable');
  }

  // clicking outside modal closes + locks
  els.devModal.addEventListener('click', (ev) => {
    const content = els.devModal.querySelector(`.${cfg.modalContentClass}`);
    if (content && !content.contains(ev.target)) {
      closeModal(els.devModal);
      session.unlocked = false;
      session.key = null;
    }
  });

  // ESC closes + locks
  document.addEventListener('keydown', (ev) => {
    if ((ev.key === 'Escape' || ev.key === 'Esc') && session.open) {
      closeModal(els.devModal);
      session.unlocked = false;
      session.key = null;
    }
  });

  // expose helpers for debugging
  if (typeof window !== 'undefined') {
    window.__CLICKER_DEV__ = {
      computeHash: async (pwd) => await sha256Hex(pwd + cfg.salt),
      open: () => { buildDevMain(els.devModal); openModal(els.devModal); },
      close: () => { closeModal(els.devModal); session.unlocked = false; session.key = null; },
      session,
      cfg
    };
  }
  return { cfg, els, session };
}
