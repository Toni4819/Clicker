// menus/settings.js
// 🔐 Utilitaires AES-GCM / PBKDF2
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
  const cipherBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plainText));
  const combined = new Uint8Array(salt.byteLength + iv.byteLength + cipherBuffer.byteLength);
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
  const plainBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return dec.decode(plainBuffer);
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

    <div class="modal-body" id="settingsBody" style="flex:1;display:flex;flex-direction:column;gap:16px;">
      <button id="loginBtn" class="btn">🔐 Se connecter</button>

      <!-- rangée principale de boutons -->
      <div id="buttonRow" style="display:flex;flex-wrap:wrap;gap:8px;">
        <button id="exportBtn" class="btn" style="flex:1;min-width:100px;">📤 Exporter</button>
        <button id="importBtn" class="btn" style="flex:1;min-width:100px;">📥 Importer</button>
        <button id="codesBtn" class="btn" style="flex:1;min-width:100px;">💳 Codes</button>
      </div>

      <!-- conteneur où s’affichent Export/Import/Codes -->
      <div id="containerRow" style="display:flex;flex-direction:column;gap:8px;"></div>

      <div style="flex:1;"></div>

      <div style="display:flex;justify-content:center;">
        <button id="resetBtn" class="btn footer-reset">↺ Reset total</button>
      </div>
    </div>
  </div>
  `;

  // Références DOM
  els.closeSettingsBtn = modal.querySelector("#closeSettingsBtn");
  els.resetBtn = modal.querySelector("#resetBtn");
  els.loginBtn = modal.querySelector("#loginBtn");
  els.exportBtn = modal.querySelector("#exportBtn");
  els.importBtn = modal.querySelector("#importBtn");
  els.codesBtn = modal.querySelector("#codesBtn");

  const buttonRow = modal.querySelector("#buttonRow");
  const containerRow = modal.querySelector("#containerRow");

  // Création des conteneurs dynamiques (cachés)
  const exportContainer = document.createElement("div");
  exportContainer.style.display = "none";
  exportContainer.innerHTML = `
    <div style="position:relative;border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:8px;background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.00));">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <strong>Export chiffré</strong>
        <div style="display:flex;gap:8px;">
          <button id="copyExportBtn" class="btn" style="font-size:12px;padding:6px;">📋 Copier tout</button>
          <button id="saveExportBtn" class="btn" style="font-size:12px;padding:6px;">💾 Enregistrer</button>
        </div>
      </div>
      <textarea id="exportText" rows="8" style="width:100%;resize:vertical;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,monospace;background:#071018;color:#dfeaf2;border-radius:6px;padding:8px;border:1px solid rgba(255,255,255,0.04);"></textarea>
    </div>
  `;

  const importContainer = document.createElement("div");
  importContainer.style.display = "none";
  importContainer.innerHTML = `
    <div style="border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:8px;background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.00));">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <strong>Importer chiffré</strong>
        <div style="display:flex;gap:8px;">
          <button id="pasteClipboardBtn" class="btn" style="font-size:12px;padding:6px;">📥 Coller</button>
          <button id="doImportBtn" class="btn" style="font-size:12px;padding:6px;">📦 Importer</button>
        </div>
      </div>
      <textarea id="importText" rows="8" style="width:100%;resize:vertical;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,monospace;background:#071018;color:#dfeaf2;border-radius:6px;padding:8px;border:1px solid rgba(255,255,255,0.04);" placeholder="Collez ici le texte chiffré ou utilisez Coller depuis le presse-papier"></textarea>
      <p style="font-size:12px;margin:6px 0 0;color:rgba(255,255,255,0.6)">Le mot de passe est fixé pour cette session de paramètres. Fermez et rouvrez les paramètres pour changer le mot de passe.</p>
    </div>
  `;

  const codesContainer = document.createElement("div");
  codesContainer.style.display = "none";
  codesContainer.innerHTML = `
    <input id="codeInput" type="text" placeholder="Entrez le code" style="width:100%;margin-top:8px;padding:8px;border-radius:6px;border:1px solid rgba(255,255,255,0.04)"/>
    <button id="applyCodeBtn" class="btn" style="margin-top:8px;width:100%;">✅ Valider</button>
    <h4 style="margin:8px 0 4px;">Codes utilisés :</h4>
    <ul id="usedCodesList" style="padding-left:20px;margin:0;"></ul>
  `;

  containerRow.append(exportContainer, importContainer, codesContainer);

  // Ouvrir / Fermer le modal
  function openSettings() {
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    // reset session password when opening new session
    sessionPassword = undefined;
  }
  function closeSettings() {
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    // réinitialise l’affichage
    buttonRow.style.display = "flex";
    exportContainer.style.display = "none";
    importContainer.style.display = "none";
    codesContainer.style.display = "none";
    // clear sensitive in-memory password
    sessionPassword = undefined;
  }

  // Reset total
  function performFullReset() {
    if (!confirm("⚠️ Réinitialiser TOUT le stockage local ?")) return;
    localStorage.clear();
    for (const k of keys) state[k] = 0;
    state.pointsPerClick = 1;
    state.shopBoost = 1;
    state.tempShopBoostFactor = 1;
    state.tempShopBoostExpiresAt = 0;
    state.rebirths = 0;
    save();
    renderMain();
    closeSettings();
  }

  // Événements globaux
  els.settingsBtn.addEventListener("click", openSettings);
  els.closeSettingsBtn.addEventListener("click", closeSettings);
  modal.addEventListener("click", e => { if (e.target === modal) closeSettings(); });
  els.loginBtn.addEventListener("click", () => { console.log("🔐 Fonction de connexion à implémenter"); });
  els.resetBtn.addEventListener("click", performFullReset);

  // --- Gestion session mot de passe
  // Le mot de passe saisi est conservé tant que le modal reste ouvert.
  // Impossible de le changer sans fermer puis rouvrir le modal.
  let sessionPassword = undefined;

  // --- Export chiffré
  els.exportBtn.addEventListener("click", async () => {
    // prompt for password only once per modal session
    if (!sessionPassword) {
      const p = prompt("🔐 Mot de passe pour chiffrer l'export :");
      if (!p) return;
      sessionPassword = p;
    }

    buttonRow.style.display = "none";
    importContainer.style.display = "none";
    codesContainer.style.display = "none";

    try {
      const dataStr = JSON.stringify(state);
      const encrypted = await encryptData(dataStr, sessionPassword);
      const ta = exportContainer.querySelector("#exportText");
      const copyBtn = exportContainer.querySelector("#copyExportBtn");
      const saveBtn = exportContainer.querySelector("#saveExportBtn");

      ta.value = encrypted;
      exportContainer.style.display = "block";

      // Copier dans le presse-papier
      copyBtn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(ta.value);
          copyBtn.textContent = "✅ Copié";
          setTimeout(() => (copyBtn.textContent = "📋 Copier tout"), 1200);
        } catch (err) {
          console.error("Impossible de copier", err);
          alert("Copie échouée. Autorisez l'accès au presse-papier ou copiez manuellement.");
        }
      };

      // Enregistrer : nom avec date_heure-clicker-export.txt
      saveBtn.onclick = () => {
        const now = new Date();
        const yyyy = now.toISOString().slice(0, 10);
        const hh = now.toTimeString().slice(0, 8).replace(/:/g, "");
        const filename = `${yyyy}_${hh}-clicker-export.txt`;
        const blob = new Blob([ta.value], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      };
    } catch (err) {
      console.error("❌ Chiffrement impossible", err);
      alert("Erreur lors de l'export chiffré.");
      closeSettings();
    }
  });

  // --- Import chiffré
  els.importBtn.addEventListener("click", () => {
    // prompt for password only once per modal session
    if (!sessionPassword) {
      const p = prompt("🔐 Mot de passe pour déchiffrer l'import :");
      if (!p) return;
      sessionPassword = p;
    }

    buttonRow.style.display = "none";
    exportContainer.style.display = "none";
    codesContainer.style.display = "none";

    const applyBtn = importContainer.querySelector("#doImportBtn");
    const ta = importContainer.querySelector("#importText");
    const pasteBtn = importContainer.querySelector("#pasteClipboardBtn");

    importContainer.style.display = "block";

    pasteBtn.onclick = async () => {
      try {
        const text = await navigator.clipboard.readText();
        ta.value = text;
        pasteBtn.textContent = "✅ Collé";
        setTimeout(() => (pasteBtn.textContent = "📥 Coller"), 900);
      } catch (err) {
        console.error("Impossible de coller depuis le presse-papier", err);
        alert("Collage depuis le presse-papier impossible. Collez manuellement.");
      }
    };

    applyBtn.onclick = async () => {
      try {
        const decrypted = await decryptData(ta.value.trim(), sessionPassword);
        const imported = JSON.parse(decrypted);
        for (const k of keys) {
          if (imported[k] != null) state[k] = imported[k];
        }
        state.pointsPerClick = imported.pointsPerClick ?? 1;
        state.shopBoost = imported.shopBoost ?? 1;
        state.tempShopBoostFactor = imported.tempShopBoostFactor ?? 1;
        state.tempShopBoostExpiresAt = imported.tempShopBoostExpiresAt ?? 0;
        state.rebirths = imported.rebirths ?? 0;
        save();
        renderMain();
        closeSettings();
        alert("✅ Import réussi !");
      } catch (err) {
        console.error("❌ Déchiffrement/parse impossible", err);
        alert("Mot de passe incorrect ou texte invalide.");
      }
    };
  });

  // --- Gestion des codes (inchangé logiquement, affichage séparé)
  const validCodes = ["FREE"];
  function updateUsedCodesList() {
    const used = JSON.parse(localStorage.getItem("usedCodes") || "[]");
    const ul = codesContainer.querySelector("#usedCodesList");
    ul.innerHTML = "";
    used.forEach(code => {
      const li = document.createElement("li");
      li.textContent = code;
      ul.appendChild(li);
    });
  }

  els.codesBtn.addEventListener("click", () => {
    buttonRow.style.display = "none";
    exportContainer.style.display = "none";
    importContainer.style.display = "none";
    updateUsedCodesList();
    codesContainer.style.display = "flex";
    const applyBtn = codesContainer.querySelector("#applyCodeBtn");
    const inp = codesContainer.querySelector("#codeInput");
    applyBtn.onclick = () => {
      const code = inp.value.trim().toUpperCase();
      if (!code) return;
      let used = JSON.parse(localStorage.getItem("usedCodes") || "[]");
      if (used.includes(code)) {
        alert("Ce code a déjà été utilisé.");
      } else if (validCodes.includes(code)) {
        used.push(code);
        localStorage.setItem("usedCodes", JSON.stringify(used));
        alert("🎉 Code appliqué !");
        updateUsedCodesList();
      } else {
        alert("❌ Code invalide.");
      }
      inp.value = "";
    };
  });
}
