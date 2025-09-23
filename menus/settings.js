// menus/settings.js

// ------------------- 🔐 Utilitaires AES-GCM / PBKDF2 -------------------
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

// ------------------- ⚙️ Initialisation du menu Settings -------------------
export function initSettings({ els, state, keys, save, renderMain }) {
  const modal = document.getElementById("settingsModal");
  modal.className = "modal";
  modal.setAttribute("aria-hidden", "true");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-labelledby", "settingsTitle");

  // modal HTML : removed Reload and Theme buttons, kept Export, Import, Codes, Login, Reset
  modal.innerHTML = `
    <div class="modal-content" style="display:flex;flex-direction:column;height:100%;">
      <header class="modal-header">
        <h2 id="settingsTitle">⚙️ Paramètres</h2>
        <button id="closeSettingsBtn" class="close-btn" aria-label="Fermer">✕</button>
      </header>

      <div class="modal-body" id="settingsBody" style="flex:1;display:flex;flex-direction:column;gap:16px;">

        <button id="loginBtn" class="btn">🔐 Se connecter</button>

        <!-- rangée principale de boutons (Export / Import / Codes) -->
        <div id="buttonRow" style="display:flex;flex-wrap:wrap;gap:8px;">
          <button id="exportBtn" class="btn" style="flex:1;min-width:100px;">📤 Exporter</button>
          <button id="importBtn" class="btn" style="flex:1;min-width:100px;">📥 Importer</button>
          <button id="codesBtn" class="btn" style="flex:1;min-width:100px;">💳 Codes</button>
        </div>

        <!-- conteneur où s'affichent Export/Import/Codes -->
        <div id="containerRow" style="display:flex;flex-direction:column;gap:8px;"></div>

        <!-- spacer pour pousser le footer bas -->
        <div style="flex:1;"></div>

        <!-- Reset placé séparément et visuellement distinct -->
        <div style="display:flex;justify-content:center;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.03);">
          <button id="resetBtn" class="btn footer-reset" style="width:220px;">↺ Reset total</button>
        </div>

      </div>
    </div>
  `;

  // ------------------- Références DOM -------------------
  els.closeSettingsBtn = modal.querySelector("#closeSettingsBtn");
  els.resetBtn = modal.querySelector("#resetBtn");
  els.loginBtn = modal.querySelector("#loginBtn");
  els.exportBtn = modal.querySelector("#exportBtn");
  els.importBtn = modal.querySelector("#importBtn");
  els.codesBtn = modal.querySelector("#codesBtn");

  const buttonRow = modal.querySelector("#buttonRow");
  const containerRow = modal.querySelector("#containerRow");

  // ------------------- Création des conteneurs dynamiques -------------------
  // Styled textarea container for export with integrated "copy" on top-left (like Copilot)
  const exportContainer = document.createElement("div");
  exportContainer.style.display = "none";
  exportContainer.innerHTML = `
    <div class="section" style="position:relative;">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div style="font-weight:600">Export chiffré</div>
        <div style="display:flex;gap:8px;">
          <button id="copyExportBtn" class="btn" style="padding:6px 10px;">📋 Copier</button>
          <button id="saveExportBtn" class="btn" style="padding:6px 10px;">💾 Enregistrer</button>
        </div>
      </div>

      <div style="position:relative;margin-top:8px;">
        <div style="position:absolute;left:8px;top:-12px;background:transparent;">
          <!-- decorative integrated copy button area (kept for alignment, real button above) -->
        </div>
        <textarea id="exportText" rows="6" style="width:100%;margin-top:8px;border-radius:8px;padding:12px;resize:vertical;"></textarea>
      </div>
    </div>
  `;

  // Import container: textarea + Import button; no "Tester" button (removed)
  const importContainer = document.createElement("div");
  importContainer.style.display = "none";
  importContainer.innerHTML = `
    <div class="section">
      <div style="font-weight:600">Importer chiffré</div>
      <div style="margin-top:8px;display:flex;gap:8px;align-items:flex-start;">
        <textarea id="importText" rows="6" placeholder="Collez ici ou ouvrez un fichier" style="width:100%;border-radius:8px;padding:12px;resize:vertical;"></textarea>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <button id="applyImportBtn" class="btn" style="white-space:nowrap;">📥 Importer</button>
          <button id="pasteClipboardBtn" class="btn" style="white-space:nowrap;">📋 Coller</button>
        </div>
      </div>
      <div style="margin-top:8px;font-size:13px;opacity:.8">
        Vous pouvez coller une chaîne chiffrée ou importer depuis un fichier après avoir entré le mot de passe.
      </div>
    </div>
  `;

  // Codes container (unchanged / simple)
  const codesContainer = document.createElement("div");
  codesContainer.style.display = "none";
  codesContainer.innerHTML = `
    <input id="codeInput" type="text" placeholder="Entrez le code" style="width:100%;margin-top:8px;border-radius:6px;padding:8px;" />
    <button id="applyCodeBtn" class="btn" style="margin-top:8px;width:100%;">✅ Valider</button>
    <h4 style="margin:8px 0 4px;">Codes utilisés :</h4>
    <ul id="usedCodesList" style="padding-left:20px;margin:0;"></ul>
  `;

  containerRow.append(exportContainer, importContainer, codesContainer);

  // ------------------- Session password handling -------------------
  // Once a password is set for the current open modal session (export or import),
  // it cannot be changed until the modal is closed and reopened.
  let sessionPassword = null; // null => not set yet

  // ------------------- Open / Close helpers -------------------
  function openSettings() {
    sessionPassword = null; // reset session password only when opening anew
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeSettings() {
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    // Reset displays
    buttonRow.style.display = "flex";
    exportContainer.style.display = "none";
    importContainer.style.display = "none";
    codesContainer.style.display = "none";
    // Clear sensitive values from memory
    sessionPassword = null;
  }

  // ------------------- Reset total -------------------
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

  // ------------------- Événements principaux -------------------
  els.settingsBtn.addEventListener("click", openSettings);
  els.closeSettingsBtn.addEventListener("click", closeSettings);
  modal.addEventListener("click", e => { if (e.target === modal) closeSettings(); });

  els.loginBtn.addEventListener("click", () => {
    console.log("🔐 Fonction de connexion à implémenter");
  });

  els.resetBtn.addEventListener("click", performFullReset);

  // ------------------- Export chiffré -------------------
  els.exportBtn.addEventListener("click", async () => {
    // Ask for password only once per session
    if (!sessionPassword) {
      const pwd = prompt("🔑 Mot de passe pour chiffrer l'export :");
      if (!pwd) return;
      sessionPassword = pwd;
    } else {
      // inform user password already in session
      console.log("ℹ️ Utilisation du mot de passe de session existant pour l'export");
    }

    buttonRow.style.display = "none";
    importContainer.style.display = "none";
    codesContainer.style.display = "none";

    try {
      const dataStr = JSON.stringify(state);
      const encrypted = await encryptData(dataStr, sessionPassword);
      const ta = exportContainer.querySelector("#exportText");
      ta.value = encrypted;
      exportContainer.style.display = "flex";

      // Copy button
      const copyBtn = exportContainer.querySelector("#copyExportBtn");
      copyBtn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(ta.value);
          copyBtn.textContent = "✅ Copié";
          setTimeout(() => { copyBtn.textContent = "📋 Copier"; }, 1200);
        } catch (err) {
          console.error("Impossible de copier", err);
          alert("La copie dans le presse-papier a échoué.");
        }
      };

      // Save button: filename <date>_<time>-clicker-export.txt
      const saveBtn = exportContainer.querySelector("#saveExportBtn");
      saveBtn.onclick = () => {
        const now = new Date();
        const date = now.toISOString().slice(0,10); // YYYY-MM-DD
        const time = now.toTimeString().slice(0,8).replace(/:/g, "-"); // HH-MM-SS
        const filename = `${date}_${time}-clicker-export.txt`;
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

  // ------------------- Import chiffré -------------------
  els.importBtn.addEventListener("click", () => {
    // Ask for password only once per session
    if (!sessionPassword) {
      const pwd = prompt("🔑 Mot de passe pour déchiffrer l'import :");
      if (!pwd) return;
      sessionPassword = pwd;
    } else {
      console.log("ℹ️ Utilisation du mot de passe de session existant pour l'import");
    }

    buttonRow.style.display = "none";
    exportContainer.style.display = "none";
    codesContainer.style.display = "none";

    const ta = importContainer.querySelector("#importText");
    const applyBtn = importContainer.querySelector("#applyImportBtn");
    const pasteBtn = importContainer.querySelector("#pasteClipboardBtn");

    // Paste from clipboard helper
    pasteBtn.onclick = async () => {
      try {
        const text = await navigator.clipboard.readText();
        ta.value = text;
      } catch (err) {
        console.error("Impossible de lire le presse-papiers", err);
        alert("Impossible d'accéder au presse-papiers.");
      }
    };

    importContainer.style.display = "flex";

    // Apply import: decrypt then apply
    applyBtn.onclick = async () => {
      const raw = ta.value.trim();
      if (!raw) return alert("Collez ou chargez une chaîne chiffrée avant d'importer.");
      try {
        const decrypted = await decryptData(raw, sessionPassword);
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
        alert("✅ Import réussi !");
        closeSettings();
      } catch (err) {
        console.error("❌ Déchiffrement/parse impossible", err);
        alert("Mot de passe incorrect ou texte invalide.");
      }
    };
  });

  // ------------------- Codes -------------------
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

  // ------------------- Refs pour conteneurs ajoutés (attacher boutons après création) -------------------
  // attach export/import containers to DOM for event wiring (they were appended earlier to containerRow)
  // nothing more needed here because we query them when used

  // ------------------- Gestion clavier (ESC) -------------------
  function onKeydown(e) {
    if (e.key === "Escape" && modal.getAttribute("aria-hidden") === "false") {
      closeSettings();
    }
  }
  document.removeEventListener("keydown", onKeydown);
  document.addEventListener("keydown", onKeydown);
}
