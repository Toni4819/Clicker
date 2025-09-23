// menus/settings.js
const enc = new TextEncoder();
const dec = new TextDecoder();
async function deriveKey(password, salt) {
  const baseKey = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" }, baseKey, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
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

export function initSettings({ els, state, keys, save, renderMain }) {
  const modal = document.getElementById("settingsModal");
  // center modal (full-screen fixed container)
  modal.className = "modal";
  modal.style.cssText = "position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;z-index:1000;";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-labelledby", "settingsTitle");

  modal.innerHTML = `
  <div class="modal-content" style="width:100%;max-width:720px;background:var(--bg,#fff);border-radius:8px;box-shadow:0 8px 30px rgba(0,0,0,0.3);display:flex;flex-direction:column;height:auto;max-height:90vh;overflow:hidden;">
    <header class="modal-header" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid rgba(0,0,0,0.06);">
      <h2 id="settingsTitle" style="margin:0">⚙️ Paramètres</h2>
      <button id="closeSettingsBtn" class="close-btn" aria-label="Fermer" style="background:transparent;border:0;font-size:18px;cursor:pointer;">✕</button>
    </header>
    <div class="modal-body" id="settingsBody" style="flex:1;display:flex;flex-direction:column;gap:12px;padding:16px;">
      <button id="loginBtn" class="btn" style="width:100%;background:#10141b;color:#fff;border-radius:6px;padding:10px 12px;border:0;cursor:pointer;">🔑 Se connecter</button>

      <div id="rowTop" style="display:flex;gap:8px;">
        <div style="flex:1;"><button id="exportBtn" class="btn" style="width:100%;background:#10141b;color:#fff;border-radius:6px;padding:10px 12px;border:0;cursor:pointer;">📤 Exporter</button></div>
        <div style="flex:1;"><button id="importBtn" class="btn" style="width:100%;background:#10141b;color:#fff;border-radius:6px;padding:10px 12px;border:0;cursor:pointer;">📥 Importer</button></div>
      </div>

      <div id="rowMiddle" style="display:flex;gap:8px;">
        <div style="flex:1;"><button id="reloadBtn" class="btn" style="width:100%;background:#10141b;color:#fff;border-radius:6px;padding:10px 12px;border:0;cursor:pointer;">🔄 Recharger</button></div>
        <div style="flex:1;"><button id="themeBtn" class="btn" style="width:100%;background:#10141b;color:#fff;border-radius:6px;padding:10px 12px;border:0;cursor:pointer;">🎗 Thème</button></div>
      </div>

      <div><button id="codesBtn" class="btn" style="width:100%;background:#10141b;color:#fff;border-radius:6px;padding:10px 12px;border:0;cursor:pointer;">💳 Codes</button></div>

      <div style="flex:1;"></div>

      <div style="display:flex;justify-content:center;padding-bottom:8px;">
        <button id="resetBtn" class="btn footer-reset" style="background:#b31217;color:#fff;border-radius:6px;padding:6px 10px;border:0;cursor:pointer;width:auto;">↻ Réinitialiser</button>
      </div>
    </div>
  </div>
  `;

  els.closeSettingsBtn = modal.querySelector("#closeSettingsBtn");
  els.resetBtn = modal.querySelector("#resetBtn");
  els.loginBtn = modal.querySelector("#loginBtn");
  els.exportBtn = modal.querySelector("#exportBtn");
  els.importBtn = modal.querySelector("#importBtn");
  els.reloadBtn = modal.querySelector("#reloadBtn");
  els.themeBtn = modal.querySelector("#themeBtn");
  els.codesBtn = modal.querySelector("#codesBtn");

  function createSecondaryModal(id, title, innerHtml) {
    const m = document.createElement("div");
    m.id = id;
    m.className = "modal modal-secondary";
    m.setAttribute("role", "dialog");
    m.setAttribute("aria-hidden", "true");
    m.style.cssText = "position:fixed;inset:0;display:flex;align-items:center;justify-content:center;padding:16px;z-index:1100;";
    m.innerHTML = `
      <div class="modal-backdrop" data-backdrop style="position:fixed;inset:0;background:rgba(0,0,0,0.4);"></div>
      <div class="modal-content" style="width:100%;max-width:540px;background:var(--bg,#fff);border-radius:8px;box-shadow:0 8px 30px rgba(0,0,0,0.3);overflow:hidden;">
        <header class="modal-header" role="toolbar" style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid rgba(0,0,0,0.06);">
          <h3 id="${id}Title" class="modal-title" style="margin:0;font-size:1.05rem">${title}</h3>
          <button class="close-btn" data-close="${id}" aria-label="Fermer" style="background:transparent;border:0;font-size:16px;cursor:pointer;">✕</button>
        </header>
        <div class="modal-body" style="display:flex;flex-direction:column;gap:8px;padding:12px 16px;">
          ${innerHtml}
        </div>
      </div>
    `;
    m.addEventListener("click", e => {
      if (e.target === m || e.target.hasAttribute("data-backdrop")) closeSecondaryModal(m);
    });
    const closeBtn = m.querySelector(".close-btn");
    if (closeBtn) closeBtn.addEventListener("click", () => closeSecondaryModal(m));
    const content = m.querySelector(".modal-content");
    if (content) content.addEventListener("click", e => e.stopPropagation());
    m.style.display = "none";
    document.body.appendChild(m);
    return m;
  }

  function openSecondaryModal(modalEl) {
    const others = document.querySelectorAll(".modal.modal-secondary[aria-hidden='false']");
    others.forEach(o => { if (o !== modalEl) closeSecondaryModal(o); });
    // make main settings inert to avoid aria-hidden on focused element
    modal.inert = true;
    modal.style.pointerEvents = "none";
    modalEl.setAttribute("aria-hidden", "false");
    modalEl.style.display = "flex";
    document.body.classList.add("modal-open");
    const focusable = modalEl.querySelector('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
    if (focusable) focusable.focus();
  }

  function closeSecondaryModal(modalEl) {
    modalEl.setAttribute("aria-hidden", "true");
    modalEl.style.display = "none";
    modal.inert = false;
    modal.style.pointerEvents = "";
    document.body.classList.remove("modal-open");
    const settingsBtnEl = modal.querySelector('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
    if (settingsBtnEl) settingsBtnEl.focus();
  }

  const exportContainer = createSecondaryModal("exportModal", "Exporter", `
    <textarea id="exportText" rows="5" style="width:100%;margin-top:8px;"></textarea>
    <div style="display:flex;gap:8px;">
      <button id="saveExportBtn" class="btn modal-btn" style="flex:1;background:#10141b;color:#fff;border-radius:6px;padding:8px;border:0;cursor:pointer;">💾 Télécharger</button>
      <button id="copyExportBtn" class="btn modal-btn" style="flex:1;background:#10141b;color:#fff;border-radius:6px;padding:8px;border:0;cursor:pointer;">📋 Copier</button>
    </div>
  `);

  const importContainer = createSecondaryModal("importModal", "Importer", `
    <textarea id="importText" rows="5" style="width:100%;margin-top:8px;"></textarea>
    <div style="display:flex;gap:8px;">
      <button id="applyImportBtn" class="btn modal-btn" style="flex:1;background:#10141b;color:#fff;border-radius:6px;padding:8px;border:0;cursor:pointer;">📂 Appliquer</button>
      <label class="btn modal-btn" style="flex:1;background:#10141b;color:#fff;border-radius:6px;padding:8px;border:0;cursor:pointer;text-align:center;">
        Parcourir
        <input id="fileImportInput" type="file" accept=".txt,application/json" style="display:none;">
      </label>
    </div>
  `);

  const codesContainer = createSecondaryModal("codesModal", "Codes", `
    <input id="codeInput" type="text" placeholder="Entrez le code" style="width:100%;margin-top:8px;padding:8px;border-radius:6px;border:1px solid #ddd;"/>
    <button id="applyCodeBtn" class="btn modal-btn" style="margin-top:8px;width:100%;background:#10141b;color:#fff;border-radius:6px;padding:8px;border:0;cursor:pointer;">✅ Valider</button>
    <h4 style="margin:8px 0 4px;">Codes utilisés :</h4>
    <ul id="usedCodesList" style="padding-left:20px;margin:0;"></ul>
  `);

  // Ensure secondaries hidden initially
  exportContainer.style.display = "none";
  importContainer.style.display = "none";
  codesContainer.style.display = "none";

  function openSettings() {
    modal.setAttribute("aria-hidden", "false");
    modal.style.display = "flex";
    document.body.classList.add("modal-open");
    const firstFocusable = modal.querySelector('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) firstFocusable.focus();
  }
  function closeSettings() {
    modal.setAttribute("aria-hidden", "true");
    modal.style.display = "none";
    document.body.classList.remove("modal-open");
    // close secondaries
    exportContainer.style.display = "none";
    exportContainer.setAttribute("aria-hidden", "true");
    importContainer.style.display = "none";
    importContainer.setAttribute("aria-hidden", "true");
    codesContainer.style.display = "none";
    codesContainer.setAttribute("aria-hidden", "true");
    modal.inert = false;
  }

  function performFullReset() {
    if (!confirm("⚠️ Réinitialiser TOUT le stockage local ?")) return;
    setTimeout(() => {
      try {
        localStorage.clear();
        for (const k of keys) state[k] = 0;
        state.pointsPerClick = 1;
        state.shopBoost = 1;
        state.tempShopBoostFactor = 1;
        state.tempShopBoostExpiresAt = 0;
        state.rebirths = 0;
        save();
        renderMain();
      } catch (e) {
        console.error("Reset failed", e);
      } finally {
        closeSettings();
      }
    }, 16);
  }

  els.settingsBtn.addEventListener("click", openSettings);
  els.closeSettingsBtn.addEventListener("click", closeSettings);
  modal.addEventListener("click", e => { if (e.target === modal) closeSettings(); });
  els.loginBtn.addEventListener("click", () => { console.log("🔐 Fonction de connexion à implémenter"); });
  els.resetBtn.addEventListener("click", performFullReset);

  els.exportBtn.addEventListener("click", async () => {
    const password = prompt("🔐 Mot de passe pour chiffrer l’export :");
    if (!password) return;
    try {
      const dataStr = JSON.stringify(state);
      const encrypted = await encryptData(dataStr, password);
      const ta = exportContainer.querySelector("#exportText");
      const saveBtn = exportContainer.querySelector("#saveExportBtn");
      const copyBtn = exportContainer.querySelector("#copyExportBtn");
      ta.value = encrypted;
      openSecondaryModal(exportContainer);

      // replace nodes to remove previous listeners
      const newSave = saveBtn.cloneNode(true);
      saveBtn.parentNode.replaceChild(newSave, saveBtn);
      const newCopy = copyBtn.cloneNode(true);
      copyBtn.parentNode.replaceChild(newCopy, copyBtn);

      newSave.addEventListener("click", () => {
        const blob = new Blob([ta.value], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "clicker-state.txt";
        document.body.appendChild(a);
        requestAnimationFrame(() => {
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        });
      });

      newCopy.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(ta.value);
          alert("Copié dans le presse-papiers.");
        } catch {
          alert("Impossible de copier automatiquement. Sélectionnez le texte et copiez manuellement.");
        }
      });
    } catch (err) {
      console.error("Chiffrement impossible", err);
      alert("Erreur lors de l’export chiffré.");
    }
  });

  els.importBtn.addEventListener("click", () => {
    const password = prompt("🔐 Mot de passe pour déchiffrer l’import :");
    if (!password) return;
    const applyBtn = importContainer.querySelector("#applyImportBtn");
    const ta = importContainer.querySelector("#importText");
    const fileInput = importContainer.querySelector("#fileImportInput");
    openSecondaryModal(importContainer);

    const newApply = applyBtn.cloneNode(true);
    applyBtn.parentNode.replaceChild(newApply, applyBtn);

    newApply.addEventListener("click", async () => {
      newApply.disabled = true;
      setTimeout(async () => {
        try {
          const text = ta.value.trim();
          if (!text) throw new Error("Aucun texte saisi.");
          const decrypted = await decryptData(text, password);
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
          console.error("Déchiffrement/parse impossible", err);
          alert("Mot de passe incorrect ou texte invalide.");
        } finally {
          newApply.disabled = false;
        }
      }, 16);
    });

    fileInput.addEventListener("change", async (ev) => {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => { ta.value = String(reader.result || ""); };
      reader.readAsText(file);
    }, { once: true });
  });

  els.reloadBtn.addEventListener("click", async () => {
    if (!confirm("Voulez-vous vider le cache et recharger la nouvelle version en ligne ?")) return;
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
    } catch (e) {
      console.warn("Erreur lors de la suppression des caches", e);
    } finally {
      // force reload bypassing cache
      location.reload(true);
    }
  });

  els.themeBtn.addEventListener("click", () => {
    console.log("Changer le thème - à implémenter.");
  });

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

    const newApply = applyBtn.cloneNode(true);
    applyBtn.parentNode.replaceChild(newApply, applyBtn);

    newApply.addEventListener("click", () => {
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
    });
  });

  // Fallback hooks
  const saveExportBtn = document.getElementById("saveExportBtn");
  if (saveExportBtn) saveExportBtn.addEventListener("click", () => closeSecondaryModal(exportContainer));

  const applyImportBtn = document.getElementById("applyImportBtn");
  if (applyImportBtn) applyImportBtn.addEventListener("click", () => closeSecondaryModal(importContainer));

  const applyCodeBtn = document.getElementById("applyCodeBtn");
  if (applyCodeBtn) applyCodeBtn.addEventListener("click", () => closeSecondaryModal(codesContainer));

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      const openSecondary = document.querySelector(".modal.modal-secondary[aria-hidden='false']");
      if (openSecondary) closeSecondaryModal(openSecondary);
      else if (modal && modal.style.display !== "none") closeSettings();
    }
  });
}
