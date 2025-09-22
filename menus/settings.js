// menus/settings.js

// 🔒 Utilitaires AES-GCM / PBKDF2
const enc = new TextEncoder();
const dec = new TextDecoder();

async function deriveKey(password, salt) {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptData(plainText, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plainText)
  );
  const combined = new Uint8Array(
    salt.byteLength + iv.byteLength + cipherBuffer.byteLength
  );
  combined.set(salt, 0);
  combined.set(iv, salt.byteLength);
  combined.set(new Uint8Array(cipherBuffer), salt.byteLength + iv.byteLength);
  return btoa(String.fromCharCode(...combined));
}

async function decryptData(b64Combined, password) {
  const combined = Uint8Array.from(atob(b64Combined), c => c.charCodeAt(0));
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const data = combined.slice(28);
  const key = await deriveKey(password, salt);
  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  return dec.decode(plainBuffer);
}

// 🛠 Création de modal
function createModal({ title, content, buttons }) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.setAttribute("role", "dialog");

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <header class="modal-header">
      <h2>${title}</h2>
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

  modal.appendChild(footer);
  overlay.appendChild(modal);
  return { open: () => document.body.appendChild(overlay) };
}

// ⚙️ Initialisation du menu Settings
export function initSettings({ els, state, keys, save, renderMain }) {
  const modal = document.getElementById("settingsModal");
  modal.className = "modal";
  modal.setAttribute("aria-hidden", "true");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-labelledby", "settingsTitle");
  modal.innerHTML = `
    <div class="modal-content" style="display:flex;flex-direction:column;height:100%;">
      <header class="modal-header">
        <h2 id="settingsTitle">⚙️ Paramètres</h2>
        <button id="closeSettingsBtn" class="close-btn" aria-label="Fermer">✕</button>
      </header>
      <div id="settingsBody" class="modal-body" style="flex:1;display:flex;flex-direction:column;gap:16px;">
        
        <!-- Ligne Export / Import -->
        <div id="rowEI" style="display:flex;gap:8px;">
          <button id="exportBtn" class="btn" style="flex:1;">📤 Exporter</button>
          <button id="importBtn" class="btn" style="flex:1;">📥 Importer</button>
        </div>

        <!-- Liste des autres actions -->
        <ul id="otherSettingsList" style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;">
          <li><button id="reloadBtn" class="btn">🔄 Recharger</button></li>
          <li><button id="themeBtn" class="btn">🎨 Thème</button></li>
          <li><button id="codesBtn" class="btn">💳 Codes</button></li>
        </ul>

        <div style="flex:1;"></div>
        <div style="display:flex;justify-content:center;">
          <button id="resetBtn" class="btn footer-reset">↺ Reset total</button>
        </div>
      </div>
    </div>
  `;

  // Références DOM
  els.closeSettingsBtn = modal.querySelector("#closeSettingsBtn");
  els.resetBtn         = modal.querySelector("#resetBtn");
  els.exportBtn        = modal.querySelector("#exportBtn");
  els.importBtn        = modal.querySelector("#importBtn");
  els.reloadBtn        = modal.querySelector("#reloadBtn");
  els.themeBtn         = modal.querySelector("#themeBtn");
  els.codesBtn         = modal.querySelector("#codesBtn");

  function openSettings() {
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }
  function closeSettings() {
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  function performFullReset() {
    if (!confirm("⚠️ Réinitialiser TOUT le stockage local ?")) return;
    localStorage.clear();
    keys.forEach(k => state[k] = 0);
    state.pointsPerClick     = 1;
    state.shopBoost          = 1;
    state.tempShopBoostFactor= 1;
    state.tempShopBoostExpiresAt = 0;
    state.rebirths           = 0;
    save();
    renderMain();
    closeSettings();
  }

  els.settingsBtn.addEventListener("click", openSettings);
  els.closeSettingsBtn.addEventListener("click", closeSettings);
  modal.addEventListener("click", e => { if (e.target === modal) closeSettings(); });
  els.resetBtn.addEventListener("click", performFullReset);

  // Export chiffré
  els.exportBtn.addEventListener("click", async () => {
    const pwd = prompt("🔒 Mot de passe pour chiffrer l’export :");
    if (!pwd) return;
    try {
      const dataStr   = JSON.stringify(state, null, 2);
      const encrypted = await encryptData(dataStr, pwd);
      createModal({
        title: "Export chiffré",
        content: `<textarea rows="10" style="width:100%;" readonly>${encrypted}</textarea>`,
        buttons: [
          {
            text: "💾 Enregistrer",
            onClick: () => {
              const blob = new Blob([encrypted], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = "clicker-state.txt"; a.click();
              URL.revokeObjectURL(url);
            }
          },
          { text: "Fermer", onClick: () => {}, closeOnClick: true }
        ]
      }).open();
    } catch {
      alert("Erreur lors de l’export chiffré.");
    }
  });

  // Import chiffré
  els.importBtn.addEventListener("click", () => {
    const pwd = prompt("🔒 Mot de passe pour déchiffrer l’import :");
    if (!pwd) return;
    createModal({
      title: "Import chiffré",
      content: `<textarea id="importData" rows="10" style="width:100%;" placeholder="Collez le texte chiffré"></textarea>`,
      buttons: [
        {
          text: "Importer",
          onClick: async () => {
            try {
              const encrypted = document.getElementById("importData").value.trim();
              const decrypted = await decryptData(encrypted, pwd);
              const imported  = JSON.parse(decrypted);
              keys.forEach(k => { if (imported[k] != null) state[k] = imported[k]; });
              state.pointsPerClick      = imported.pointsPerClick      ?? 1;
              state.shopBoost           = imported.shopBoost           ?? 1;
              state.tempShopBoostFactor = imported.tempShopBoostFactor ?? 1;
              state.tempShopBoostExpiresAt = imported.tempShopBoostExpiresAt ?? 0;
              state.rebirths            = imported.rebirths            ?? 0;
              save();
              renderMain();
              closeSettings();
              alert("✅ Import réussi !");
            } catch {
              alert("Mot de passe incorrect ou texte invalide.");
            }
          }
        },
        { text: "Annuler", onClick: () => {}, closeOnClick: true }
      ]
    }).open();
  });

  // Reload
  els.reloadBtn.addEventListener("click", () => {
    createModal({
      title: "Recharger les ressources",
      content: `<p>Voulez-vous vraiment recharger la page ?</p>`,
      buttons: [
        { text: "Recharger", onClick: () => window.location.reload() },
        { text: "Annuler", onClick: () => {}, closeOnClick: true }
      ]
    }).open();
  });

  // Thème
  els.themeBtn.addEventListener("click", () => {
    createModal({
      title: "Choisir un thème",
      content: `
        <button id="lightBtn">Clair</button>
        <button id="darkBtn">Sombre</button>
        <button id="systemBtn">Système</button>
      `,
      buttons: [{ text: "OK", onClick: () => {} }]
    }).open();
  });

  // Codes
  els.codesBtn.addEventListener("click", () => {
    const validCodes = ["FREE"];
    function refreshList(ul) {
      const used = JSON.parse(localStorage.getItem("usedCodes") || "[]");
      ul.innerHTML = "";
      used.forEach(c => {
        const li = document.createElement("li");
        li.textContent = c;
        ul.appendChild(li);
      });
    }
    createModal({
      title: "Codes promotionnels",
      content: `
        <input id="codeInput" style="width:100%;" placeholder="Entrez le code" />
        <h4>Codes utilisés :</h4>
        <ul id="usedCodesList" style="padding-left:20px;"></ul>
      `,
      buttons: [
        {
          text: "Valider",
          onClick: () => {
            const inp = document.getElementById("codeInput");
            const code = inp.value.trim().toUpperCase();
            let used = JSON.parse(localStorage.getItem("usedCodes") || "[]");
            if (!code) return;
            if (used.includes(code)) {
              alert("Ce code a déjà été utilisé.");
            } else if (validCodes.includes(code)) {
              used.push(code);
              localStorage.setItem("usedCodes", JSON.stringify(used));
              alert("🎉 Code appliqué !");
            } else {
              alert("❌ Code invalide.");
            }
            refreshList(document.getElementById("usedCodesList"));
            inp.value = "";
          }
        },
        { text: "Fermer", onClick: () => {}, closeOnClick: true }
      ]
    }).open();
  });
}
