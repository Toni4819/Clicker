/* menus/settings.js (ES module)
 * Exporte:
 *   - initSettings(opts?)
 *   - openSettings()
 *   - closeSettings()
 *
 * Corrigé:
 *   - Les inputs password sont créés DANS un <form> avant insertion DOM (aucun warning Chromium).
 *   - Pas d’IDs dupliqués dans les panneaux (on utilise des name/classes et le scoping).
 *   - Modal principal + modal-second pour aperçu/validation.
 *   - Confirms natifs pour actions destructives.
 */

// -----------------------------
// Références app (injectées via initSettings)
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
// Helpers DOM (sans innerHTML pour les nœuds critiques)
// -----------------------------
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "style" && typeof v === "object") Object.assign(node.style, v);
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) node.setAttribute(k, v === true ? "" : String(v));
  }
  for (const child of [].concat(children)) {
    if (child == null) continue;
    node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return node;
}

// -----------------------------
// API publique
// -----------------------------
export function openSettings() {
  if (document.getElementById(SETTINGS_MODAL_ID)) return;

  const overlay = el("div", { id: SETTINGS_OVERLAY_ID, class: "modal-overlay" });
  overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9990;";

  const modal = el("div", {
    id: SETTINGS_MODAL_ID,
    class: "modal",
    role: "dialog",
    "aria-modal": "true",
    "aria-labelledby": "settingsTitle",
  });
  modal.style.cssText = `
    position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);
    background:var(--panel-bg,#1a1a1a);color:var(--text,#fff);
    width:min(720px,90vw);max-height:85vh;overflow:auto;border-radius:12px;
    box-shadow:0 20px 60px rgba(0,0,0,.5);padding:16px;z-index:10000;
  `;

  const header = el("div", { style: "display:flex;align-items:center;justify-content:space-between;gap:12px;" }, [
    el("h2", { id: "settingsTitle", style: "margin:0;" }, ["Paramètres"]),
    el("button", { id: "settingsCloseBtn", class: "btn", "aria-label": "Fermer les paramètres" }, ["✕"]),
  ]);

  const tabsBar = el("div", { id: "settingsTabs", style: "display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;" }, [
    el("button", { id: "tabGeneral", class: "btn btn-secondary", "aria-controls": "panelGeneral", "aria-selected": "true" }, ["Général"]),
    el("button", { id: "tabExport", class: "btn btn-secondary", "aria-controls": "panelExport", "aria-selected": "false" }, ["Exporter"]),
    el("button", { id: "tabImport", class: "btn btn-secondary", "aria-controls": "panelImport", "aria-selected": "false" }, ["Importer"]),
    el("button", { id: "tabDanger", class: "btn btn-secondary", "aria-controls": "panelDanger", "aria-selected": "false" }, ["DANGER"]),
  ]);

  const panels = el("div", { id: "settingsPanels", style: "margin-top:12px;" }, [
    el("section", { id: "panelGeneral", role: "region", "aria-labelledby": "tabGeneral" }),
    el("section", { id: "panelExport", role: "region", "aria-labelledby": "tabExport", hidden: true }),
    el("section", { id: "panelImport", role: "region", "aria-labelledby": "tabImport", hidden: true }),
    el("section", { id: "panelDanger", role: "region", "aria-labelledby": "tabDanger", hidden: true }),
  ]);

  modal.appendChild(header);
  modal.appendChild(tabsBar);
  modal.appendChild(panels);

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
  document.getElementById(SETTINGS_MODAL_ID)?.remove();
  document.getElementById(SETTINGS_OVERLAY_ID)?.remove();
  document.getElementById(SECOND_OVERLAY_ID)?.remove();
}

// -----------------------------
// Panneaux
// -----------------------------
function renderGeneral(container) {
  container.textContent = "";
  const wrap = el("div", { style: "display:flex;flex-direction:column;gap:12px;" }, [
    el("p", {}, ["Réglez l’application à votre convenance. Les actions sensibles utilisent des confirmations natives."]),
    el("div", { style: "display:flex;gap:8px;flex-wrap:wrap;" }, [
      el("button", { class: "btn btn-open-export" }, ["→ Exporter"]),
      el("button", { class: "btn btn-open-import" }, ["→ Importer"]),
    ]),
  ]);
  container.appendChild(wrap);

  wrap.querySelector(".btn-open-export").addEventListener("click", () => {
    document.getElementById("tabExport").click();
  });
  wrap.querySelector(".btn-open-import").addEventListener("click", () => {
    document.getElementById("tabImport").click();
  });
}

function renderExport(container) {
  container.textContent = "";

  // Créer TOUT le formulaire en mémoire avant insertion → aucun warning
  const form = el("form", { "aria-label": "Export", novalidate: true });
  form.style.display = "flex";
  form.style.flexDirection = "column";
  form.style.gap = "8px";

  form.append(
    el("label", { class: "label-export-pwd" }, ["Mot de passe d’export"]),
    el("input", {
      type: "password",
      name: "exportPwd",
      autocomplete: "new-password",
      placeholder: "Choisissez un mot de passe",
      style: "width:100%;",
      required: true,
    }),
    el("div", { class: "row-actions", style: "display:flex;gap:8px;align-items:center;" }, [
      el("button", { type: "submit", class: "btn btn-export" }, ["🔒 Chiffrer & Copier"]),
      el("button", { type: "button", class: "btn btn-secondary btn-preview" }, ["Aperçu"]),
    ]),
    el("label", { class: "label-export-text", style: "font-weight:600;margin-top:4px;" }, ["Données chiffrées"]),
    el("textarea", { name: "exportText", rows: "6", readonly: true, "aria-readonly": "true", style: "width:100%;" }),
    el("small", {}, ["Le texte ci-dessus est chifré avec AES-GCM. Conservez-le en lieu sûr."])
  );

  container.appendChild(form);

  const pwdInput = form.querySelector('input[name="exportPwd"]');
  const ta = form.querySelector('textarea[name="exportText"]');
  const previewBtn = form.querySelector(".btn-preview");

  form.addEventListener("submit", async (e) => {
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
  container.textContent = "";

  const form = el("form", { "aria-label": "Import", novalidate: true });
  form.style.display = "flex";
  form.style.flexDirection = "column";
  form.style.gap = "8px";

  form.append(
    el("label", { class: "label-import-pwd" }, ["Mot de passe d’import"]),
    el("input", {
      type: "password",
      name: "importPwd",
      autocomplete: "current-password",
      placeholder: "Entrez le mot de passe utilisé à l’export",
      style: "width:100%;",
      required: true,
    }),
    el("label", { class: "label-import-text" }, ["Données chiffrées à importer"]),
    el("textarea", {
      name: "importText",
      rows: "6",
      placeholder: "Collez ici le bloc chiffré",
      style: "width:100%;",
    }),
    el("div", { class: "row-actions", style: "display:flex;gap:8px;align-items:center;" }, [
      el("button", { type: "submit", class: "btn btn-import" }, ["📂 Importer"]),
      el("button", { type: "button", class: "btn btn-secondary btn-validate" }, ["Valider seulement"]),
    ])
  );

  container.appendChild(form);

  const pwdInput = form.querySelector('input[name="importPwd"]');
  const ta = form.querySelector('textarea[name="importText"]');
  const validateBtn = form.querySelector(".btn-validate");

  form.addEventListener("submit", async (e) => {
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
  container.textContent = "";

  const wrap = el("div", { style: "display:flex;flex-direction:column;gap:12px;" }, [
    el("p", { style: "color:var(--danger,#ff6b6b);font-weight:600;" }, ["Zone dangereuse"]),
    el("button", { class: "btn btn-reset", style: "background:var(--danger,#b00020);" }, ["Réinitialiser la progression"]),
    el("button", { class: "btn btn-secondary btn-hardreload" }, ["Rechargement dur (vider caches & SW)"]),
  ]);
  container.appendChild(wrap);

  wrap.querySelector(".btn-reset").addEventListener("click", () => {
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

  wrap.querySelector(".btn-hardreload").addEventListener("click", async () => {
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
    overlay = el("div", { id: SECOND_OVERLAY_ID, class: "modal-second-overlay" });
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:11000;";
    overlay.addEventListener("click", () => {
      document.getElementById("modalSecondBox")?.remove();
      overlay.remove();
    });
    document.body.appendChild(overlay);
  }

  const box = el("div", {
    id: "modalSecondBox",
    class: "modal-second",
    role: "dialog",
    "aria-modal": "true",
  });
  box.style.cssText = `
    position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);
    background:var(--panel-bg,#202020);color:var(--text,#fff);
    width:min(640px,92vw);max-height:80vh;overflow:auto;border-radius:12px;
    box-shadow:0 24px 64px rgba(0,0,0,.6);padding:16px;z-index:12000;
  `;

  const head = el("div", { style: "display:flex;align-items:center;justify-content:space-between;gap:12px;" }, [
    el("h3", { style: "margin:0;" }, [escapeHtml(title)]),
    el("button", { class: "btn btn-close-second", "aria-label": "Fermer la fenêtre secondaire" }, ["✕"]),
  ]);
  const body = el("div", { style: "margin-top:12px;" });
  body.innerHTML = htmlContent;

  box.appendChild(head);
  box.appendChild(body);
  document.body.appendChild(box);

  box.querySelector(".btn-close-second").addEventListener("click", () => {
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
```
