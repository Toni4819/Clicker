// menus/dev.js
// Corrected, single-definition version
// - verify code first (pwd modal), then open dev modal
// - code input is type="text" visually masked via -webkit-text-security
// - controls disabled until unlocked
// - clicking inside modal does not close it; backdrop click closes & locks
// - before aria-hidden=true we blur focused element to avoid accessibility warnings
// - reuses repo modal classes (modal, modal-content, modal-body, modal-header, close-btn)
// Replace cfg.EXPECTED_HASH with SHA256(password + salt) before deployment.

const DEFAULT = {
  devTriggerId: 'devTrigger',
  devModalId: 'devModal',
  pwdModalId: 'devPwdModal',
  salt: 'X9!a#',
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

/* ---------- ensure modals (single definitions) ---------- */
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
          <!-- type="text" but masked visually -->
          <input id="${cfg.pwdModalId}-input" type="text" autocomplete="off"
                 style="width:100%;box-sizing:border-box;padding:8px;border-radius:10px;border:1px solid var(--border);-webkit-text-security:disc;-moz-text-security:disc" />
          <div id="${cfg.pwdModalId}-msg" style="color:var(--muted);margin-top:8px;font-size:13px;min-height:18px"></div>
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

/* ---------- open/close helpers with focus management ---------- */
function openModal(node) {
  if (!node) return;
  node.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  session.open = true;
  requestAnimationFrame(() => {
    const ff = node.querySelector('input,button,select,textarea,[tabindex]:not([tabindex="-1"])');
    if (ff) ff.focus();
  });
}
function closeModal(node) {
  if (!node) return;
  try {
    const active = node.querySelector(':focus');
    if (active) active.blur();
  } catch (e) {}
  node.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  session.open = false;
  session.unlocked = false;
  session.key = null;
  const trigger = document.getElementById(cfg.devTriggerId);
  if (trigger) trigger.focus();
}

/* ---------- read/normalize game state (best effort) ---------- */
function readGameState() {
  let cur = {};
  try {
    if (api.getState) cur = api.getState() || {};
    else if (window.state) cur = window.state;
    else if (window.gameState) cur = window.gameState;
    else if (window.store && typeof window.store.getState === 'function') cur = window.store.getState();
  } catch (e) { cur = {}; }
  const norm = {};
  for (const k of KNOWN_KEYS) norm[k] = (k in cur) ? cur[k] : 0;
  norm.upgrades = cur.upgrades ?? cur.items ?? {};
  return { raw: cur, norm };
}

/* ---------- build dev body (controls disabled while locked) ---------- */
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

  // compact grid
  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = '1fr 1fr';
  grid.style.gap = '10px';
  grid.style.alignItems = 'start';
  if (window.matchMedia && window.matchMedia('(max-width:720px)').matches) grid.style.gridTemplateColumns = '1fr';

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
    if (!session.unlocked) input.setAttribute('disabled', 'disabled');
    wrapper.appendChild(label);
    wrapper.appendChild(input);
    grid.appendChild(wrapper);
  }
  body.appendChild(grid);

  // upgrades: simple list of small inputs (disabled if locked)
  const upSec = document.createElement('div');
  upSec.className = 'section';
  upSec.innerHTML = `<div class="section-title">Upgrades / Items</div>`;
  const upObj = norm.upgrades || {};
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
      const val = (typeof upObj[k] === 'number') ? upObj[k] : (upObj[k]?.owned ?? upObj[k]?.level ?? upObj[k]?.count ?? 0);
      inp.value = val;
      inp.style.width = '92px';
      if (!session.unlocked) inp.setAttribute('disabled', 'disabled');
      row.appendChild(label);
      row.appendChild(inp);
      list.appendChild(row);
    });
  }
  upSec.appendChild(list);
  body.appendChild(upSec);

  // footer small note
  const note = document.createElement('div');
  note.className = 'section';
  note.innerHTML = `<div style="color:var(--muted);font-size:12px">Le menu se verrouille automatiquement à la fermeture.</div>`;
  body.appendChild(note);

  wireDevButtons(modal, raw);
}

/* ---------- wire apply & close (click inside doesn't close) ---------- */
function wireDevButtons(modal, rawRef) {
  const closeBtn = modal.querySelector(`#${cfg.devModalId}-close`);
  // ensure footer apply exists
  let footer = modal.querySelector('.__dev_footer');
  if (!footer) {
    footer = document.createElement('div');
    footer.className = '__dev_footer';
    footer.style.display = 'flex';
    footer.style.justifyContent = 'flex-end';
    footer.style.gap = '8px';
    footer.style.marginTop = '8px';
    footer.innerHTML = `<button id="${cfg.devModalId}-apply" class="btn">Appliquer</button><button id="${cfg.devModalId}-close-lock" class="btn">Fermer et verrouiller</button>`;
    modal.querySelector('.modal-content').appendChild(footer);
  }
  const apply = modal.querySelector(`#${cfg.devModalId}-apply`);
  const closeLock = modal.querySelector(`#${cfg.devModalId}-close-lock`);

  if (apply) apply.onclick = () => {
    const prot = !!cfg.EXPECTED_HASH && cfg.EXPECTED_HASH !== 'REPLACE_WITH_SHA256_HEX_OF_PASSWORD_PLUS_SALT';
    if (prot && !session.unlocked) { updateStatus(modal, 'Verrouillé — entrez le code'); return; }
    const changes = {};
    for (const k of KNOWN_KEYS) {
      const el = document.getElementById(`${cfg.devModalId}-${k}`);
      if (el) changes[k] = (el.type === 'number') ? Number(el.value || 0) : el.value;
    }
    const upObj = {};
    const ups = Array.from(modal.querySelectorAll(`[id^="${cfg.devModalId}-up-"]`));
    ups.forEach(inp => { const key = inp.id.replace(`${cfg.devModalId}-up-`, ''); upObj[key] = Number(inp.value || 0); });
    if (Object.keys(upObj).length) changes.upgrades = upObj;
    try {
      if (api.setState) { api.setState(changes); if (api.save) api.save(); if (api.renderMain) api.renderMain(); }
      else { if (window.state) Object.assign(window.state, changes); if (window.gameState) Object.assign(window.gameState, changes); if (document.getElementById('pointsValue')) document.getElementById('pointsValue').textContent = String(changes.points ?? window.state?.points ?? 0); if (api.renderMain) api.renderMain(); }
      updateStatus(modal, 'Modifications appliquées');
    } catch (e) { console.error(e); updateStatus(modal, 'Erreur application'); }
  };

  const doCloseLock = () => { closeModal(modal); updateStatus(modal, 'Fermé et verrouillé'); };
  if (closeLock) closeLock.onclick = doCloseLock;
  if (closeBtn) closeBtn.onclick = doCloseLock;

  // prevent clicks inside modal content from closing it
  const content = modal.querySelector('.modal-content');
  if (content) content.onclick = (ev) => ev.stopPropagation();
}

/* ---------- password modal handling (submit via Enter, verify before opening dev modal) ---------- */
function openPwdModal(onOk, onCancel) {
  const pm = ensurePwdModal();
  pm.setAttribute('aria-hidden', 'false');
  pm.style.display = 'flex';
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => {
    const input = pm.querySelector(`#${cfg.pwdModalId}-input`);
    if (input) input.focus();
  });

  const form = pm.querySelector(`#${cfg.pwdModalId}-form`);
  const msg = pm.querySelector(`#${cfg.pwdModalId}-msg`);
  const cancel = pm.querySelector(`#${cfg.pwdModalId}-cancel`);
  const x = pm.querySelector(`#${cfg.pwdModalId}-x`);

  function cleanup() {
    try { form.removeEventListener('submit', submitHandler); } catch (e) {}
    cancel.onclick = null; x.onclick = null;
    pm.setAttribute('aria-hidden', 'true');
    pm.style.display = 'none';
    document.body.classList.remove('modal-open');
  }

  async function submitHandler(ev) {
    ev.preventDefault();
    const val = pm.querySelector(`#${cfg.pwdModalId}-input`).value || '';
    const candidate = await sha256Hex((val || '') + cfg.salt);
    if (candidate === cfg.EXPECTED_HASH) {
      cleanup();
      session.unlocked = true;
      session.key = 's_' + Math.random().toString(36).slice(2);
      onOk && onOk(val);
    } else {
      msg.textContent = 'Code incorrect';
      pm.querySelector(`#${cfg.pwdModalId}-input`).value = '';
      pm.querySelector(`#${cfg.pwdModalId}-input`).focus();
    }
  }

  form.addEventListener('submit', submitHandler);
  cancel.onclick = () => { cleanup(); if (onCancel) onCancel(); };
  x.onclick = () => { cleanup(); if (onCancel) onCancel(); };
}

/* ---------- trigger: only open pwd modal; open main modal only after correct code ---------- */
function handleTriggerClick(e) {
  e.preventDefault();
  const prot = !!cfg.EXPECTED_HASH && cfg.EXPECTED_HASH !== 'REPLACE_WITH_SHA256_HEX_OF_PASSWORD_PLUS_SALT';
  if (!prot) {
    const dm = ensureDevModal();
    buildDevBody(dm);
    openModal(dm);
    return;
  }
  openPwdModal(() => {
    const dm = ensureDevModal();
    buildDevBody(dm);
    openModal(dm);
    updateStatus(dm, 'Déverrouillé');
  }, () => {
    // cancelled
  });
}

/* ---------- utilities ---------- */
function updateStatus(modal, text) {
  if (!modal) return;
  let s = modal.querySelector(`#${cfg.devModalId}-status`);
  if (!s) {
    s = document.createElement('div');
    s.id = `${cfg.devModalId}-status`;
    s.style.fontSize = '13px';
    s.style.color = 'var(--muted)';
    const title = modal.querySelector(`#${cfg.devModalId}-title`);
    if (title) title.parentNode.insertBefore(s, title.nextSibling);
  }
  s.textContent = text;
}

/* ---------- public init ---------- */
export function initDevMenu(options = {}) {
  cfg = { ...cfg, ...options };
  if (options.api) api = options.api;

  const trigger = document.getElementById(cfg.devTriggerId);
  ensureDevModal();
  ensurePwdModal();

  if (trigger) trigger.addEventListener('click', handleTriggerClick);
  else console.warn('initDevMenu: #devTrigger introuvable');

  // backdrop click closes & locks only when clicking modal itself (not content)
  const dm = document.getElementById(cfg.devModalId);
  if (dm) {
    dm.addEventListener('click', (ev) => {
      if (ev.target === dm) {
        try { const focused = dm.querySelector(':focus'); if (focused) focused.blur(); } catch (e) {}
        closeModal(dm);
      }
    });
  }

  // ESC closes & locks
  document.addEventListener('keydown', (ev) => {
    if ((ev.key === 'Escape' || ev.key === 'Esc') && session.open) {
      const node = document.getElementById(cfg.devModalId);
      if (node) {
        try { const focused = node.querySelector(':focus'); if (focused) focused.blur(); } catch (e) {}
        closeModal(node);
      }
    }
  });

  // helpers for console
  if (typeof window !== 'undefined') {
    window.__CLICKER_DEV__ = {
      computeHash: async (p) => await sha256Hex(p + cfg.salt),
      open: () => { const d = ensureDevModal(); buildDevBody(d); openModal(d); },
      close: () => { const d = document.getElementById(cfg.devModalId); if (d) closeModal(d); },
      session, cfg
    };
  }
  return { cfg, session };
}
