// menus/dev.js
// Dev menu réécrit from scratch for Toni4819/Clicker
// - verify code first (small modal), then open main modal
// - code input is type="text" visually masked (no storage)
// - controls disabled until unlocked
// - reuses repo modal classes; no stylesheet changes here

const DEFAULT = {
  devTriggerId: 'devTrigger',
  devModalId: 'devModal',
  pwdModalId: 'devPwdModal',
  salt: 'X9!a#',
  EXPECTED_HASH: 'bb58f0471dac25dc294e8af3f6b8dba28c302dee3b3ce24a69c1914462dee954'
};

// Keys found across main.js, rebirthSystem.js, modules/stats.js, menus/shop.js, menus/upgrades.js
const KNOWN_KEYS = [
  'points','pointsPerClick','autoClickers','autoClicks',
  'rebirth','rebirths',
  'shopBoost','tempShopBoostFactor',
  'machinesLevel1','machinesLevel2','machinesLevel3','machinesLevel4','machinesLevel5',
  'machinesLevel6','machinesLevel7','machinesLevel8','machinesLevel9','machinesLevel10'
];

let cfg = { ...DEFAULT };
let api = {};
let session = { unlocked: false, key: null, open: false };

/* ---------- crypto helper ---------- */
async function sha256Hex(str){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

/* ---------- create/reuse modals (single definitions) ---------- */
function ensureDevModal(){
  let modal = document.getElementById(cfg.devModalId);
  const need = !modal || !modal.querySelector(`#${cfg.devModalId}-body`);
  if (!modal){ modal = document.createElement('div'); modal.id = cfg.devModalId; document.body.appendChild(modal); }
  if (need){
    modal.className = 'modal';
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-hidden','true');
    modal.innerHTML = `
      <div class="modal-content" role="document">
        <header class="modal-header">
          <h2 id="${cfg.devModalId}-title">Mode développeur</h2>
          <button id="${cfg.devModalId}-close" class="close-btn" aria-label="Fermer">✕</button>
        </header>
        <div class="modal-body" id="${cfg.devModalId}-body" style="padding:12px;max-height:75vh;overflow:auto"></div>
      </div>
    `;
  }
  return modal;
}

function ensurePwdModal(){
  let pm = document.getElementById(cfg.pwdModalId);
  if (pm) return pm;
  pm = document.createElement('div');
  pm.id = cfg.pwdModalId;
  pm.className = 'modal';
  pm.setAttribute('aria-hidden','true');
  pm.innerHTML = `
    <div class="modal-content" role="document" style="max-width:360px">
      <header class="modal-header">
        <h2 id="${cfg.pwdModalId}-title">Code développeur</h2>
        <button id="${cfg.pwdModalId}-x" class="close-btn" aria-label="Fermer">✕</button>
      </header>
      <div class="modal-body" style="padding:12px">
        <form id="${cfg.pwdModalId}-form" autocomplete="off" novalidate>
          <label for="${cfg.pwdModalId}-input" style="display:block;margin-bottom:6px;color:var(--muted)">Entrer le code</label>
          <!-- type="text" but visually masked via -webkit-text-security (keeps value accessible in JS) -->
          <input id="${cfg.pwdModalId}-input" type="text" autocomplete="off"
            style="width:100%;box-sizing:border-box;padding:8px;border-radius:8px;border:1px solid var(--border);-webkit-text-security:disc;-moz-text-security:disc" />
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

/* ---------- open/close (manage focus to avoid aria-hidden focus warning) ---------- */
function openModal(node){
  if (!node) return;
  node.setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');
  session.open = true;
  requestAnimationFrame(()=>{ const f = node.querySelector('input,button,select,textarea,[tabindex]:not([tabindex="-1"])'); if(f) f.focus(); });
}
function closeModal(node){
  if (!node) return;
  try { const active = node.querySelector(':focus'); if (active) active.blur(); } catch(e){}
  node.setAttribute('aria-hidden','true');
  document.body.classList.remove('modal-open');
  session.open = false;
  session.unlocked = false;
  session.key = null;
  const t = document.getElementById(cfg.devTriggerId); if(t) t.focus();
}

/* ---------- read and normalize game state (best-effort) ---------- */
function readGameState(){
  let cur = {};
  try {
    if (api.getState) cur = api.getState() || {};
    else if (window.state) cur = window.state;
    else if (window.gameState) cur = window.gameState;
    else if (window.store && typeof window.store.getState === 'function') cur = window.store.getState();
  } catch(e){ cur = {}; }
  const norm = {};
  for (const k of KNOWN_KEYS) norm[k] = (k in cur) ? cur[k] : 0;
  norm.upgrades = cur.upgrades ?? cur.items ?? {};
  return { raw: cur, norm };
}

/* ---------- build main modal content (no header text) ---------- */
function buildDevBody(modal){
  const body = modal.querySelector(`#${cfg.devModalId}-body`);
  if (!body) return;
  body.innerHTML = '';

  const { raw, norm } = readGameState();

  // compact grid
  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = '1fr 1fr';
  grid.style.gap = '10px';
  grid.style.alignItems = 'start';
  if (window.matchMedia && window.matchMedia('(max-width:720px)').matches) grid.style.gridTemplateColumns = '1fr';

  for (const key of KNOWN_KEYS){
    const w = document.createElement('div');
    w.className = 'section';
    const label = document.createElement('label');
    label.textContent = key;
    label.style.display='block'; label.style.marginBottom='6px'; label.style.color='var(--muted)';
    const input = document.createElement('input');
    input.type = 'number';
    input.id = `${cfg.devModalId}-${key}`;
    input.value = Number(norm[key] ?? 0);
    input.style.width = '100%';
    input.style.boxSizing='border-box';
    if (!session.unlocked) input.setAttribute('disabled','disabled');
    w.appendChild(label); w.appendChild(input); grid.appendChild(w);
  }

  body.appendChild(grid);

  // upgrades list (simple numeric inputs)
  const upSec = document.createElement('div'); upSec.className='section';
  const upTitle = document.createElement('div'); upTitle.className='section-title'; upTitle.textContent='Upgrades / Items';
  upSec.appendChild(upTitle);
  const upObj = norm.upgrades || {};
  const list = document.createElement('div'); list.style.display='grid'; list.style.gap='8px'; list.style.marginTop='8px';
  const keys = Object.keys(upObj).slice(0,30);
  if (keys.length===0){ const n = document.createElement('div'); n.style.color='var(--muted)'; n.textContent='Aucun upgrade détecté'; list.appendChild(n); }
  else keys.forEach(k=>{
    const row = document.createElement('div'); row.style.display='flex'; row.style.gap='8px'; row.style.alignItems='center';
    const lbl = document.createElement('div'); lbl.textContent = k; lbl.style.flex='1'; lbl.style.color='var(--muted)';
    const inp = document.createElement('input'); inp.type='number'; inp.id = `${cfg.devModalId}-up-${k}`;
    const val = (typeof upObj[k] === 'number') ? upObj[k] : (upObj[k]?.owned ?? upObj[k]?.level ?? upObj[k]?.count ?? 0);
    inp.value = Number(val ?? 0); inp.style.width='92px'; if(!session.unlocked) inp.setAttribute('disabled','disabled');
    row.appendChild(lbl); row.appendChild(inp); list.appendChild(row);
  });
  upSec.appendChild(list); body.appendChild(upSec);

  // footer actions (append if absent)
  wireDevButtons(modal);
}

/* ---------- apply changes & close wiring ---------- */
function wireDevButtons(modal){
  // ensure footer exists
  let foot = modal.querySelector('.__dev_footer');
  if (!foot){
    foot = document.createElement('div'); foot.className='__dev_footer';
    foot.style.display='flex'; foot.style.justifyContent='flex-end'; foot.style.gap='8px'; foot.style.marginTop='8px';
    foot.innerHTML = `<button id="${cfg.devModalId}-apply" class="btn">Appliquer</button><button id="${cfg.devModalId}-close-lock" class="btn">Fermer et verrouiller</button>`;
    modal.querySelector('.modal-content').appendChild(foot);
  }

  const apply = modal.querySelector(`#${cfg.devModalId}-apply`);
  const closeLock = modal.querySelector(`#${cfg.devModalId}-close-lock`);
  const closeBtn = modal.querySelector(`#${cfg.devModalId}-close`);
  // apply handler
  if (apply) apply.onclick = () => {
    if (cfg.EXPECTED_HASH && !session.unlocked) { updateStatus(modal, 'Verrouillé'); return; }
    const changes = {};
    // gather known inputs
    for (const k of KNOWN_KEYS){
      const el = document.getElementById(`${cfg.devModalId}-${k}`);
      if (el) changes[k] = Number(el.value || 0);
    }
    // gather upgrades
    const ups = Array.from(modal.querySelectorAll(`[id^="${cfg.devModalId}-up-"]`));
    const upObj = {};
    ups.forEach(inp => { const key = inp.id.replace(`${cfg.devModalId}-up-`, ''); upObj[key] = Number(inp.value || 0); });
    if (Object.keys(upObj).length) changes.upgrades = upObj;

    try {
      if (api.setState) { api.setState(changes); if (api.save) api.save(); if (api.renderMain) api.renderMain(); }
      else {
        if (window.state) Object.assign(window.state, changes);
        if (window.gameState) Object.assign(window.gameState, changes);
        // update common UI nodes if present
        const pv = document.getElementById('pointsValue'); if (pv) pv.textContent = String(changes.points ?? window.state?.points ?? window.gameState?.points ?? 0);
        const av = document.getElementById('autoClicksValue'); if (av) av.textContent = String(changes.autoClickers ?? changes.autoClicks ?? 0);
        const rv = document.getElementById('rebirthsValue') || document.getElementById('rebirthValue'); if (rv) rv.textContent = String(changes.rebirths ?? changes.rebirth ?? 0);
      }
      updateStatus(modal, 'Appliqué');
    } catch (e) { console.error(e); updateStatus(modal, 'Erreur'); }
  };

  const doCloseLock = () => { closeModal(modal); };
  if (closeLock) closeLock.onclick = doCloseLock;
  if (closeBtn) closeBtn.onclick = doCloseLock;

  // prevent clicks inside modal content from closing
  const content = modal.querySelector('.modal-content');
  if (content) content.onclick = (ev) => ev.stopPropagation();
}

/* ---------- password modal flow (verify before opening main) ---------- */
function openPwdModal(onOk, onCancel){
  const pm = ensurePwdModal();
  pm.setAttribute('aria-hidden','false');
  pm.style.display = 'flex';
  document.body.classList.add('modal-open');
  requestAnimationFrame(()=>{ const input = pm.querySelector(`#${cfg.pwdModalId}-input`); if (input) input.focus(); });

  const form = pm.querySelector(`#${cfg.pwdModalId}-form`);
  const msg = pm.querySelector(`#${cfg.pwdModalId}-msg`);
  const cancel = pm.querySelector(`#${cfg.pwdModalId}-cancel`);
  const x = pm.querySelector(`#${cfg.pwdModalId}-x`);

  function cleanup(){
    try { form.removeEventListener('submit', submitHandler); } catch(e){}
    cancel.onclick = null; x.onclick = null;
    const inp = pm.querySelector(`#${cfg.pwdModalId}-input`); if (inp) { inp.value = ''; inp.blur(); }
    pm.setAttribute('aria-hidden','true'); pm.style.display = 'none'; document.body.classList.remove('modal-open');
  }

  async function submitHandler(ev){
    ev.preventDefault();
    const val = pm.querySelector(`#${cfg.pwdModalId}-input`).value || '';
    const candidate = await sha256Hex(val + cfg.salt);
    if (candidate === cfg.EXPECTED_HASH){
      cleanup();
      session.unlocked = true;
      session.key = 's_' + Math.random().toString(36).slice(2);
      onOk && onOk();
    } else {
      msg.textContent = 'Code incorrect';
      const inp = pm.querySelector(`#${cfg.pwdModalId}-input`); if (inp) { inp.value = ''; inp.focus(); }
    }
  }

  form.addEventListener('submit', submitHandler);
  cancel.onclick = () => { cleanup(); if (onCancel) onCancel(); };
  x.onclick = () => { cleanup(); if (onCancel) onCancel(); };
}

/* ---------- trigger handler: only open pwd modal; open main only after success ---------- */
function handleTriggerClick(e){
  e.preventDefault();
  const prot = !!cfg.EXPECTED_HASH;
  if (!prot){
    const dm = ensureDevModal(); buildDevBody(dm); openModal(dm); return;
  }
  openPwdModal(() => { const dm = ensureDevModal(); buildDevBody(dm); openModal(dm); }, () => {});
}

/* ---------- utilities ---------- */
function updateStatus(modal, text){
  if (!modal) return;
  let s = modal.querySelector(`#${cfg.devModalId}-status`);
  if (!s){
    s = document.createElement('div'); s.id = `${cfg.devModalId}-status`; s.style.fontSize='13px'; s.style.color='var(--muted)';
    const title = modal.querySelector(`#${cfg.devModalId}-title`); if (title) title.parentNode.insertBefore(s, title.nextSibling);
  }
  s.textContent = text;
}

/* ---------- init ---------- */
export function initDevMenu(options = {}){
  cfg = { ...cfg, ...options };
  if (options.api) api = options.api;

  const trigger = document.getElementById(cfg.devTriggerId);
  ensureDevModal(); ensurePwdModal();

  if (trigger) trigger.addEventListener('click', handleTriggerClick);
  else console.warn('initDevMenu: #devTrigger introuvable');

  // backdrop click closes & locks (only when clicking the modal element itself)
  const dm = document.getElementById(cfg.devModalId);
  if (dm) dm.addEventListener('click', (ev) => { if (ev.target === dm){ try{ const f = dm.querySelector(':focus'); if(f) f.blur(); }catch(e){} closeModal(dm); } });

  // ESC closes & locks
  document.addEventListener('keydown', (ev) => { if ((ev.key==='Escape'||ev.key==='Esc') && session.open){ const n = document.getElementById(cfg.devModalId); if (n){ try{ const f = n.querySelector(':focus'); if(f) f.blur(); }catch(e){} closeModal(n); } } });

  // expose helpers
  if (typeof window !== 'undefined'){
    window.__CLICKER_DEV__ = {
      computeHash: async (p) => await sha256Hex(p + cfg.salt),
      open: () => { const d = ensureDevModal(); buildDevBody(d); openModal(d); },
      close: () => { const d = document.getElementById(cfg.devModalId); if (d) closeModal(d); },
      cfg, session
    };
  }
  return { cfg, session };
}
