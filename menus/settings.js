/* menus/settings.js (ES module)
 * Exports:
 *   - initSettings(opts?)
 *   - openSettings()
 *   - closeSettings()
 *
 * Inclus:
 *   - Import/Export chiffrés (AES-GCM + PBKDF2)
 *   - Inputs password toujours dans un <form> (fix Chromium)
 *   - Modal principal + modal-second (overlay secondaire)
 *   - Confirms natifs pour actions destructives
 *   - Garde-fou global: encapsule automatiquement tout input[type=password] hors <form>
 */

// -----------------------------
// Références app (injectées)
// -----------------------------
let appState;
let appSave;
let appRenderMain;
let appPerformHardReload;

export function initSettings(opts = {}) {
  appState = opts.state ?? (typeof window !== "undefined" ? window.state : appState);
  appSave = opts.save ?? (typeof window !== "undefined" ? window.save : appSave);
  appRenderMain = opts.renderMain ?? (typeof window !== "undefined" ? window.renderMain : appRenderMain);
  appPerformHardReload =
    opts.performHardReload ?? (typeof window !== "undefined" ? window.performHardReload : appPerformHardReload);
}

// -----------------------------
// Constantes UI/Crypto
// -----------------------------
const SETTINGS_MODAL_ID = "settingsModal";
const SETTINGS_OVERLAY_ID = "settingsOverlay";
const SECOND_OVERLAY_ID = "modalSecondOverlay";

const CRYPTO_VERSION = 1;
const PBKDF2_ITERS = 150000;
const PBKDF2_HASH = "SHA-256";
const AES_KEY_BITS = 256;
const IV_BYTES = 12;
const SALT_BYTES = 16;

// -----------------------------
// API publique
// -----------------------------
export function openSettings() {
  if (document.getElementById(SETTINGS_MODAL_ID)) return;

  const overlay = document.createElement("div");
  overlay.id = SETTINGS_OVERLAY_ID;
  overlay.className = "modal-overlay";
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9990;";

  const modal = document.createElement("div");
  modal.id = SETTINGS_MODAL_ID;
  modal.className = "modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "settingsTitle");
  modal.style.cssText = `
    position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);
    background:var(--panel-bg,#1a1a1a);color:var(--text,#fff);
    width:min(720px,90vw);max-height:85vh;overflow:auto;border-radius:12px;
    box-shadow:0 20px 60px rgba(0,0,0,.5);padding:16px;z-index:10000;
  `;

  modal.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
      <h2 id="settingsTitle" style="margin:0;">Paramètres</h2>
      <button id="settingsCloseBtn" class="btn" aria-label="Fermer les paramètres">✕</button>
    </div>

    <div id="settingsTabs" style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
      <button id="tabGeneral" class="btn btn-secondary" aria-controls="panelGeneral" aria-selected="true">Général</button>
      <button id="tabExport" class="btn btn-secondary" aria-controls="panelExport" aria-selected="false">Exporter</button>
      <button id="tabImport" class="btn btn-secondary" aria-controls="panelImport" aria-selected="false">Importer</button>
      <button id="tabDanger" class="btn btn-secondary" aria-controls="panelDanger" aria-selected="false">DANGER</button>
    </div>

    <div id="settingsPanels" style="margin-top:12px;">
      <section id="panelGeneral" role="region" aria-labelledby="tabGeneral"></section>
      <section id="panelExport" role="region" aria-labelledby="tabExport" hidden></section>
      <section id="panelImport" role="region" aria-labelledby="tabImport" hidden></section>
      <section id="panelDanger" role="region" aria-labelledby="tabDanger" hidden></section>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  overlay.addEventListener("click", closeSettings);
  modal.querySelector("#settingsCloseBtn").addEventListener("click", closeSettings);

  renderGeneral(document.getElementById("panelGeneral"));
  renderExport(document.getElementById("panelExport"));
  renderImport(document.getElementById("panelImport"));
  renderDanger(document.getElementById("panelDanger"));

  const tabs = [
    { btn: "tabGeneral", panel: "panelGeneral" },
    { btn: "tabExport", panel: "panelExport" },
    { btn: "tabImport", panel: "panelImport" },
    { btn: "tabDanger", panel: "panelDanger" },
  ];
  tabs.forEach(({ btn, panel }) => {
    document.getElementById(btn).addEventListener("click", () => {
      tabs.forEach(({ btn: b, panel: p }) => {
        document.getElementById(p).hidden = p !== panel;
        document.getElementById(b).setAttribute("aria-selected", p === panel ? "true" : "false");
      });
    });
  });
}

export function closeSettings() {
  const modal = document.getElementById(SETTINGS_MODAL_ID);
  const overlay = document.getElementById(SETTINGS_OVERLAY_ID);
  const second = document.getElementById(SECOND_OVERLAY_ID);
  if (modal) modal.remove();
  if (overlay) overlay.remove();
  if (second) second.remove();
}

// -----------------------------
// Panneaux
// -----------------------------
function renderGeneral(container) {
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <p>Réglez l’application à votre convenance. Les actions sensibles utilisent des confirmations natives.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button id="openExportFromGeneral" class="btn">→ Exporter</button>
        <button id="openImportFromGeneral" class="btn">→ Importer</button>
      </div>
    </div>
  `;
  container.querySelector("#openExportFromGeneral").addEventListener("click", () => {
    document.getElementById("tabExport").click();
  });
  container.querySelector("#openImportFromGeneral").addEventListener("click", () => {
    document.getElementById("tabImport").click();
  });
}

function renderExport(container) {
  container.innerHTML = `
    <form id="exportForm" style="display:flex;flex-direction:column;gap:8px;">
      <label for="exportPwd" style="font-weight:600;">Mot de passe d’export</label>
      <input id="exportPwd" name="exportPwd" type="password" inputmode="text" autocomplete="new-password"
             placeholder="Choisissez un mot de passe" style="width:100%;" required />
      <div style="display:flex;gap:8px;align-items:center;">
        <button type="submit" id="applyExportBtn" class="btn">🔒 Chiffrer & Copier</button>
        <button type="button" id="previewExportBtn" class="btn btn-secondary">Aperçu</button>
      </div>
      <label for="exportText" style="font-weight:600;margin-top:4px;">Données chiffrées</label>
      <textarea id="exportText" rows="6" style="width:100%;" readonly aria-readonly="true"></textarea>
      <small>Le texte ci-dessus est chiffré avec AES-GCM. Conservez-le en lieu sûr.</small>
    </form>
  `;

  const exportForm = container.querySelector("#exportForm");
  const pwdInput = exportForm.querySelector("#exportPwd");
  const ta = exportForm.querySelector("#exportText");
  const previewBtn = exportForm.querySelector("#previewExportBtn");

  exportForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const password = pwdInput.value.trim();
    if (!password) return alert("Mot de passe requis.");
    try {
      const data = JSON.stringify(appState ?? {});
      const encrypted = await encryptData(data, password);
      ta.value = encrypted;
      try {
        await navigator.clipboard.writeText(encrypted);
        alert("✅ Export chiffré copié dans le presse‑papiers.");
      } catch {
        ta.select();
        document.execCommand("copy");
        alert("✅ Export chiffré prêt. Copie tentée.");
      }
    } catch (err) {
      console.error("Erreur export:", err);
      alert("❌ Erreur lors de l’export.");
    }
  });

  previewBtn.addEventListener("click", () => {
    try {
      const data = JSON.stringify(appState ?? {}, null, 2);
      openSecondModal("Aperçu de l’état (non chiffré)", `<pre style="white-space:pre-wrap;margin:0;">${escapeHtml(data)}</pre>`);
    } catch (err) {
      console.error("Erreur aperçu:", err);
      alert("❌ Impossible d’afficher l’aperçu.");
    }
  });
}

function renderImport(container) {
  container.innerHTML = `
    <form id="importForm" style="display:flex;flex-direction:column;gap:8px;">
      <label for="importPwd" style="font-weight:600;">Mot de passe d’import</label>
      <input id="importPwd" name="importPwd" type="password" inputmode="text" autocomplete="current-password"
             placeholder="Entrez le mot de passe utilisé à l’export" style="width:100%;" required />
      <label for="importText" style="font-weight:600;">Données chiffrées à importer</label>
      <textarea id="importText" name="importText" rows="6" style="width:100%;"
                placeholder="Collez ici le bloc chiffré"></textarea>
      <div style="display:flex;gap:8px;align-items:center;">
        <button type="submit" id="applyImportBtn" class="btn">📂 Importer</button>
        <button type="button" id="validateImportBtn" class="btn btn-secondary">Valider seulement</button>
      </div>
    </form>
  `;

  const importForm = container.querySelector("#importForm");
  const pwdInput = importForm.querySelector("#importPwd");
  const ta = importForm.querySelector("#importText");
  const validateBtn = importForm.querySelector("#validateImportBtn");

  importForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const password = pwdInput.value.trim();
    const payload = (ta.value || "").trim();
    if (!password) return alert("Mot de passe requis.");
    if (!payload) return alert("Collez les données chiffrées à importer.");
    try {
      const decrypted = await decryptData(payload, password);
      const imported = JSON.parse(decrypted);
      if (!nativeConfirm("Cette opération remplacera votre état actuel. Continuer ?")) return;
      if (typeof appState === "object" && appState) {
        for (const k of Object.keys(appState)) delete appState[k];
        Object.assign(appState, imported);
      }
      appSave?.();
      appRenderMain?.();
      closeSettings();
      alert("✅ Import réussi.");
    } catch (err) {
      console.error("Erreur import:", err);
      alert("❌ Mot de passe incorrect ou données invalides.");
    }
  });

  validateBtn.addEventListener("click", async () => {
    const password = pwdInput.value.trim();
    const payload = (ta.value || "").trim();
    if (!password || !payload) return alert("Mot de passe et données requis.");
    try {
      const decrypted = await decryptData(payload, password);
      const parsed = JSON.parse(decrypted);
      openSecondModal(
        "Validation des données (non appliquées)",
        `<pre style="white-space:pre-wrap;margin:0;">${escapeHtml(JSON.stringify(parsed, null, 2))}</pre>`
      );
    } catch (err) {
      console.error("Erreur validation import:", err);
      alert("❌ Mot de passe incorrect ou données invalides.");
    }
  });
}

function renderDanger(container) {
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <p style="color:var(--danger,#ff6b6b);font-weight:600;">Zone dangereuse</p>
      <button id="btnResetState" class="btn" style="background:var(--danger,#b00020);">Réinitialiser la progression</button>
      <button id="btnHardReload" class="btn btn-secondary">Rechargement dur (vider caches & SW)</button>
    </div>
  `;

  container.querySelector("#btnResetState").addEventListener("click", () => {
    if (!nativeConfirm("Réinitialiser la progression ? Cette action est irréversible.")) return;
    try {
      try { localStorage.clear?.(); } catch {}
      try { sessionStorage.clear?.(); } catch {}
      if (indexedDB?.databases) {
        indexedDB.databases().then(dbs => dbs.forEach(db => indexedDB.deleteDatabase(db.name)));
      }
      if (typeof appState === "object" && appState) {
        for (const k of Object.keys(appState)) delete appState[k];
      }
      appSave?.();
      appRenderMain?.();
      alert("✅ Progression réinitialisée.");
    } catch (err) {
      console.error("Erreur reset:", err);
      alert("❌ Erreur lors de la réinitialisation.");
    }
  });

  container.querySelector("#btnHardReload").addEventListener("click", async () => {
    if (!nativeConfirm("Procéder à un rechargement dur ? Cela peut désinstaller le SW et vider le cache.")) return;
    try {
      if (typeof appPerformHardReload === "function") {
        await appPerformHardReload();
      } else {
        await bestEffortHardReload();
      }
    } catch (err) {
      console.error("Erreur hard reload:", err);
    } finally {
      location.reload();
    }
  });
}

// -----------------------------
// Modal-second overlay
// -----------------------------
function openSecondModal(title, htmlContent) {
  let overlay = document.getElementById(SECOND_OVERLAY_ID);
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = SECOND_OVERLAY_ID;
    overlay.className = "modal-second-overlay";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:11000;";
    overlay.addEventListener("click", () => {
      const box = document.getElementById("modalSecondBox");
      if (box) box.remove();
      overlay.remove();
    });
    document.body.appendChild(overlay);
  }

  const box = document.createElement("div");
  box.id = "modalSecondBox";
  box.className = "modal-second";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.style.cssText = `
    position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);
    background:var(--panel-bg,#202020);color:var(--text,#fff);
    width:min(640px,92vw);max-height:80vh;overflow:auto;border-radius:12px;
    box-shadow:0 24px 64px rgba(0,0,0,.6);padding:16px;z-index:12000;
  `;
  box.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
      <h3 style="margin:0;">${escapeHtml(title)}</h3>
      <button id="modalSecondClose" class="btn" aria-label="Fermer la fenêtre secondaire">✕</button>
    </div>
    <div style="margin-top:12px;">${htmlContent}</div>
  `;
  document.body.appendChild(box);
  box.querySelector("#modalSecondClose").addEventListener("click", () => {
    box.remove();
    overlay.remove();
  });
}

// -----------------------------
// Crypto (AES-GCM + PBKDF2)
// -----------------------------
async function encryptData(plainText, password) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(password, salt);
  const cipherBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plainText));
  const payload = {
    v: CRYPTO_VERSION,
    alg: "AES-GCM",
    kdf: { name: "PBKDF2", iters: PBKDF2_ITERS, hash: PBKDF2_HASH },
    salt: toB64(salt),
    iv: toB64(iv),
    ct: toB64(new Uint8Array(cipherBuf)),
  };
  return `CLICKER-ENC:${btoa(JSON.stringify(payload))}`;
}

async function decryptData(payload, password) {
  const normalized = normalizePayload(payload);
  const data = JSON.parse(atob(normalized));
  if (data.v !== CRYPTO_VERSION || data.alg !== "AES-GCM") throw new Error("Format/Version non supporté");
  const salt = fromB64(data.salt);
  const iv = fromB64(data.iv);
  const ct = fromB64(data.ct);
  const key = await deriveKey(password, salt);
  const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  const dec = new TextDecoder();
  return dec.decode(plainBuf);
}

async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: PBKDF2_HASH, salt, iterations: PBKDF2_ITERS },
    baseKey,
    { name: "AES-GCM", length: AES_KEY_BITS },
    false,
    ["encrypt", "decrypt"]
  );
}

function normalizePayload(s) {
  const str = (s || "").trim();
  if (str.startsWith("CLICKER-ENC:")) return str.slice("CLICKER-ENC:".length);
  return str;
}

// -----------------------------
// Utils
// -----------------------------
function nativeConfirm(message) {
  return window.confirm(message);
}

async function bestEffortHardReload() {
  if (navigator.serviceWorker?.getRegistrations) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r => r.unregister()));
  }
  if (window.caches?.keys) {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
  }
  try { await navigator.storage?.persist?.(); } catch {}
  try { localStorage.clear?.(); } catch {}
  try { sessionStorage.clear?.(); } catch {}
}

function toB64(u8) {
  let str = "";
  for (let i = 0; i < u8.length; i++) str += String.fromCharCode(u8[i]);
  return btoa(str);
}

function fromB64(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// -----------------------------
// Garde-fou global: encapsule auto tous les password inputs hors <form>
// -----------------------------
(function passwordInputsMustBeInForms() {
  function wrapPasswordInput(inp) {
    if (!inp || inp.closest("form")) return;
    const form = document.createElement("form");
    form.style.display = "contents"; // pas d'impact visuel
    form.addEventListener("submit", (e) => e.preventDefault());
    const parent = inp.parentNode;
    const next = inp.nextSibling;
    parent.insertBefore(form, next);
    form.appendChild(inp);
  }
  function scan(root = document) {
    root.querySelectorAll('input[type="password"]').forEach(wrapPasswordInput);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => scan());
  } else {
    scan();
  }
  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        const el = node;
        if (el.matches?.('input[type="password"]')) wrapPasswordInput(el);
        el.querySelectorAll?.('input[type="password"]').forEach(wrapPasswordInput);
      }
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();
```
