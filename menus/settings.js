// menus/settings.js

// ─── 🔐 Utilitaires AES-GCM / PBKDF2 ───
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

// ─── ⚙️ Initialisation du menu Settings ───
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
        <button id="loginBtn" class="btn">🔑 Se connecter</button>
        <div id="buttonRow" style="display:flex;flex-wrap:wrap;gap:8px;">
          <button id="exportBtn" class="btn" style="flex:1;min-width:100px;">📤 Exporter</button>
          <button id="importBtn" class="btn" style="flex:1;min-width:100px;">📥 Importer</button>
          <button id="reloadBtn" class="btn" style="flex:1;min-width:100px;">🔄 Recharger</button>
          <button id="themeBtn" class="btn" style="flex:1;min-width:100px;">🌗 Thème</button>
          <button id="codesBtn" class="btn" style="flex:1;min-width:100px;">💳 Codes</button>
        </div>
        <div id="containerRow" style="display:flex;flex-direction:column;gap:8px;"></div>
        <div style="flex:1;"></div>
        <div style="display:flex;justify-content:center;">
          <button id="resetBtn" class="btn footer-reset">↺ Reset total</button>
        </div>
      </div>
    </div>
  `;

  // 🔗 Références DOM
  els.closeSettingsBtn = modal.querySelector("#closeSettingsBtn");
  els.resetBtn = modal.querySelector("#resetBtn");
  els.loginBtn = modal.querySelector("#loginBtn");
  els.exportBtn = modal.querySelector("#exportBtn");
  els.importBtn = modal.querySelector("#importBtn");
  els.reloadBtn = modal.querySelector("#reloadBtn");
  els.themeBtn = modal.querySelector("#themeBtn");
  els.codesBtn = modal.querySelector("#codesBtn");

  const buttonRow = modal.querySelector("#buttonRow");
  const containerRow = modal.querySelector("#containerRow");

  // 📦 Conteneurs dynamiques
  const exportContainer = document.createElement("div");
  exportContainer.style.display = "none";
  exportContainer.innerHTML = `
    <form id="exportForm" style="display:flex;flex-direction:column;gap:8px;">
      <label for="exportPassword">Mot de passe :</label>
      <input id="exportPassword" type="password" placeholder="Mot de passe" required style="width:100%;" />
      <label for="exportText">Données exportées :</label>
      <textarea id="exportText" rows="5" style="width:100%;" readonly></textarea>
      <button type="submit" class="btn">💾 Générer</button>
      <button type="button" id="saveExportBtn" class="btn">📂 Enregistrer</button>
    </form>
  `;

  const importContainer = document.createElement("div");
  importContainer.style.display = "none";
  importContainer.innerHTML = `
    <form id="importForm" style="display:flex;flex-direction:column;gap:8px;">
      <label for="importPassword">Mot de passe :</label>
      <input id="importPassword" type="password" placeholder="Mot de passe" required style="width:100%;" />
      <label for="importText">Coller les données chiffrées :</label>
      <textarea id="importText" rows="5" style="width:100%;" required></textarea>
      <button type="submit" class="btn">📥 Importer</button>
    </form>
  `;

  const codesContainer = document.createElement("div");
  codesContainer.style.display = "none";
  codesContainer.innerHTML = `
    <input id="codeInput" type="text" placeholder="Entrez le code" style="width:100%;margin-top:8px;"/>
    <button id="applyCodeBtn" class="btn" style="margin-top:8px;width:100%;">✅ Valider</button>
    <h4 style="margin:8px 0 4px;">Codes utilisés :</h4>
    <ul id="usedCodesList" style="padding-left:20px;margin:0;"></ul>
  `;

  containerRow.append(exportContainer, importContainer, codesContainer);

  // 🛠 Ouvrir / Fermer modal
  function openSettings() {
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }
  function closeSettings() {
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    buttonRow.style.display = "flex";
    exportContainer.style.display = "none";
    importContainer.style.display = "none";
    codesContainer.style.display = "none";
  }

  // 🔄 Reset total
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

  // 🎯 Événements globaux
  els.settingsBtn.addEventListener("click", openSettings);
  els.closeSettingsBtn.addEventListener("click", closeSettings);
  modal.addEventListener("click", e => { if (e.target === modal) closeSettings(); });
  els.loginBtn.addEventListener("click", () => console.log("🔐 Fonction de connexion à implémenter"));
  els.resetBtn.addEventListener("click", performFullReset);

  // 📤 Export chiffré
  const exportForm = exportContainer.querySelector("#exportForm");
  const exportPasswordInput = exportContainer.querySelector("#exportPassword");
  const exportText = exportContainer.querySelector("#exportText");
  const saveExportBtn = exportContainer.querySelector("#saveExportBtn");

  exportForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const password = exportPasswordInput.value.trim();
    if (!password) return;

    try {
      const dataStr = JSON.stringify(state);
      const encrypted = await encryptData(dataStr, password);
      exportText.value = encrypted;
    } catch (err) {
      console.error("❌ Erreur export", err);
      alert("Erreur lors de l’export chiffré.");
    }
  });
  saveExportBtn.addEventListener("click", () => {
    if (!exportText.value) {
      alert("Aucune donnée exportée à enregistrer.");
      return;
    }
    const blob = new Blob([exportText.value], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clicker-export.txt";
    a.click();
    URL.revokeObjectURL(url);
  });
  const importForm = importContainer.querySelector("#importForm");
  const importPasswordInput = importContainer.querySelector("#importPassword");
  const importText = importContainer.querySelector("#importText");

  importForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const password = importPasswordInput.value.trim();
    const encrypted = importText.value.trim();
    if (!password || !encrypted) return;

    try {
      const decrypted = await decryptData(encrypted, password);
      const importedState = JSON.parse(decrypted);
      Object.assign(state, importedState);
      save();
      renderMain();
      alert("✅ Import réussi !");
    } catch (err) {
      console.error("❌ Erreur import", err);
      alert("Mot de passe incorrect ou données invalides.");
    }
  });
  const codeInput = codesContainer.querySelector("#codeInput");
  const applyCodeBtn = codesContainer.querySelector("#applyCodeBtn");
  const usedCodesList = codesContainer.querySelector("#usedCodesList");

  applyCodeBtn.addEventListener("click", () => {
    const code = codeInput.value.trim();
    if (!code) return;
    if (state.usedCodes && state.usedCodes.includes(code)) {
      alert("Code déjà utilisé !");
      return;
    }
    // Exemple : un code spécial
    if (code === "BONUS100") {
      state.points += 100;
      alert("🎉 Code appliqué : +100 points !");
    } else {
      alert("Code invalide.");
      return;
    }
    if (!state.usedCodes) state.usedCodes = [];
    state.usedCodes.push(code);
    save();
    renderMain();
    const li = document.createElement("li");
    li.textContent = code;
    usedCodesList.appendChild(li);
    codeInput.value = "";
  });
  function showContainer(container) {
    buttonRow.style.display = "none";
    exportContainer.style.display = "none";
    importContainer.style.display = "none";
    codesContainer.style.display = "none";
    container.style.display = "block";
  }

  els.exportBtn.addEventListener("click", () => showContainer(exportContainer));
  els.importBtn.addEventListener("click", () => showContainer(importContainer));
  els.codesBtn.addEventListener("click", () => showContainer(codesContainer));
  els.reloadBtn.addEventListener("click", () => location.reload());
  els.themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
  });
}
