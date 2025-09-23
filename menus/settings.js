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
      <button id="loginBtn" class="btn">🔑 Se connecter</button>
      <!-- rangée principale de boutons -->
      <div id="buttonRow" style="display:flex;flex-wrap:wrap;gap:8px;">
        <button id="exportBtn" class="btn" style="flex:1;min-width:100px;"> 📤 Exporter </button>
        <button id="importBtn" class="btn" style="flex:1;min-width:100px;"> 📥 Importer </button>
        <button id="reloadBtn" class="btn" style="flex:1;min-width:100px;"> 🔄 Recharger </button>
        <button id="themeBtn" class="btn" style="flex:1;min-width:100px;"> 🎗 Thème </button>
        <button id="codesBtn" class="btn" style="flex:1;min-width:100px;"> 💳 Codes </button>
      </div>
      <!-- conteneur où s’affichent Export/Import/Codes -->
      <div id="containerRow" style="display:flex;flex-direction:column;gap:8px;"></div>
      <div style="flex:1;"></div>
      <div style="display:flex;justify-content:center;">
        <button id="resetBtn" class="btn footer-reset">↻ Reset total</button>
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
  els.reloadBtn = modal.querySelector("#reloadBtn");
  els.themeBtn = modal.querySelector("#themeBtn");
  els.codesBtn = modal.querySelector("#codesBtn");
  const buttonRow = modal.querySelector("#buttonRow");
  const containerRow = modal.querySelector("#containerRow");

  // Secondary modal utilities
  function createSecondaryModal(id, title, innerHtml) {
    const m = document.createElement("div");
    m.id = id;
    m.className = "modal modal-secondary";
    m.setAttribute("role", "dialog");
    m.setAttribute("aria-hidden", "true");
    m.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content" style="max-width:540px;">
        <header class="modal-header" role="toolbar">
          <h3 id="${id}Title" class="modal-title">${title}</h3>
          <button class="close-btn" data-close="${id}" aria-label="Fermer">✕</button>
        </header>
        <div class="modal-body" style="display:flex;flex-direction:column;gap:8px;">
          ${innerHtml}
        </div>
      </div>
    `;
    m.addEventListener("click", e => {
      if (e.target === m || e.target.classList.contains("modal-backdrop")) closeSecondaryModal(m);
    });
    const closeBtn = m.querySelector(".close-btn");
    if (closeBtn) closeBtn.addEventListener("click", () => closeSecondaryModal(m));
    const content = m.querySelector(".modal-content");
    if (content) content.addEventListener("click", e => e.stopPropagation());
    document.body.appendChild(m);
    return m;
  }

  function openSecondaryModal(modalEl) {
    const others = document.querySelectorAll(".modal.modal-secondary[aria-hidden='false']");
    others.forEach(o => { if (o !== modalEl) closeSecondaryModal(o); });
    modalEl.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    if (buttonRow) buttonRow.style.display = "none";
    const focusable = modalEl.querySelector('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
    if (focusable) focusable.focus();
  }

  function closeSecondaryModal(modalEl) {
    modalEl.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    if (buttonRow) buttonRow.style.display = "flex";
    const settingsOpenBtn = document.querySelector('[data-open-settings], #settingsBtn');
    if (settingsOpenBtn) settingsOpenBtn.focus();
  }

  // Create secondary modals (export/import/codes)
  const exportContainer = createSecondaryModal("exportModal", "Exporter", `
    <textarea id="exportText" rows="5" style="width:100%;margin-top:8px;"></textarea>
    <button id="saveExportBtn" class="btn modal-btn" style="margin-top:8px;width:100%;">💾 Enregistrer</button>
  `);

  const importContainer = createSecondaryModal("importModal", "Importer", `
    <textarea id="importText" rows="5" style="width:100%;margin-top:8px;"></textarea>
    <button id="applyImportBtn" class="btn modal-btn" style="margin-top:8px;width:100%;">📂 Importer</button>
  `);

  const codesContainer = createSecondaryModal("codesModal", "Codes", `
    <input id="codeInput" type="text" placeholder="Entrez le code" style="width:100%;margin-top:8px;"/>
    <button id="applyCodeBtn" class="btn modal-btn" style="margin-top:8px;width:100%;">✅ Valider</button>
    <h4 style="margin:8px 0 4px;">Codes utilisés :</h4>
    <ul id="usedCodesList" style="padding-left:20px;margin:0;"></ul>
  `);

  // Ouvrir / Fermer le modal principal
  function openSettings() {
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }
  function closeSettings() {
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    // Réinitialise l’affichage
    buttonRow.style.display = "flex";
    exportContainer.setAttribute("aria-hidden", "true");
    importContainer.setAttribute("aria-hidden", "true");
    codesContainer.setAttribute("aria-hidden", "true");
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

  // Export chiffré — remplace l'ancien affichage inline par ouverture modal
  els.exportBtn.addEventListener("click", async () => {
    const password = prompt("🔐 Mot de passe pour chiffrer l’export :");
    if (!password) return;
    try {
      const dataStr = JSON.stringify(state);
      const encrypted = await encryptData(dataStr, password);
      const ta = exportContainer.querySelector("#exportText");
      const saveBtn = exportContainer.querySelector("#saveExportBtn");
      ta.value = encrypted;
      openSecondaryModal(exportContainer);
      saveBtn.onclick = () => {
        const blob = new Blob([ta.value], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "clicker-state.txt";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      };
    } catch (err) {
      console.error("❌ Chiffrement impossible", err);
      alert("Erreur lors de l’export chiffré.");
      closeSettings();
    }
  });

  // Import chiffré — ouverture modal
  els.importBtn.addEventListener("click", () => {
    const password = prompt("🔐 Mot de passe pour déchiffrer l’import :");
    if (!password) return;
    const applyBtn = importContainer.querySelector("#applyImportBtn");
    const ta = importContainer.querySelector("#importText");
    openSecondaryModal(importContainer);
    applyBtn.onclick = async () => {
      try {
        const decrypted = await decryptData(ta.value.trim(), password);
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

  // Recharger ressources
  els.reloadBtn.addEventListener("click", () => {
    const link = document.querySelector("link[rel*='icon']");
    if (link) {
      const href = link.href.split("?")[0];
      link.href = `${href}?t=${Date.now()}`;
    }
    window.location.reload();
  });

  // Thème (stub)
  els.themeBtn.addEventListener("click", () => {
    console.log("🎗 Changer le thème (clair/sombre/système) – fonction à implémenter");
  });

  // Gestion des codes
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
    updateUsedCodesList();
    openSecondaryModal(codesContainer);
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

  // Hooks pour boutons internes si d'autres parties du code attendent ces handlers
  const saveExportBtn = document.getElementById("saveExportBtn");
  if (saveExportBtn) saveExportBtn.addEventListener("click", () => {
    const ta = document.getElementById("exportText");
    if (ta) {
      const blob = new Blob([ta.value], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "clicker-state.txt";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
    closeSecondaryModal(exportContainer);
  });

  const applyImportBtn = document.getElementById("applyImportBtn");
  if (applyImportBtn) applyImportBtn.addEventListener("click", async () => {
    // this handler is set dynamically above; keep a fallback no-op
    closeSecondaryModal(importContainer);
  });

  const applyCodeBtn = document.getElementById("applyCodeBtn");
  if (applyCodeBtn) applyCodeBtn.addEventListener("click", () => {
    // actual logic set dynamically above
    closeSecondaryModal(codesContainer);
  });

  // Close secondary modals on Escape
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      const openSecondary = document.querySelector(".modal.modal-secondary[aria-hidden='false']");
      if (openSecondary) closeSecondaryModal(openSecondary);
      else if (modal && modal.getAttribute("aria-hidden") === "false") closeSettings();
    }
  });
}
