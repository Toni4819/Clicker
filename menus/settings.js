// menus/settings.js

// ─── Chiffrement AES-GCM / PBKDF2 ───
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
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plainText)
  );
  const combined = new Uint8Array(salt.length + iv.length + cipher.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(cipher), salt.length + iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptData(b64, password) {
  const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  const salt = raw.slice(0, 16);
  const iv = raw.slice(16, 28);
  const data = raw.slice(28);
  const key = await deriveKey(password, salt);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return dec.decode(plain);
}

// ─── Initialisation du menu Settings ───
export function initSettings({ els, state, keys, save, renderMain }) {
  console.log("🚀 initSettings lancé", { hasEls: !!els, hasState: !!state });

  // Récupération/modification du modal principal
  const modal = document.getElementById("settingsModal");
  if (!modal) {
    console.error("❌ settingsModal introuvable dans le DOM");
    return;
  }

  modal.className = "modal";
  modal.setAttribute("aria-hidden", "true");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-labelledby", "settingsTitle");

  modal.innerHTML = `
    <div class="modal-content">
      <header class="modal-header">
        <h2 id="settingsTitle">⚙️ Paramètres</h2>
        <button id="closeSettingsBtn" class="close-btn" aria-label="Fermer">✕</button>
      </header>
      <div class="modal-body" style="display:flex;flex-direction:column;gap:16px;">
        <button id="loginBtn" class="btn">🔑 Se connecter</button>
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          <button id="exportBtn" class="btn">📤 Exporter</button>
          <button id="importBtn" class="btn">📥 Importer</button>
          <button id="reloadBtn" class="btn">🔄 Recharger</button>
          <button id="themeBtn" class="btn">🌗 Thème</button>
          <button id="codesBtn" class="btn">💳 Codes</button>
        </div>
        <button id="resetBtn" class="btn footer-reset">↺ Reset total</button>
      </div>
    </div>
  `;

  // Références boutons internes au modal
  els.closeSettingsBtn = modal.querySelector("#closeSettingsBtn");
  els.loginBtn         = modal.querySelector("#loginBtn");
  els.exportBtn        = modal.querySelector("#exportBtn");
  els.importBtn        = modal.querySelector("#importBtn");
  els.reloadBtn        = modal.querySelector("#reloadBtn");
  els.themeBtn         = modal.querySelector("#themeBtn");
  els.codesBtn         = modal.querySelector("#codesBtn");
  els.resetBtn         = modal.querySelector("#resetBtn");

  // Branchement fermeture modal principale
  els.closeSettingsBtn?.addEventListener("click", () => {
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  });
  modal.addEventListener("click", e => {
    if (e.target === modal) {
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
    }
  });

  // Branchement du bouton paramètres (si présent dans els)
  if (els.settingsBtn) {
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
    }

  // ─── Modal secondaire (injection attendue dans index.html: #modalSecond) ───
  const second = els.modalSecond || document.getElementById("modalSecond");
  if (!second) {
    return;
  }

  second.className = "modal-second";
  second.setAttribute("aria-hidden", "true");
  second.setAttribute("role", "dialog");
  second.innerHTML = `
    <div class="modal-second-content">
      <button id="closeSecondBtn" class="close-btn" aria-label="Fermer">✕</button>
      <div id="modalSecondBody"></div>
    </div>
  `;

  const modalSecondBody = second.querySelector("#modalSecondBody");
  const closeSecondBtn = second.querySelector("#closeSecondBtn");

  function openSecond(content) {
    modalSecondBody.innerHTML = "";
    modalSecondBody.appendChild(content);
    second.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeSecond() {
    second.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  closeSecondBtn.addEventListener("click", closeSecond);
  second.addEventListener("click", e => {
    if (e.target === second) closeSecond();
  });

  // ─── Conteneurs dynamiques (export / import / codes) ───
  const exportContainer = document.createElement("div");
  exportContainer.innerHTML = `
    <form id="exportForm" style="display:flex;flex-direction:column;gap:8px;">
      <input id="exportPassword" type="password" placeholder="Mot de passe" required />
      <textarea id="exportText" rows="5" readonly></textarea>
      <div style="display:flex;gap:8px;">
        <button type="submit" class="btn">💾 Générer</button>
        <button type="button" id="saveExportBtn" class="btn">📂 Enregistrer</button>
      </div>
    </form>
  `;

  const importContainer = document.createElement("div");
  importContainer.innerHTML = `
    <form id="importForm" style="display:flex;flex-direction:column;gap:8px;">
      <input id="importPassword" type="password" placeholder="Mot de passe" required />
      <textarea id="importText" rows="5" required></textarea>
      <button type="submit" class="btn">📥 Importer</button>
    </form>
  `;

  const codesContainer = document.createElement("div");
  codesContainer.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:8px;">
      <input id="codeInput" type="text" placeholder="Entrez le code" />
      <button id="applyCodeBtn" class="btn">✅ Valider</button>
      <ul id="usedCodesList" style="margin-top:8px;"></ul>
    </div>
  `;

  // ─── Export logic ───
  const exportForm = exportContainer.querySelector("#exportForm");
  const exportPasswordInput = exportContainer.querySelector("#exportPassword");
  const exportText = exportContainer.querySelector("#exportText");
  const saveExportBtn = exportContainer.querySelector("#saveExportBtn");

  exportForm.addEventListener("submit", async e => {
    e.preventDefault();
    const pwd = exportPasswordInput.value.trim();
    if (!pwd) {
      alert("Entrez un mot de passe");
      return;
    }
    try {
      const data = JSON.stringify(state);
      const encrypted = await encryptData(data, pwd);
      exportText.value = encrypted;
      console.log("🔐 Export généré");
    } catch (err) {
      console.error("Erreur lors de l'export :", err);
      alert("Erreur export");
    }
  });

  saveExportBtn.addEventListener("click", () => {
    if (!exportText.value) return;
    const blob = new Blob([exportText.value], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "clicker-export.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  // ─── Import logic ───
  const importForm = importContainer.querySelector("#importForm");
  const importPasswordInput = importContainer.querySelector("#importPassword");
  const importText = importContainer.querySelector("#importText");

importForm.addEventListener("submit", async e => {
  e.preventDefault();
  const pwd = importPasswordInput.value.trim();
  const encrypted = importText.value.trim();

  if (!pwd || !encrypted) {
    alert("Compléter les champs");
    return;
  }

  try {
    const decrypted = await decryptData(encrypted, pwd);
    const imported = JSON.parse(decrypted);
    Object.assign(state, imported);
    save();
    renderMain();
    alert("✅ Import réussi !");
    closeSecond();
  } catch (err) {
    console.error("Erreur d'import :", err);
    alert("Mot de passe incorrect ou données invalides.");
  }
});


  // ─── Codes logic ───
  const codeInput = codesContainer.querySelector("#codeInput");
  const applyCodeBtn = codesContainer.querySelector("#applyCodeBtn");
  const usedCodesList = codesContainer.querySelector("#usedCodesList");

  applyCodeBtn.addEventListener("click", () => {
    const code = codeInput.value.trim();
    if (!code) return;
    if (state.usedCodes?.includes(code)) {
      alert("Code déjà utilisé !");
      return;
    }
    if (code === "BONUS100") {
      state.points = (state.points || 0) + 100;
      alert("🎉 +100 points !");
    } else {
      alert("Code invalide.");
      return;
    }
    state.usedCodes = [...(state.usedCodes || []), code];
    save();
    renderMain();
    const li = document.createElement("li");
    li.textContent = code;
    usedCodesList.appendChild(li);
  });

  // ─── Brancher les boutons secondaires sur la modalSecond ───
  els.exportBtn?.addEventListener("click", () => openSecond(exportContainer));
  els.importBtn?.addEventListener("click", () => openSecond(importContainer));
  els.codesBtn?.addEventListener("click", () => openSecond(codesContainer));
  els.reloadBtn?.addEventListener("click", () => location.reload());
  els.themeBtn?.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
  });

  els.resetBtn?.addEventListener("click", () => {
    if (!confirm("⚠️ Réinitialiser TOUT le stockage ?")) return;
    localStorage.clear();
    for (const k of keys) state[k] = 0;
    save();
    renderMain();
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  });

  // Remplir la liste usedCodes si déjà présent
  if (Array.isArray(state.usedCodes) && state.usedCodes.length) {
    for (const code of state.usedCodes) {
      const li = document.createElement("li");
      li.textContent = code;
      usedCodesList.appendChild(li);
    }
  }

}
