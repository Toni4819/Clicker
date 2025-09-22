// menus/settings.js

// 🔒 AES-GCM / PBKDF2 helpers
const enc = new TextEncoder();
const dec = new TextDecoder();

async function deriveKey(password, salt) {
  const baseKey = await crypto.subtle.importKey(
    "raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt","decrypt"]
  );
}

async function encryptData(plainText, password) {
  const salt   = crypto.getRandomValues(new Uint8Array(16));
  const iv     = crypto.getRandomValues(new Uint8Array(12));
  const key    = await deriveKey(password, salt);
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv }, key, enc.encode(plainText)
  );
  const combined = new Uint8Array(salt.byteLength + iv.byteLength + cipher.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.byteLength);
  combined.set(new Uint8Array(cipher), salt.byteLength + iv.byteLength);
  return btoa(String.fromCharCode(...combined));
}

async function decryptData(b64, password) {
  const data    = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const salt    = data.slice(0, 16);
  const iv      = data.slice(16, 28);
  const payload = data.slice(28);
  const key     = await deriveKey(password, salt);
  const plain   = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, payload);
  return dec.decode(plain);
}

// 🆔 UID generator pour éviter tout id duplicate
function generateUID() {
  return Math.random().toString(36).slice(2, 9);
}

// 🛠 createModal helper (secondary modal, styled)
function createModal({ title, content, buttons }) {
  const overlay = document.createElement("div");
  overlay.className = "modal-second";

  const modalContent = document.createElement("div");
  modalContent.className = "modal-content";
  modalContent.innerHTML = `
    <header class="modal-header">
      <h2>${title}</h2>
      <button class="close-btn" aria-label="Fermer">✕</button>
    </header>
    <div class="modal-body">${content}</div>
  `;

  const footer = document.createElement("div");
  footer.className = "modal-footer";
  buttons.forEach(cfg => {
    const btn = document.createElement("button");
    btn.textContent = cfg.text;
    btn.className = cfg.className || "btn btn-secondary";
    btn.addEventListener("click", async () => {
      const result = await cfg.onClick?.();
      if (cfg.closeOnClick !== false && result !== false) {
        document.body.removeChild(overlay);
      }
    });
    footer.appendChild(btn);
  });
  modalContent.appendChild(footer);

  modalContent.querySelector(".close-btn").addEventListener("click", () => {
    document.body.removeChild(overlay);
  });

  overlay.appendChild(modalContent);
  return {
    open: () => document.body.appendChild(overlay)
  };
}

// 🧹 Nettoyage complet + reload
async function hardReload() {
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
  }
  if ("serviceWorker" in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r => r.unregister()));
  }
  try { localStorage.clear(); } catch {}
  try { sessionStorage.clear(); } catch {}
  if (indexedDB && indexedDB.databases) {
    const dbs = await indexedDB.databases();
    await Promise.all(dbs.map(db => new Promise(r => {
      if (!db.name) return r();
      const req = indexedDB.deleteDatabase(db.name);
      req.onsuccess = req.onerror = req.onblocked = () => r();
    })));
  }
  location.reload();
}

// ⚙️ Initialize Settings
export function initSettings({ els, state, keys, save, renderMain }) {
  // Principal settings modal
  const settingsModal = document.getElementById("settingsModal");
  settingsModal.className = "modal";
  settingsModal.setAttribute("role",          "dialog");
  settingsModal.setAttribute("aria-hidden",   "true");
  settingsModal.setAttribute("aria-labelledby", "settingsTitle");
  settingsModal.innerHTML = `
    <div class="modal-content" style="display:flex;flex-direction:column;height:100%;">
      <header class="modal-header">
        <h2 id="settingsTitle">⚙️ Paramètres</h2>
        <button id="closeSettingsBtn" class="close-btn" aria-label="Fermer">✕</button>
      </header>
      <div class="modal-body" style="flex:1;display:flex;flex-direction:column;gap:16px;">
        <button id="loginBtn" class="btn btn-secondary" style="width:100%;">🔒 Se connecter</button>
        <div id="rowEI" style="display:flex;gap:8px;">
          <button id="exportBtn" class="btn btn-primary" style="flex:1;">📤 Exporter (chiffré)</button>
          <button id="importBtn" class="btn btn-primary" style="flex:1;">📥 Importer (chiffré)</button>
        </div>
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;">
          <li><button id="reloadBtn" class="btn btn-warning" style="width:100%;">🔄 Recharger</button></li>
          <li><button id="themeBtn" class="btn btn-secondary" style="width:100%;">🌙 Thème</button></li>
          <li><button id="codesBtn" class="btn btn-shop" style="width:100%;">💳 Codes</button></li>
        </ul>
        <div style="flex:1;"></div>
        <div style="display:flex;justify-content:center;">
          <button id="resetBtn" class="btn footer-reset">↺ Reset total</button>
        </div>
      </div>
    </div>
  `;

  // DOM refs
  els.settingsBtn      = document.getElementById("settingsBtn");
  els.closeSettingsBtn = settingsModal.querySelector("#closeSettingsBtn");
  els.loginBtn         = settingsModal.querySelector("#loginBtn");
  els.exportBtn        = settingsModal.querySelector("#exportBtn");
  els.importBtn        = settingsModal.querySelector("#importBtn");
  els.reloadBtn        = settingsModal.querySelector("#reloadBtn");
  els.themeBtn         = settingsModal.querySelector("#themeBtn");
  els.codesBtn         = settingsModal.querySelector("#codesBtn");
  els.resetBtn         = settingsModal.querySelector("#resetBtn");

  function openSettings() {
    settingsModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }
  function closeSettings() {
    settingsModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  els.settingsBtn.addEventListener("click", openSettings);
  els.closeSettingsBtn.addEventListener("click", closeSettings);
  settingsModal.addEventListener("click", e => {
    if (e.target === settingsModal) closeSettings();
  });

  // Reset total
  els.resetBtn.addEventListener("click", () => {
    if (!confirm("⚠️ Tout réinitialiser ?")) return;
    localStorage.clear();
    keys.forEach(k => state[k] = 0);
    state.pointsPerClick         = 1;
    state.shopBoost              = 1;
    state.tempShopBoostFactor    = 1;
    state.tempShopBoostExpiresAt = 0;
    state.rebirths               = 0;
    save(); renderMain(); closeSettings();
  });

  // Export encrypted
  els.exportBtn.addEventListener("click", () => {
    const uid   = generateUID();
    const pwdId = `exportPwd-${uid}`;
    const rawId = `exportRaw-${uid}`;

    createModal({
      title: "Exporter les données (chiffré)",
      content: `
        <form autocomplete="off" style="position:relative;display:flex;flex-direction:column;gap:8px;">
          <input
            type="text"
            name="username"
            autocomplete="username"
            style="position:absolute;opacity:0;pointer-events:none;height:0;width:0;border:none;margin:0;padding:0;"
            aria-hidden="true" tabindex="-1"
          />
          <label for="${pwdId}">Mot de passe</label>
          <input
            id="${pwdId}"
            name="new-password"
            type="password"
            autocomplete="new-password"
            placeholder="Mot de passe"
            style="width:100%;"
          />
          <label for="${rawId}">Bloc chiffré (Base64)</label>
          <textarea
            id="${rawId}"
            name="export-data"
            rows="8"
            style="width:100%;"
            readonly
          ></textarea>
        </form>
      `,
      buttons: [
        {
          text: "Générer",
          className: "btn btn-primary",
          onClick: async () => {
            const pwdEl = document.getElementById(pwdId);
            const outEl = document.getElementById(rawId);
            const pwd   = pwdEl.value.trim();
            if (!pwd) { alert("Mot de passe requis"); return false; }
            outEl.value = await encryptData(JSON.stringify(state, null, 2), pwd);
            return false;
          },
          closeOnClick: false
        },
        {
          text: "Copier",
          className: "btn btn-secondary",
          onClick: async () => {
            const outEl = document.getElementById(rawId);
            if (!outEl.value) { alert("Générez d’abord"); return false; }
            await navigator.clipboard.writeText(outEl.value);
            return false;
          },
          closeOnClick: false
        },
        {
          text: "Télécharger",
          className: "btn btn-secondary",
          onClick: () => {
            const outEl = document.getElementById(rawId);
            if (!outEl.value) { alert("Générez d’abord"); return false; }
            const blob = new Blob([outEl.value], { type: "text/plain" });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement("a");
            a.href = url; a.download = "clicker-export.enc"; a.click();
            URL.revokeObjectURL(url);
            return false;
          },
          closeOnClick: false
        },
        { text: "Fermer", className: "btn btn-secondary", onClick: () => {} }
      ]
    }).open();
  });

  // Import encrypted
  els.importBtn.addEventListener("click", () => {
    const uid   = generateUID();
    const encId = `importEnc-${uid}`;
    const pwdId = `importPwd-${uid}`;

    createModal({
      title: "Importer les données (chiffré)",
      content: `
        <form autocomplete="off" style="position:relative;display:flex;flex-direction:column;gap:8px;">
          <input
            type="text"
            name="username"
            autocomplete="username"
            style="position:absolute;opacity:0;pointer-events:none;height:0;width:0;border:none;margin:0;padding:0;"
            aria-hidden="true" tabindex="-1"
          />
          <label for="${encId}">Bloc chiffré (Base64)</label>
          <textarea
            id="${encId}"
            name="encrypted-data"
            rows="8"
            style="width:100%;"
            placeholder="Collez le texte chiffré"
          ></textarea>
          <label for="${pwdId}">Mot de passe</label>
          <input
            id="${pwdId}"
            name="current-password"
            type="password"
            autocomplete="current-password"
            placeholder="Mot de passe"
            style="width:100%;"
          />
        </form>
      `,
      buttons: [
        {
          text: "Déchiffrer et appliquer",
          className: "btn btn-primary",
          onClick: async () => {
            const encEl = document.getElementById(encId);
            const pwdEl = document.getElementById(pwdId);
            const b64   = encEl.value.trim();
            const pwd   = pwdEl.value.trim();
            if (!b64) { alert("Bloc chiffré manquant"); return false; }
            if (!pwd) { alert("Mot de passe requis"); return false; }
            try {
              const plain = await decryptData(b64, pwd);
              const data  = JSON.parse(plain);
              keys.forEach(k => { if (data[k] != null) state[k] = data[k]; });
              state.pointsPerClick         = data.pointsPerClick         ?? 1;
              state.shopBoost              = data.shopBoost              ?? 1;
              state.tempShopBoostFactor    = data.tempShopBoostFactor    ?? 1;
              state.tempShopBoostExpiresAt = data.tempShopBoostExpiresAt ?? 0;
              state.rebirths               = data.rebirths               ?? 0;
              save(); renderMain(); closeSettings();
            } catch {
              alert("Échec du déchiffrement");
              return false;
            }
          }
        },
        { text: "Fermer", className: "btn btn-secondary", onClick: () => {} }
      ]
    }).open();
  });

  // Codes promotionnels
  els.codesBtn.addEventListener("click", () => {
    const uid        = generateUID();
    const inputId    = `codeInput-${uid}`;
    const usedListId = `usedList-${uid}`;

    const modal = createModal({
      title: "Codes promotionnels",
      content: `
        <input id="${inputId}" type="text" style="width:100%;" placeholder="Entrez le code" />
        <h4>Déjà utilisés :</h4>
        <ul id="${usedListId}" style="padding-left:20px;"></ul>
      `,
      buttons: [
        {
          text: "Valider",
          className: "btn btn-primary",
          onClick: () => {
            const inp  = document.getElementById(inputId);
            const code = inp.value.trim().toUpperCase();
            let used   = JSON.parse(localStorage.getItem("usedCodes") || "[]");
            if (!code) return false;
            if (used.includes(code)) {
              alert("Déjà utilisé");
            } else {
              used.push(code);
              localStorage.setItem("usedCodes", JSON.stringify(used));
              alert("Code appliqué !");
              const ul = document.getElementById(usedListId);
              ul.innerHTML = "";
              used.forEach(c => {
                const li = document.createElement("li");
                li.textContent = c;
                ul.appendChild(li);
              });
            }
            return false;
          },
          closeOnClick: false
        },
        { text: "Fermer", className: "btn btn-secondary", onClick: () => {} }
      ]
    });

    modal.open();
    const used = JSON.parse(localStorage.getItem("usedCodes") || "[]");
    const ul   = document.getElementById(usedListId);
    ul.innerHTML = "";
    used.forEach(c => {
      const li = document.createElement("li");
      li.textContent = c;
      ul.appendChild(li);
    });
  });

  // Recharger (confirm natif + cleanup)
  els.reloadBtn.addEventListener("click", async () => {
    if (!confirm("Voulez-vous vraiment vider le cache et recharger ?")) return;
    await hardReload();
  });

  // Stubs Login & Thème
  els.loginBtn.addEventListener("click", () => {
    alert("Connexion à implémenter");
  });
  els.themeBtn.addEventListener("click", () => {
    alert("Changement de thème à implémenter");
  });
}
