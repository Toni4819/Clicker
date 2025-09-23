// menus/dev.js
// Dev menu intégré pour Toni4819/Clicker
// - réutilise les styles/modals du repo (classes .modal .modal-content .modal-body .modal-header .close-btn)
// - mot de passe fixe embarqué (EXPECTED_HASH) ; entrer via modal (form/password)
// - pas d'export/import, pas de JSON brut
// - verrouille automatiquement à la fermeture
// Remplace DEFAULT.EXPECTED_HASH par SHA256(motDePasse + salt) avant prod.

const DEFAULT = {
  devTriggerId: 'devTrigger',
  devModalId: 'devModal',
  pwdModalId: 'devPwdModal',
  salt: 'X9!a#',
  // remplacer par SHA256(password + salt)
  EXPECTED_HASH: 'bb58f0471dac25dc294e8af3f6b8dba28c302dee3b3ce24a69c1914462dee954'
};

const KNOWN_KEYS = [
  'points','pointsPerClick','autoClickers','autoClicks','rebirths',
  'shopBoost','tempShopBoostFactor',
  'machinesLevel1','machinesLevel2','machinesLevel3','machinesLevel4','machinesLevel5',
  'machinesLevel6','machinesLevel7','machinesLevel8','machinesLevel9','machinesLevel10',
  'version'
];

let cfg = { ...DEFAULT };
let api = {};
let session = { unlocked: false, key: null, open: false };

/* ---------- crypto helper ---------- */
async function sha256Hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ---------- ensure modals use same structure as upgrades.js ---------- */
function ensureDevModal() {
  let modal = document.getElementById(cfg.devModalId);
  const needPopulate = !modal || !modal.querySelector(`#${cfg.devModalId}-body`);
  if (!modal) {
    modal = document.createElement('div');
    modal.id = cfg.devModalId;
    document.body.appendChild(modal);
  }
  if (needPopulate) {
    modal.className = 'modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="modal-content" role="document">
        <header class="modal-header">
          <h2 id="${cfg.devModalId}-title">🛠 Mode développeur</h2>
          <button id="${cfg.devModalId}-close" class="close-btn" aria-label="Fermer">✕</button>
        </header>
        <div class="modal-body" id="${cfg.devModalId}-body" style="padding:12px;max-height:75vh;overflow:auto"></div>
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
  pm.className = 'modal';
  pm.setAttribute('aria-hidden', 'true');
  pm.innerHTML = `
    <div class="modal-content" role="document" style="max-width:360px">
      <header class="modal-header">
        <h2 id="${cfg.pwdModalId}-title">🔐 Code développeur</h2>
        <button id="${cfg.pwdModalId}-x" class="close-btn" aria-label="Fermer">✕</button>
      </header>
      <div class="modal-body" style="padding:12px">
        <form id="${cfg.pwdModalId}-form" autocomplete="off" novalidate>
          <label for="${cfg.pwdModalId}-input" style="display:block;margin-bottom:6px;color:var(--muted)">Entrez le code</label>
          <input id="${cfg.pwdModalId}-input" type="password" autocomplete="new-password" style="width:100%;box-sizing:border-box;padding:8px;border-radius:10px;border:1px solid var(--border)" />
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">
            <button id="${cfg.pwdModalId}-cancel" type="button" class="btn">Annuler</button>
            <button id="${cfg.pwdModalId}-ok" type="submit" class="btn">OK</button>
          </div>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(pm);
  return pm;
}

/* ---------- open/close helpers (manage focus to avoid aria-hidden focus problem) ---------- */
function openModal(node) {
  if (!node) return;
  node.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  session.open = true;
  // focus first focusable element inside modal after paint
  requestAnimationFrame(() => {
    const ff = node.querySelector('input,button,select,textarea,[tabindex]:not([tabindex="-1"])');
    if (ff) ff.focus();
  });
}
function closeModal(node) {
  if (!node) return;
  // remove focus from any focused descendant before hiding to avoid blocked aria-hidden
  try {
    const active = node.querySelector(':focus');
    if (active) active.blur();
  } catch (e) { /* ignore selector errors */ }
  node.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  session.open = false;
  session.unlocked = false;
  session.key = null;
  // return focus to trigger if present
  const trigger = document.getElementById(cfg.devTriggerId);
  if (trigger) trigger.focus();
}

/* ---------- read game state (best-effort using provided api or common globals) ---------- */
function readGameState() {
  let cur = {};
  try {
    if (api.getState) cur = api.getState() || {};
    else if (window.state) cur = window.state;
    else if (window.gameState) cur = window.gameState;
    else if (window.store && typeof window.store.getState === 'function') cur = window.store.getState();
  } catch (e) { cur = {}; }
  // normalized object
  const norm = {};
  for (const k of KNOWN_KEYS) norm[k] = (k in cur) ? cur[k] : 0;
  norm.upgrades = cur.upgrades ?? cur.items ?? {};
  return { raw: cur, norm };
}

/* ---------- build modal body (compact, no JSON section) ---------- */
function buildDevBody(modal) {
  const body = modal.querySelector(`#${cfg.devModalId}-body`);
  if (!body) return;
  body.innerHTML = '';

  const { raw, norm } = readGameState();
  const prot = !!cfg.EXPECTED_HASH && cfg.EXPECTED_HASH !== 'REPLACE_WITH_SHA256_HEX_OF_PASSWORD_PLUS_SALT';

  // status row
  const statusRow = document.createElement('div');
  statusRow.className = 'section';
  statusRow.innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:12px;align-items:center">
      <div><div class="section-title">Protection</div><div style="color:var(--muted)">${prot ? 'Activée' : 'Désactivée'}</div></div>
      <div><div class="section-title">Session</div><div id="${cfg.devModalId}-session" style="color:var(--muted)">${session.unlocked ? 'Déverrouillée' : 'Verrouillée'}</div></div>
    </div>
  `;
  body.appendChild(statusRow);

  // compact grid of inputs using same look as inputs in style.css
  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = '1fr 1fr';
  grid.style.gap = '10px';
  grid.style.alignItems = 'start';
  // for small screens fallback to single column via inline media query using CSS is preferred, but keep compact here
  for (const key of KNOWN_KEYS) {
    const wrapper = document.createElement('div');
    wrapper.className = 'section';
    const label = document.createElement('label');
    label.textContent = key;
    label.style.display = 'block';
    label.style.marginBottom = '6px';
    label.style.color = 'var(--muted)';
    const input = document.createElement('input');
    input.type = (key === 'version') ? 'text' : 'number';
    input.id = `${cfg.devModalId}-${key}`;
    input.value = norm[key] ?? 0;
    input.style.width = '100%';
    input.style.boxSizing = 'border-box';
    wrapper.appendChild(label);
    wrapper.appendChild(input);
    grid.appendChild(wrapper);
  }
  body.appendChild(grid);

  // upgrades: render minimal editor line (no raw big JSON)
  const upSec = document.createElement('div');
  upSec.className = 'section';
  upSec.innerHTML = `<div class="section-title">Upgrades / Items</div>`;
  // try to build simple editable list if upgrades object is simple
  const upObj = norm.upgrades || {};
  if (upObj && typeof upObj === 'object' && !Array.isArray(upObj)) {
    const list = document.createElement('div');
    list.style.display = 'grid';
    list.style.gap = '8px';
    list.style.marginTop = '8px';
    const keys = Object.keys(upObj).slice(0, 30);
    if (keys.length === 0) {
      list.innerHTML = `<div style="color:var(--muted)">Aucun upgrade détecté</div>`;
    } else {
      keys.forEach(k => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '8px';
        row.style.alignItems = 'center';
        const label = document.createElement('div');
        label.textContent = k;
        label.style.flex = '1';
        label.style.color = 'var(--muted)';
        const inp = document.createElement('input');
        inp.type = 'number';
        inp.id = `${cfg.devModalId}-up-${k}`;
        // try common fields owned/level/count
        const val = (typeof upObj[k] === 'number') ? upObj[k] : (upObj[k]?.owned ?? upObj[k]?.level ?? upObj[k]?.count ?? 0);
        inp.value = val;
        inp.style.width = '92px';
        row.appendChild(label);
        row.appendChild(inp);
        list.appendChild(row);
      });
    }
    upSec.appendChild(list);
  } else {
    upSec.innerHTML += `<div style="color:var(--muted);margin-top:8px">Structure d'upgrades non standard — aperçu non disponible</div>`;
  }
  body.appendChild(upSec);

  // footer note
  const note = document.createElement('div');
  note.className = 'section';
  note.innerHTML = `<div style="color:var(--muted);font-size:12px">Le menu se verrouille automatiquement à la fermeture.</div>`;
  body.appendChild(note);

  wireDevButtons(modal, raw);
}

/* ---------- wire apply/close (locking) ---------- */
function wireDevButtons(modal, rawRef) {
  const closeBtn = modal.querySelector(`#${cfg.devModalId}-close`);
  const applyBtn = modal.querySelector(`#${cfg.devModalId}-apply`);
  // attach apply button if not present create it in header area (upgrades.js uses refresh pattern; here place small apply at bottom if needed)
  let footerApply = modal.querySelector(`#${cfg.devModalId}-apply`);
  if (!footerApply) {
    const foot = document.createElement('div');
    foot.className = 'section';
    foot.style.display = 'flex';
    foot.style.justifyContent = 'flex-end';
    foot.style.gap = '8px';
    foot.innerHTML = `<button id="${cfg.devModalId}-apply" class="btn">Appliquer</button><button id="${cfg.devModalId}-close-lock" class="btn">Fermer et verrouiller</button>`;
    modal.querySelector('.modal-content').appendChild(foot);
    footerApply = modal.querySelector(`#${cfg.devModalId}-apply`);
  }
  const closeLockBtn = modal.querySelector(`#${cfg.devModalId}-close-lock`);

  // Apply changes
  const doApply = () => {
    const prot = !!cfg.EXPECTED_HASH && cfg.EXPECTED_HASH !== 'REPLACE_WITH_SHA256_HEX_OF_PASSWORD_PLUS_SALT';
    if (prot && !session.unlocked) {
      updateStatus(modal, 'Verrouillé — entrez le code');
      return;
    }
    // gather changes
    const changes = {};
    for (const k of KNOWN_KEYS) {
      const el = document.getElementById(`${cfg.devModalId}-${k}`);
      if (el) {
        changes[k] = (el.type === 'number') ? Number(el.value || 0) : el.value;
      }
    }
    // upgrades apply best-effort
    const upObj = {};
    const body = modal.querySelector(`#${cfg.devModalId}-body`);
    if (body) {
      const ups = Array.from(body.querySelectorAll(`[id^="${cfg.devModalId}-up-"]`));
      ups.forEach(inp => {
        const key = inp.id.replace(`${cfg.devModalId}-up-`, '');
        upObj[key] = Number(inp.value || 0);
      });
      if (Object.keys(upObj).length) changes.upgrades = upObj;
    }
    try {
      if (api.setState) {
        api.setState(changes);
        if (api.save) api.save();
        if (api.renderMain) api.renderMain();
      } else {
        if (window.state) Object.assign(window.state, changes);
        if (window.gameState) Object.assign(window.gameState, changes);
        if (document.getElementById('pointsValue')) document.getElementById('pointsValue').textContent = String(changes.points ?? window.state?.points ?? 0);
        if (api.renderMain) api.renderMain();
      }
      updateStatus(modal, 'Modifications appliquées');
    } catch (e) {
      console.error(e);
      updateStatus(modal, 'Erreur application');
    }
  };

  const doCloseLock = () => {
    closeModal(modal);
    updateStatus(modal, 'Fermé et verrouillé');
  };

  if (footerApply) footerApply.onclick = doApply;
  if (closeLockBtn) closeLockBtn.onclick = doCloseLock;
  if (closeBtn) closeBtn.onclick = doCloseLock;
}

/* ---------- password modal handling (form submission) ---------- */
function openPwdModal(onOk, onCancel) {
  const pm = ensurePwdModal();
  pm.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  pm.style.display = 'flex';
  requestAnimationFrame(() => {
    const input = pm.querySelector(`#${cfg.pwdModalId}-input`);
    if (input) input.focus();
  });

  const form = pm.querySelector(`#${cfg.pwdModalId}-form`);
  const okBtn = pm.querySelector(`#${cfg.pwdModalId}-ok`);
  const cancel = pm.querySelector(`#${cfg.pwdModalId}-cancel`);
  const x = pm.querySelector(`#${cfg.pwdModalId}-x`);

  function cleanup() {
    if (form) form.removeEventListener('submit', submitHandler);
    okBtn && (okBtn.onclick = null);
    cancel && (cancel.onclick = null);
    x && (x.onclick = null);
    pm.setAttribute('aria-hidden', 'true');
    pm.style.display = 'none';
    document.body.classList.remove('modal-open');
  }

  function submitHandler(ev) {
    ev.preventDefault();
    const value = pm.querySelector(`#${cfg.pwdModalId}-input`).value || '';
    cleanup();
    onOk(value);
  }

  form.addEventListener('submit', submitHandler);
  cancel.onclick = () => { cleanup(); if (onCancel) onCancel(); };
  x.onclick = () => { cleanup(); if (onCancel) onCancel(); };
}

/* ---------- trigger click flow: open pwd modal, verify, then show dev modal ---------- */
async function handleTriggerClick(e) {
  e.preventDefault();
  const prot = !!cfg.EXPECTED_HASH && cfg.EXPECTED_HASH !== 'REPLACE_WITH_SHA256_HEX_OF_PASSWORD_PLUS_SALT';
  if (!prot) {
    const dm = ensureDevModal();
    buildDevBody(dm);
    openModal(dm);
    return;
  }
  openPwdModal(async (entered) => {
    const candidate = await sha256Hex((entered || '') + cfg.salt);
    const dm = ensureDevModal();
    if (candidate === cfg.EXPECTED_HASH) {
      session.unlocked = true;
      session.key = 's_' + Math.random().toString(36).slice(2);
      buildDevBody(dm);
      openModal(dm);
      updateStatus(dm, 'Déverrouillé');
    } else {
      // show short feedback inside dev modal then close
      buildDevBody(dm);
      updateStatus(dm, 'Code incorrect');
      openModal(dm);
      setTimeout(() => {
        closeModal(dm);
        updateStatus(dm, 'Fermé');
      }, 900);
    }
  }, () => {
    // cancel: nothing
  });
}

/* ---------- utilities ---------- */
function updateStatus(modal, text) {
  const el = modal ? modal.querySelector(`#${cfg.devModalId}-title`) : null;
  // prefer status near title: create small status area if not present
  const status = modal ? modal.querySelector(`#${cfg.devModalId}-status`) : null;
  if (status) status.textContent = text;
  else if (el) {
    // append ephemeral small node
    let s = modal.querySelector(`#${cfg.devModalId}-status`);
    if (!s) {
      s = document.createElement('div');
      s.id = `${cfg.devModalId}-status`;
      s.style.fontSize = '13px';
      s.style.color = 'var(--muted)';
      el.parentNode.insertBefore(s, el.nextSibling);
    }
    s.textContent = text;
  }
}

function escapeHtml(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

/* ---------- public init ---------- */
export function initDevMenu(options = {}) {
  cfg = { ...cfg, ...options };
  if (options.api) api = options.api;
  // ensure modals
  const trigger = document.getElementById(cfg.devTriggerId);
  const dm = ensureDevModal();
  ensurePwdModal();

  if (trigger) trigger.addEventListener('click', handleTriggerClick);
  else console.warn('initDevMenu: #devTrigger introuvable');

  // clicking outside dev modal closes & locks (same pattern as upgrades.js)
  dm.addEventListener('click', (ev) => {
    const content = dm.querySelector('.modal-content');
    if (content && !content.contains(ev.target)) {
      // blur any focused element inside before hiding to avoid aria-hidden focus issue
      const focused = dm.querySelector(':focus');
      try { if (focused) focused.blur(); } catch (e) {}
      closeModal(dm);
    }
  });

  // ESC closes & locks
  document.addEventListener('keydown', (ev) => {
    if ((ev.key === 'Escape' || ev.key === 'Esc') && session.open) {
      const dmNode = document.getElementById(cfg.devModalId);
      if (dmNode) {
        const focused = dmNode.querySelector(':focus');
        try { if (focused) focused.blur(); } catch (e) {}
        closeModal(dmNode);
      }
    }
  });

  // expose helpers for debugging
  if (typeof window !== 'undefined') {
    window.__CLICKER_DEV__ = {
      computeHash: async (pwd) => await sha256Hex(pwd + cfg.salt),
      open: () => { const n = ensureDevModal(); buildDevBody(n); openModal(n); },
      close: () => { const n = document.getElementById(cfg.devModalId); if (n) closeModal(n); },
      session, cfg
    };
  }
  return { cfg, session };
}
