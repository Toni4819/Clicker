// menus/dev.js
// Compact dev menu — password modal (type=password), fixed EXPECTED_HASH, compact responsive layout.

const DEFAULT = {
  devTriggerId: 'devTrigger',
  devModalId: 'devModal',
  pwdModalId: 'devPwdModal',
  modalClass: 'dev-modal',
  modalContentClass: 'dev-modal__content',
  closeBtnClass: 'dev-modal__close',
  salt: 'X9!a#',
  // Remplace par SHA256(motDePasse + salt)
  EXPECTED_HASH: 'bb58f0471dac25dc294e8af3f6b8dba28c302dee3b3ce24a69c1914462dee954'
};

// Key list informed by main.js / rebirthSystem.js / modules/stats.js / menus/shop.js / menus/upgrades.js
const KNOWN_KEYS = [
  'points','pointsPerClick','autoClickers','autoClicks',
  'rebirths','shopBoost','tempShopBoostFactor',
  'machinesLevel1','machinesLevel2','machinesLevel3','machinesLevel4','machinesLevel5',
  'machinesLevel6','machinesLevel7','machinesLevel8','machinesLevel9','machinesLevel10',
  'machinesLevel11','machinesLevel12','machinesLevel13','machinesLevel14','machinesLevel15',
  'version'
];

let cfg = { ...DEFAULT };
let api = {};
let state = { unlocked:false, key:null, open:false };

async function sha256Hex(str){
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');
}

/* ---------- Styles (compact, fits viewport) ---------- */
function injectStyles(){
  if (document.getElementById('dev-modal-styles')) return;
  const css = `
  .${cfg.modalClass}{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.55);z-index:10000}
  .${cfg.modalContentClass}{background:#0e1117;color:#e6eef8;border-radius:8px;padding:10px;width:calc(100% - 28px);max-width:820px;max-height:85vh;overflow:auto;box-shadow:0 8px 20px rgba(0,0,0,.6)}
  .${cfg.closeBtnClass}{position:absolute;right:8px;top:8px;background:transparent;border:0;color:#cbd5e1;font-size:16px;cursor:pointer}
  .dev-header{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}
  .dev-main{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;align-items:start}
  @media (max-width:720px){.dev-main{grid-template-columns:1fr}}
  .dev-row{display:flex;flex-direction:column;gap:4px}
  label{font-size:12px;color:#cbd5e1}
  input[type=number],input[type=text],input[type=password],textarea{background:#0b0d10;color:#e6eef8;border:1px solid #25313a;padding:6px;border-radius:4px;font-size:13px;width:100%;box-sizing:border-box}
  textarea{resize:vertical;min-height:56px;max-height:24vh}
  .dev-footer{display:flex;gap:8px;justify-content:flex-end;margin-top:8px;flex-wrap:wrap}
  .btn{background:#132032;color:#e6eef8;border:0;padding:6px 8px;border-radius:6px;cursor:pointer;font-size:13px}
  .pwd-modal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.55);z-index:11000}
  .pwd-card{background:#0e1117;color:#e6eef8;padding:12px;border-radius:8px;width:320px;max-width:92vw;box-sizing:border-box}
  .small-note{font-size:12px;color:#9fb0c8;margin-top:6px}
  `;
  const s = document.createElement('style');
  s.id = 'dev-modal-styles';
  s.textContent = css;
  document.head.appendChild(s);
}

/* ---------- DOM creation ---------- */
function ensureDevModal(){
  let modal = document.getElementById(cfg.devModalId);
  const need = !modal || !modal.querySelector(`#${cfg.devModalId}-main`);
  if (!modal){ modal = document.createElement('div'); modal.id = cfg.devModalId; document.body.appendChild(modal); }
  if (need){
    modal.className = cfg.modalClass;
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.setAttribute('aria-hidden','true');
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="${cfg.modalContentClass}" role="document">
        <div class="dev-header"><strong>Mode développeur</strong><button class="${cfg.closeBtnClass}" aria-label="Fermer">✕</button></div>
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
function ensurePwdModal(){
  let pm = document.getElementById(cfg.pwdModalId);
  if (pm) return pm;
  pm = document.createElement('div'); pm.id = cfg.pwdModalId; pm.className = 'pwd-modal';
  pm.innerHTML = `
    <div class="pwd-card" role="dialog" aria-modal="true">
      <div style="display:flex;justify-content:space-between;align-items:center"><strong>Code développeur</strong><button id="${cfg.pwdModalId}-x" class="btn">✕</button></div>
      <div style="margin-top:8px">
        <label for="${cfg.pwdModalId}-input">Entrer le code</label>
        <input id="${cfg.pwdModalId}-input" type="password" autocomplete="new-password" />
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">
          <button id="${cfg.pwdModalId}-cancel" class="btn">Annuler</button>
          <button id="${cfg.pwdModalId}-ok" class="btn">OK</button>
        </div>
        <div class="small-note">Le menu se verrouille à la fermeture</div>
      </div>
    </div>
  `;
  document.body.appendChild(pm);
  return pm;
}

/* ---------- open/close ---------- */
function openModal(modal){ if(!modal) return; modal.style.display='flex'; modal.setAttribute('aria-hidden','false'); document.documentElement.style.overflow='hidden'; state.open=true; const f=modal.querySelector('input,button'); if(f) f.focus();}
function closeModal(modal){ if(!modal) return; modal.style.display='none'; modal.setAttribute('aria-hidden','true'); document.documentElement.style.overflow=''; state.open=false; state.unlocked=false; state.key=null; }

/* ---------- read/normalize game state (best-effort) ---------- */
function readGameState(){
  let cur = {};
  try{
    if (api.getState) cur = api.getState() || {};
    else if (window.gameState) cur = window.gameState;
    else if (window.state) cur = window.state;
    else if (window.store && typeof window.store.getState === 'function') cur = window.store.getState();
  }catch(e){ cur = {}; }
  const out = {};
  for(const k of KNOWN_KEYS) out[k] = (k in cur) ? cur[k] : 0;
  out.upgrades = cur.upgrades ?? cur.items ?? {};
  return { raw: cur, norm: out };
}

/* ---------- build compact UI ---------- */
function buildDevMain(modal){
  const main = modal.querySelector(`#${cfg.devModalId}-main`);
  if(!main) return;
  main.innerHTML = '';
  const { raw, norm } = readGameState();
  const prot = !!cfg.EXPECTED_HASH && cfg.EXPECTED_HASH !== 'REPLACE_WITH_SHA256_HEX_OF_PASSWORD_PLUS_SALT';
  const statusHtml = `<div style="grid-column:1/-1"><div style="display:flex;justify-content:space-between;align-items:center"><div><small style="color:#9fb0c8">Protection</small><div>${prot? 'Activée' : 'Désactivée'}</div></div><div><small style="color:#9fb0c8">Session</small><div id="${cfg.devModalId}-session">${state.unlocked? 'Déverrouillée' : 'Verrouillée'}</div></div></div></div>`;
  main.insertAdjacentHTML('beforeend', statusHtml);

  // variables (compact two-column grid)
  for(const key of KNOWN_KEYS){
    const val = escapeHtml(norm[key] ?? 0);
    const row = `<div class="dev-row"><label for="${cfg.devModalId}-${key}">${key}</label><input id="${cfg.devModalId}-${key}" type="number" value="${val}" /></div>`;
    main.insertAdjacentHTML('beforeend', row);
  }

  // multipliers / misc (compact)
  main.insertAdjacentHTML('beforeend', `
    <div class="dev-row"><label for="${cfg.devModalId}-pointsPerClick">pointsPerClick</label><input id="${cfg.devModalId}-pointsPerClick" type="number" step="0.1" value="${escapeHtml(norm.pointsPerClick ?? 1)}" /></div>
    <div class="dev-row"><label for="${cfg.devModalId}-version">version</label><input id="${cfg.devModalId}-version" type="text" value="${escapeHtml(norm.version ?? (document.getElementById('versionText')?.textContent || ''))}" /></div>
  `);

  // upgrades editor (compact textarea)
  const upVal = JSON.stringify(norm.upgrades || {}, null, 2);
  main.insertAdjacentHTML('beforeend', `<div style="grid-column:1/-1" class="dev-row"><label for="${cfg.devModalId}-upgrades">Upgrades / items (JSON)</label><textarea id="${cfg.devModalId}-upgrades">${escapeHtml(upVal)}</textarea></div>`);

  wireDevButtons(modal, raw);
}

/* ---------- wire apply & close ---------- */
function wireDevButtons(modal, rawRef){
  const apply = modal.querySelector(`#${cfg.devModalId}-apply`);
  const closeLock = modal.querySelector(`#${cfg.devModalId}-close-lock`);
  const closeBtn = modal.querySelector(`.${cfg.closeBtnClass}`);
  if(apply) apply.onclick = () => {
    const prot = !!cfg.EXPECTED_HASH && cfg.EXPECTED_HASH !== 'REPLACE_WITH_SHA256_HEX_OF_PASSWORD_PLUS_SALT';
    if(prot && !state.unlocked) return updateStatus(modal, 'Verrouillé — entrez le code');
    const changes = {};
    for(const k of KNOWN_KEYS){
      const el = document.getElementById(`${cfg.devModalId}-${k}`);
      if(el) changes[k] = Number(el.value) || 0;
    }
    const ppc = document.getElementById(`${cfg.devModalId}-pointsPerClick`);
    if(ppc) changes.pointsPerClick = Number(ppc.value) || 1;
    const ver = document.getElementById(`${cfg.devModalId}-version`);
    if(ver) changes.version = ver.value || '';
    try{
      const upTxt = document.getElementById(`${cfg.devModalId}-upgrades`).value || '{}';
      changes.upgrades = JSON.parse(upTxt);
    }catch(e){ return updateStatus(modal, 'JSON Upgrades invalide'); }

    try{
      if(api.setState) { api.setState(changes); if(api.save) api.save(); if(api.renderMain) api.renderMain(); }
      else {
        if(window.gameState) Object.assign(window.gameState, changes);
        if(window.state) Object.assign(window.state, changes);
        if(document.getElementById('pointsValue')) document.getElementById('pointsValue').textContent = String(changes.points ?? window.gameState?.points ?? 0);
        if(api.renderMain) api.renderMain();
      }
      updateStatus(modal, 'Modifications appliquées');
    }catch(err){ console.error(err); updateStatus(modal, 'Erreur d\'application'); }
  };
  const doCloseLock = () => { closeModal(modal); state.unlocked=false; state.key=null; updateStatus(modal,'Fermé et verrouillé'); };
  if(closeLock) closeLock.onclick = doCloseLock;
  if(closeBtn) closeBtn.onclick = doCloseLock;
}

/* ---------- password modal flow (compact) ---------- */
function openPwdModal(onOk, onCancel){
  const pm = ensurePwdModal();
  pm.style.display = 'flex';
  const input = pm.querySelector(`#${cfg.pwdModalId}-input`);
  const ok = pm.querySelector(`#${cfg.pwdModalId}-ok`);
  const cancel = pm.querySelector(`#${cfg.pwdModalId}-cancel`);
  const x = pm.querySelector(`#${cfg.pwdModalId}-x`);
  input.value=''; input.focus();
  const done = ()=>{ ok.onclick=null; cancel.onclick=null; x.onclick=null; pm.style.display='none'; };
  ok.onclick = ()=>{ const v = input.value||''; done(); onOk(v); };
  cancel.onclick = ()=>{ done(); if(onCancel) onCancel(); };
  x.onclick = ()=>{ done(); if(onCancel) onCancel(); };
}

/* ---------- trigger handler: show password modal (type=password) ---------- */
async function handleTriggerClick(e){
  e.preventDefault();
  const prot = !!cfg.EXPECTED_HASH && cfg.EXPECTED_HASH !== 'REPLACE_WITH_SHA256_HEX_OF_PASSWORD_PLUS_SALT';
  if(!prot){
    const dm = ensureDevModal(); buildDevMain(dm); openModal(dm); return;
  }
  openPwdModal(async (entered)=>{
    const cand = await sha256Hex((entered||'') + cfg.salt);
    const dm = ensureDevModal();
    if(cand === cfg.EXPECTED_HASH){
      state.unlocked = true; state.key = 's_'+Math.random().toString(36).slice(2);
      buildDevMain(dm); openModal(dm); updateStatus(dm,'Déverrouillé');
    } else {
      buildDevMain(dm); updateStatus(dm,'Code incorrect'); openModal(dm);
      setTimeout(()=>{ closeModal(dm); updateStatus(dm,'Fermé'); },900);
    }
  }, ()=>{/* cancelled */});
}

/* ---------- utilities ---------- */
function updateStatus(modal, text){ const el = document.getElementById(`${cfg.devModalId}-status`); if(el) el.textContent = text; }
function escapeHtml(v){ if(v===null||v===undefined) return ''; return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

/* ---------- public init ---------- */
export function initDevMenu(options={}){
  cfg = {...cfg, ...options};
  if(options.api) api = options.api;
  injectStyles();
  const trigger = document.getElementById(cfg.devTriggerId);
  ensureDevModal(); ensurePwdModal();
  if(trigger) trigger.addEventListener('click', handleTriggerClick);
  else console.warn('initDevMenu: #devTrigger introuvable');

  // outside click closes and locks
  const dm = document.getElementById(cfg.devModalId);
  if(dm) dm.addEventListener('click', ev=>{ const content = dm.querySelector(`.${cfg.modalContentClass}`); if(content && !content.contains(ev.target)){ closeModal(dm); state.unlocked=false; state.key=null; } });
  document.addEventListener('keydown', ev=>{ if((ev.key==='Escape'||ev.key==='Esc') && state.open){ const dm = document.getElementById(cfg.devModalId); if(dm){ closeModal(dm); state.unlocked=false; state.key=null; } } });

  if(typeof window !== 'undefined'){ window.__CLICKER_DEV__ = { computeHash: async(p)=> await sha256Hex(p+cfg.salt), open: ()=>{ const d=document.getElementById(cfg.devModalId); buildDevMain(d); openModal(d); }, close: ()=>{ const d=document.getElementById(cfg.devModalId); closeModal(d); state.unlocked=false; state.key=null }, cfg, state }; }
  return { cfg, state };
}
