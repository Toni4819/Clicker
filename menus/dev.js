// menus/dev.js
// Module autonome du menu développeur avec mot de passe fixe et global (non modifiable à l'exécution).
// Usage (type="module"):
// import { initDevMenu, openDev, closeDev } from './menus/dev.js';
// initDevMenu({ devTriggerId: 'devTrigger', devModalId: 'devModal', api: { getState, setState } });
//
// Pour des raisons de sécurité, le mot de passe en clair n'est pas présent dans le fichier.
// Il est attendu que tu remplaceras directement la constante EXPECTED_HASH par le SHA-256 hex du
// mot de passe souhaité concaténé au salt ci‑dessous avant déploiement.

const DEFAULT = {
  devTriggerId: 'devTrigger',
  devModalId: 'devModal',
  salt: 'X9!a#', // conserver/adapter si tu changes la méthode de calcul du hash
  // Remplace la valeur ci-dessous par le hash hex SHA-256 du (motDePasse + salt).
  // Exemple (hors code) : SHA256('MonMDP' + 'X9!a#') => hex => coller ici.
  EXPECTED_HASH: 'bb58f0471dac25dc294e8af3f6b8dba28c302dee3b3ce24a69c1914462dee954',
  modalClass: 'dev-modal',
  modalContentClass: 'dev-modal__content',
  closeBtnClass: 'dev-modal__close',
};

let cfg = { ...DEFAULT };
let els = {};
let api = {};
let state = { open: false, unlocked: false, sessionKey: null };

async function sha256Hex(str) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ---------------------------
   Modal DOM + styles
   --------------------------- */
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
        <header>
          <h2>Mode développeur</h2>
          <p id="${id}-status" class="dev-status">Initialisation...</p>
        </header>
        <main id="${id}-main" class="dev-main" tabindex="0"></main>
        <footer class="dev-footer" style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
          <button id="${id}-btn-apply" class="btn">Appliquer</button>
          <button id="${id}-btn-export" class="btn">Exporter</button>
          <button id="${id}-btn-import" class="btn">Importer</button>
          <button id="${id}-btn-lock" class="btn">Verrouiller</button>
        </footer>
      </div>
    `.trim();
    injectStyles();
  }

  return modal;
}


function injectStyles() {
  if (document.getElementById('dev-modal-styles')) return;
  const css = `
    .${cfg.modalClass} { position:fixed; inset:0; display:none; align-items:center; justify-content:center; background:rgba(0,0,0,.55); z-index:10000; }
    .${cfg.modalContentClass} { background:#0e1117; color:#e6eef8; padding:14px; border-radius:8px; width:calc(100% - 48px); max-width:880px; position:relative; box-shadow:0 8px 24px rgba(0,0,0,.6); }
    .${cfg.closeBtnClass} { position:absolute; right:12px; top:12px; background:transparent; border:0; color:#cbd5e1; font-size:18px; cursor:pointer; }
    .dev-main { max-height:60vh; overflow:auto; margin-top:8px; }
    .dev-row { display:flex; gap:8px; align-items:center; margin:8px 0; flex-wrap:wrap; }
    .dev-row label { min-width:120px; color:#cbd5e1; }
    .dev-row input, .dev-row textarea, .dev-row select { background:#0b0d10; color:#e6eef8; border:1px solid #24303a; padding:6px 8px; border-radius:4px; }
    .dev-footer .btn { background:#132032; color:#e6eef8; border:0; padding:6px 10px; border-radius:6px; cursor:pointer; }
  `;
  const s = document.createElement('style');
  s.id = 'dev-modal-styles';
  s.textContent = css;
  document.head.appendChild(s);
}

/* ---------------------------
   Build UI (with fixed PW flow)
   --------------------------- */
function buildMain(modal) {
  const main = modal.querySelector(`#${modal.id}-main`);
  main.innerHTML = '';

  const isProtected = !!cfg.EXPECTED_HASH && cfg.EXPECTED_HASH !== 'REPLACE_WITH_SHA256_HEX_OF_PASSWORD_PLUS_SALT';

  const sessionSection = document.createElement('section');
  sessionSection.className = 'dev-section';
  sessionSection.innerHTML = `
    <h3>Session</h3>
    <div class="dev-row"><label>Protection</label><span id="${modal.id}-prot">${isProtected ? 'Activée (mot de passe requis)' : 'Désactivée (aucun mot de passe configuré)'}</span></div>
    <div class="dev-row" id="${modal.id}-auth">
      <label>Mot de passe</label>
      <input id="${modal.id}-pwd" type="password" placeholder="${isProtected ? 'Entrez le mot de passe' : 'Aucun mot de passe configuré'}" />
      <button id="${modal.id}-btn-pwd" class="btn">${isProtected ? 'Déverrouiller' : 'Déverrouillage (désactivé)'}</button>
    </div>
  `;
  main.appendChild(sessionSection);

  const cur = api.getState ? api.getState() : { points: 0, autoClicks: 0, multipliers: { clickPower: 1 }, upgrades: {} };
  const varsSection = document.createElement('section');
  varsSection.innerHTML = `
    <h3>Variables</h3>
    <div class="dev-row"><label>Points</label><input id="${modal.id}-points" type="number" value="${Number(cur.points || 0)}" /></div>
    <div class="dev-row"><label>Clics/s</label><input id="${modal.id}-auto" type="number" value="${Number(cur.autoClicks || 0)}" /></div>
    <div class="dev-row"><label>Click Power</label><input id="${modal.id}-clickP" type="number" step="0.1" value="${(cur.multipliers && cur.multipliers.clickPower) || 1}" /></div>
  `;
  main.appendChild(varsSection);

  const upgrades = JSON.stringify(cur.upgrades || {}, null, 2);
  const upSection = document.createElement('section');
  upSection.innerHTML = `
    <h3>Upgrades (JSON)</h3>
    <div class="dev-row"><label>Upgrades</label><textarea id="${modal.id}-upgrades" rows="6" style="min-width:320px;">${escapeHtml(upgrades)}</textarea></div>
  `;
  main.appendChild(upSection);

  wireMainButtons(modal);
  updateStatus(modal, 'Prêt');
}

/* ---------------------------
   Wiring: verification (fixed hash), apply, export, import, lock
   --------------------------- */
function wireMainButtons(modal) {
  const pwdBtn = modal.querySelector(`#${modal.id}-btn-pwd`);
  const pwdInput = modal.querySelector(`#${modal.id}-pwd`);

  if (pwdBtn) {
    pwdBtn.addEventListener('click', async () => {
      const val = pwdInput.value || '';
      if (!cfg.EXPECTED_HASH || cfg.EXPECTED_HASH === 'REPLACE_WITH_SHA256_HEX_OF_PASSWORD_PLUS_SALT') {
        // no password configured at build time
        state.unlocked = true;
        state.sessionKey = 'session_nopw_' + Date.now();
        updateStatus(modal, 'Déverrouillé (aucun mot de passe configuré)');
        buildMain(modal);
        return;
      }
      const candidate = await sha256Hex(val + cfg.salt);
      if (candidate === cfg.EXPECTED_HASH) {
        state.unlocked = true;
        state.sessionKey = 'session_' + Math.random().toString(36).slice(2);
        updateStatus(modal, 'Déverrouillé');
        buildMain(modal);
      } else {
        updateStatus(modal, 'Mot de passe incorrect');
      }
    });
  }

  const applyBtn = modal.querySelector(`#${modal.id}-btn-apply`);
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      if (cfg.EXPECTED_HASH && !state.unlocked) {
        return updateStatus(modal, 'Session verrouillée. Déverrouillez pour appliquer.');
      }
      const main = modal.querySelector(`#${modal.id}-main`);
      const points = Number(main.querySelector(`#${modal.id}-points`).value || 0);
      const autoClicks = Number(main.querySelector(`#${modal.id}-auto`).value || 0);
      const clickP = Number(main.querySelector(`#${modal.id}-clickP`).value || 1);
      let upgrades;
      try { upgrades = JSON.parse(main.querySelector(`#${modal.id}-upgrades`).value || '{}'); }
      catch (e) { return updateStatus(modal, 'JSON Upgrades invalide'); }

      const changes = { points, autoClicks, multipliers: { clickPower: clickP }, upgrades };
      try {
        if (api.setState) api.setState(changes);
        else if (api.applyChanges) api.applyChanges(changes);
        updateStatus(modal, 'Modifications appliquées');
      } catch (e) {
        updateStatus(modal, 'Erreur lors de l\'application');
      }
    });
  }

  const exportBtn = modal.querySelector(`#${modal.id}-btn-export`);
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const cur = api.getState ? api.getState() : {};
      const raw = JSON.stringify({ exportedAt: Date.now(), data: cur }, null, 2);
      const payload = btoa(unescape(encodeURIComponent(raw)));
      const blob = new Blob([payload], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `clicker_export_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      updateStatus(modal, 'Export déclenché');
    });
  }

  const importBtn = modal.querySelector(`#${modal.id}-btn-import`);
  if (importBtn) {
    importBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = async () => {
        const f = input.files[0];
        if (!f) return updateStatus(modal, 'Aucun fichier choisi');
        const txt = await f.text();
        let decoded = null;
        try { decoded = decodeURIComponent(escape(atob(txt))); } catch (e) {
          try { decoded = atob(txt); } catch (e2) { decoded = txt; }
        }
        try {
          const parsed = JSON.parse(decoded);
          const data = parsed.data || parsed;
          if (api.setState) api.setState(data);
          else if (api.applyChanges) api.applyChanges(data);
          else state.snapshot = data;
          updateStatus(modal, 'Import appliqué');
          buildMain(modal);
        } catch (e) {
          updateStatus(modal, 'Import invalide');
        }
      };
      input.click();
    });
  }

  const lockBtn = modal.querySelector(`#${modal.id}-btn-lock`);
  if (lockBtn) {
    lockBtn.addEventListener('click', () => {
      state.unlocked = false;
      state.sessionKey = null;
      updateStatus(modal, 'Session verrouillée');
      buildMain(modal);
    });
  }
}

/* ---------------------------
   Open / close modal
   --------------------------- */
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
}

/* ---------------------------
   Public API
   --------------------------- */
export function initDevMenu(options = {}) {
  cfg = { ...cfg, ...options };
  if (options.api) api = options.api;
  els.devTrigger = document.getElementById(cfg.devTriggerId);
  els.devModal = ensureModal(cfg.devModalId);

  if (els.devTrigger) {
    els.devTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      if (state.open) closeModal(els.devModal);
      else { buildMain(els.devModal); openModal(els.devModal); }
    });
  }

  const closeBtn = els.devModal.querySelector(`.${cfg.closeBtnClass}`);
  if (closeBtn) closeBtn.addEventListener('click', () => closeModal(els.devModal));

  els.devModal.addEventListener('click', (e) => {
    const content = els.devModal.querySelector(`.${cfg.modalContentClass}`);
    if (content && !content.contains(e.target)) closeModal(els.devModal);
  });

  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Escape' || e.key === 'Esc') && state.open) closeModal(els.devModal);
  });

  if (typeof window !== 'undefined') {
    window.__CLICKER_DEV__ = {
      open: () => { buildMain(els.devModal); openModal(els.devModal); },
      close: () => closeModal(els.devModal),
      state,
      // helper console: compute hash for a chosen password (not stored)
      computeHash: async (pwd) => await sha256Hex(pwd + cfg.salt)
    };
  }
  return { cfg, els, state };
}

export function openDev() { if (els.devModal) { buildMain(els.devModal); openModal(els.devModal); } }
export function closeDev() { if (els.devModal) closeModal(els.devModal); }

function updateStatus(modal, text) {
  const id = modal && modal.id ? modal.id : cfg.devModalId;
  const el = document.getElementById(`${id}-status`);
  if (el) el.textContent = text;
}
function escapeHtml(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
