// menus/settings/codes.js

async function sha256Hex(bytes) {
  const buf = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
function utf8Bytes(str) { return new TextEncoder().encode(str); }
function getModalElement() {
  return document.querySelector('.modal-second') ||
         document.querySelector('.modal') ||
         null;
}
function normalizeCode(raw) { return raw.trim().toUpperCase(); }
function ensureStateArrays(state) {
  if (!Array.isArray(state.availableCodes)) state.availableCodes = []; 
  if (!Array.isArray(state.usedCodes)) state.usedCodes = [];
}

const BUILT_IN_CODES = [
  {
    salt: "a3f1b2c47d5e6f8890aa11bb",
    hash: "C34919DFDB0E7318898136EB1914D2BC30AB4FFF3BA5929B6A826DD960AEA321",
    prize: 1_000_000_000_000 // 1T
  },
  {
    salt: "c9d8e7f60411223344556677",
    hash: "18CCC31EAEFEF0F384760BDDEC06F1512C149527BEC836AC3D409747C63B16F4",
    prize: 1_000_000_000 // 1B
  }
];

export async function enterCode(state, save, renderMain, renderSettingsBody) {
  ensureStateArrays(state);

  for (const e of BUILT_IN_CODES) {
    if (!state.availableCodes.some(x => x.hash === e.hash && x.salt === e.salt)) {
      state.availableCodes.push({ salt: e.salt, hash: e.hash, prize: e.prize });
    }
  }

  const modal = getModalElement();
  if (modal) {
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }

  const raw = prompt("Entrez votre code :");

  if (modal) {
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }
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
    if (h === entry.hash) {
      matched = { entry, computedHash: h };
      break;
    }
  }

  if (!matched) { alert("Code invalide"); return; }
  if (state.usedCodes.includes(matched.computedHash)) {
    alert("Ce code a déjà été utilisé.");
    return;
  }

  // appliquer la récompense définie dans l’entrée
  const prize = matched.entry.prize || 1000;
  state.points = (state.points || 0) + prize;
  alert(`+${prize.toLocaleString("fr-FR")} points`);

  state.usedCodes.push(matched.computedHash);
  save();
  renderMain();
  renderSettingsBody();
}

export function listAvailableCodes(state) {
  ensureStateArrays(state);
  return state.availableCodes.map(e => ({
    hash: e.hash,
    salt: e.salt,
    prize: e.prize
  }));
}
