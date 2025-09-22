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
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(password, salt);
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
  const data    = Uint8Array.from(atob(b64), c=>c.charCodeAt(0));
  const salt    = data.slice(0,16);
  const iv      = data.slice(16,28);
  const payload = data.slice(28);
  const key     = await deriveKey(password, salt);
  const plain   = await crypto.subtle.decrypt({ name:"AES-GCM", iv }, key, payload);
  return dec.decode(plain);
}

// 🛠 createModal helper (second modal, au-dessus du settings)
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
    btn.addEventListener("click", () => {
      cfg.onClick();
      if (cfg.closeOnClick !== false) document.body.removeChild(overlay);
    });
    footer.appendChild(btn);
  });
  modalContent.appendChild(footer);

  modalContent.querySelector(".close-btn").addEventListener("click", () => {
    document.body.removeChild(overlay);
  });

  overlay.appendChild(modalContent);
  return { open: () => document.body.appendChild(overlay) };
}

// ⚙️ Initialize Settings
export function initSettings({ els, state, keys, save, renderMain }) {
  const settingsModal = document.getElementById("settingsModal");
  settingsModal.className = "modal";
  settingsModal.setAttribute("role","dialog");
  settingsModal.setAttribute("aria-hidden","true");
  settingsModal.setAttribute("aria-labelledby","settingsTitle");
  settingsModal.innerHTML = `
    <div class="modal-content" style="display:flex;flex-direction:column;height:100%;">
      <header class="modal-header">
        <h2 id="settingsTitle">⚙️ Paramètres</h2>
        <button id="closeSettingsBtn" class="close-btn" aria-label="Fermer">✕</button>
      </header>
      <div class="modal-body" style="flex:1;display:flex;flex-direction:column;gap:16px;">
        <button id="loginBtn" class="btn" style="width:100%;">🔒 Se connecter</button>
        <div id="rowEI" style="display:flex;gap:8px;">
          <button id="exportBtn" class="btn" style="flex:1;">📤 Exporter</button>
          <button id="importBtn" class="btn" style="flex:1;">📥 Importer</button>
        </div>
        <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;">
          <li><button id="reloadBtn" class="btn" style="width:100%;">🔄 Recharger</button></li>
          <li><button id="themeBtn" class="btn" style="width:100%;">🌙 Thème</button></li>
          <li><button id="codesBtn" class="btn" style="width:100%;">💳 Codes</button></li>
        </ul>
        <div style="flex:1;"></div>
        <div style="display:flex;justify-content:center;">
          <button id="resetBtn" class="btn footer-reset">↺ Reset total</button>
        </div>
      </div>
    </div>
  `;

  // DOM references
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
    settingsModal.setAttribute("aria-hidden","false");
    document.body.classList.add("modal-open");
  }
  function closeSettings() {
    settingsModal.setAttribute("aria-hidden","true");
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
    state.pointsPerClick = 1;
    state.shopBoost = 1;
    state.tempShopBoostFactor = 1;
    state.tempShopBoostExpiresAt = 0;
    state.rebirths = 0;
    save(); renderMain(); closeSettings();
  });

  // EXPORT modal
  els.exportBtn.addEventListener("click", () => {
    createModal({
      title: "Exporter les données",
      content: `
        <textarea id="exportRaw" rows="8" style="width:100%;" readonly>${JSON.stringify(state,null,2)}</textarea>
      `,
      buttons: [
        {
          text: "Copier",
          onClick: () => navigator.clipboard.writeText(document.getElementById("exportRaw").value),
          closeOnClick: false
        },
        {
          text: "Télécharger",
          onClick: () => {
            const data = document.getElementById("exportRaw").value;
            const blob = new Blob([data],{type:"application/json"});
            const url = URL.createObjectURL(blob);
            const a   = document.createElement("a");
            a.href = url; a.download = "clicker-export.json"; a.click();
            URL.revokeObjectURL(url);
          },
          closeOnClick: false
        },
        { text: "Fermer", onClick: () => {}, closeOnClick: true }
      ]
    }).open();
  });

  // IMPORT modal
  els.importBtn.addEventListener("click", () => {
    createModal({
      title: "Importer les données",
      content: `
        <textarea id="importRaw" rows="8" style="width:100%;" placeholder="Collez le JSON brut"></textarea>
      `,
      buttons: [
        {
          text: "Appliquer",
          onClick: () => {
            try {
              const raw = document.getElementById("importRaw").value.trim();
              const data = JSON.parse(raw);
              keys.forEach(k => { if (data[k] != null) state[k] = data[k]; });
              state.pointsPerClick         = data.pointsPerClick         ?? 1;
              state.shopBoost              = data.shopBoost              ?? 1;
              state.tempShopBoostFactor    = data.tempShopBoostFactor    ?? 1;
              state.tempShopBoostExpiresAt = data.tempShopBoostExpiresAt ?? 0;
              state.rebirths               = data.rebirths               ?? 0;
              save(); renderMain(); closeSettings();
            } catch {
              alert("JSON invalide");
            }
          },
          closeOnClick: true
        },
        { text: "Fermer", onClick: () => {}, closeOnClick: true }
      ]
    }).open();
  });

  // CODES modal
  els.codesBtn.addEventListener("click", () => {
    const modal = createModal({
      title: "Codes promotionnels",
      content: `
        <input id="codeInput" style="width:100%;" placeholder="Entrez le code" />
        <h4>Déjà utilisés :</h4>
        <ul id="usedList" style="padding-left:20px;"></ul>
      `,
      buttons: [
        {
          text: "Valider",
          onClick: () => {
            const code = document.getElementById("codeInput").value.trim().toUpperCase();
            let used   = JSON.parse(localStorage.getItem("usedCodes")||"[]");
            if (!code) return;
            if (used.includes(code)) {
              alert("Déjà utilisé");
            } else {
              used.push(code);
              localStorage.setItem("usedCodes", JSON.stringify(used));
              alert("Code appliqué !");
              const ul = document.getElementById("usedList");
              ul.innerHTML = "";
              used.forEach(c => {
                const li = document.createElement("li");
                li.textContent = c;
                ul.appendChild(li);
              });
            }
          },
          closeOnClick: false
        },
        { text: "Fermer", onClick: () => {}, closeOnClick: true }
      ]
    });
    modal.open();
    // Remplir la liste des codes déjà utilisés à l’ouverture
    const ul = document.getElementById("usedList");
    const used = JSON.parse(localStorage.getItem("usedCodes")||"[]");
    ul.innerHTML = "";
    used.forEach(c => {
      const li = document.createElement("li");
      li.textContent = c;
      ul.appendChild(li);
    });
  });

  // RELOAD modal (vide caches + SW + localStorage, puis reload)
  els.reloadBtn.addEventListener("click", () => {
    createModal({
      title: "Recharger la page",
      content: `<p>Voulez-vous vraiment vider le cache et recharger ?</p>`,
      buttons: [
        {
          text: "Recharger",
          onClick: async () => {
            try {
              if ('caches' in window) {
                const names = await caches.keys();
                await Promise.all(names.map(n => caches.delete(n)));
              }
              if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map(reg => reg.unregister()));
              }
            } catch (e) {
              console.warn("Nettoyage cache/SW a échoué (non bloquant):", e);
            }
            localStorage.clear();
            location.reload(true);
          }
        },
        { text: "Annuler", onClick: () => {}, closeOnClick: true }
      ]
    }).open();
  });

  // Se connecter & Thème (stubs)
  els.loginBtn.addEventListener("click", () => {
    alert("Fonction de connexion à implémenter");
  });
  els.themeBtn.addEventListener("click", () => {
    alert("Changement de thème à implémenter");
  });
}
