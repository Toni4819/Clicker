// menus/settings/codes.js

async function sha256Hex(bytes) {
  const buf = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
function utf8Bytes(str) { return new TextEncoder().encode(str); }
function normalizeCode(raw) { return raw.trim().toUpperCase(); }
function ensureStateArrays(state) {
  if (!Array.isArray(state.availableCodes)) state.availableCodes = [];
  if (!Array.isArray(state.usedCodes)) state.usedCodes = [];
}

const BUILT_IN_CODES = [
  {
    salt: "a3f1b2c47d5e6f8890aa11bb",
    hash: "C34919DFDB0E7318898136EB1914D2BC30AB4FFF3BA5929B6A826DD960AEA321",
    prize: 1_000_000_000_000
  },
  {
    salt: "c9d8e7f60411223344556677",
    hash: "18CCC31EAEFEF0F384760BDDEC06F1512C149527BEC836AC3D409747C63B16F4",
    prize: 1_000_000_000
  }
];

function getModalElement() {
  return document.querySelector('.modal-second') ||
         document.querySelector('.modal') ||
         null;
}

/* Crée et affiche un modal utilisant .modal-second si présent.
   Retourne une Promise qui résout sur la chaîne saisie ou null si annulé. */
function showCodeModal() {
  return new Promise((resolve) => {
    // tente d'utiliser un container existant .modal-second
    const container = getModalElement() || document.body;
    // overlay + dialog
    const overlay = document.createElement('div');
    overlay.className = 'modal-second modal-second--overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-hidden', 'false');
    overlay.style = `
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0,0,0,0.5);
      z-index: 10000;
    `;

    const dialog = document.createElement('div');
    dialog.className = 'modal-second__dialog';
    dialog.style = `
      width: 90%;
      max-width: 420px;
      background: var(--surface, #fff);
      color: var(--text, #000);
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    `;
    dialog.innerHTML = `
      <h2 style="margin:0 0 8px;font-size:1.1rem">Entrer un code</h2>
      <label for="__code_input" style="display:block;margin-bottom:8px;font-size:0.9rem">Code</label>
      <input id="__code_input" type="text" inputmode="text" autocomplete="off"
        style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;margin-bottom:12px;font-size:1rem" />
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button id="__code_cancel" style="padding:8px 12px;border-radius:4px;background:#eee;border:0">Annuler</button>
        <button id="__code_ok" style="padding:8px 12px;border-radius:4px;background:var(--accent,#0078d4);color:#fff;border:0">Valider</button>
      </div>
    `;

    overlay.appendChild(dialog);
    (container === document.body ? document.body : container).appendChild(overlay);

    const input = overlay.querySelector('#__code_input');
    const btnOk = overlay.querySelector('#__code_ok');
    const btnCancel = overlay.querySelector('#__code_cancel');

    // focus management simple
    const previouslyFocused = document.activeElement;
    input.focus();
    document.body.classList.add('modal-open');

    function cleanup() {
      document.body.classList.remove('modal-open');
      overlay.remove();
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
      document.removeEventListener('keydown', onKeydown);
    }

    function finish(value) {
      cleanup();
      resolve(value);
    }

    btnCancel.addEventListener('click', () => finish(null));
    btnOk.addEventListener('click', () => finish(input.value || null));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) finish(null);
    });

    function onKeydown(e) {
      if (e.key === 'Escape') finish(null);
      if (e.key === 'Enter') {
        // prevent accidental form submit propagation
        e.preventDefault();
        finish(input.value || null);
      }
    }
    document.addEventListener('keydown', onKeydown);
  });
}

export async function enterCode(state, save, renderMain, renderSettingsBody) {
  ensureStateArrays(state);

  for (const e of BUILT_IN_CODES) {
    if (!state.availableCodes.some(x => x.hash === e.hash && x.salt === e.salt)) {
      state.availableCodes.push({ salt: e.salt, hash: e.hash, prize: e.prize });
    }
  }

  const raw = await showCodeModal();
  if (!raw) return;

  const normalized = normalizeCode(raw);

  let matched = null;
  for (const entry of state.availableCodes) {
    if (!entry || !entry.salt || !entry.hash) continue;
    const saltBytes = utf8Bytes(entry.salt);
    const codeBytes = utf8Bytes(normalized);
    const concat = new Uint8Array(saltBytes.length + codeBytes.length);
    concat.set(saltBytes, 0);
    concat.set(codeBytes, saltBytes.length);
    const h = await sha256Hex(concat);
    const hUp = h.toUpperCase(); // normaliser en majuscules pour comparaison
    if (hUp === entry.hash.toUpperCase()) {
      matched = { entry, computedHash: hUp };
      break;
    }
  }

  if (!matched) { alert("Code invalide"); return; }

  // stocker les used codes en majuscules pour cohérence
  const usedList = state.usedCodes.map(x => (typeof x === 'string' ? x.toUpperCase() : x));
  if (usedList.includes(matched.computedHash)) {
    alert("Ce code a déjà été utilisé.");
    return;
  }

  const prize = matched.entry.prize || 1000;
  state.points = (state.points || 0) + prize;
  alert(`+${prize.toLocaleString("fr-FR")} points`);

  state.usedCodes.push(matched.computedHash);
  save();
  if (typeof renderMain === 'function') renderMain();
  if (typeof renderSettingsBody === 'function') renderSettingsBody();
}

export function listAvailableCodes(state) {
  ensureStateArrays(state);
  return state.availableCodes.map(e => ({
    hash: e.hash,
    salt: e.salt,
    prize: e.prize
  }));
}
