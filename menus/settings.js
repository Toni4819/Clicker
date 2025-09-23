// settings.js
// initSettings qui n'altère pas le style global (utilise les classes du style.css existant)
// Conçu pour remplacer directement ton fichier settings.js actuel.
// Attends : els (avec settingsBtn), state, keys, save, renderMain, renderStore, encryptData, decryptData, formatCompact

export function initSettings({
  els = {},
  state = {},
  keys = [],
  save = () => {},
  renderMain = () => {},
  renderStore = () => {},
  encryptData,
  decryptData,
  formatCompact = v => String(v)
}) {
  // --- Création du modal principal en respectant les classes existantes (.modal, .modal-content)
  let modal = document.getElementById("settingsModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "settingsModal";
    modal.className = "modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-hidden", "true");
    document.body.appendChild(modal);
  } else {
    modal.className = "modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-hidden", "true");
  }

  // HTML du modal (compatible avec style.css)
  modal.innerHTML = `
    <div class="modal-content" role="document" aria-labelledby="settingsTitle" id="settingsContent">
      <header class="modal-header">
        <h2 id="settingsTitle">⚙️ Paramètres</h2>
        <button id="closeSettingsBtn" class="close-btn" aria-label="Fermer">✕</button>
      </header>

      <div class="modal-body" id="settingsBody">
        <section class="section">
          <div id="settingsButtons" class="settings-buttons">
            <button id="exportBtn" class="btn btn-primary">📤 Exporter</button>
            <button id="importBtn" class="btn">📥 Importer</button>
            <button id="codesBtn" class="btn">🎟️ Codes</button>
            <button id="themeBtn" class="btn">🎨 Thème</button>
            <button id="reloadBtn" class="btn">🔁 Recharger</button>
            <button id="resetBtn" class="btn btn-warning">⚠️ Réinitialiser</button>
          </div>
        </section>

        <section id="settingsSecondaries" class="section">
          <!-- second modal containers injected via JS -->
        </section>
      </div>

      <footer class="modal-footer">
        <small>Fermer avec Échap ou clic à l'extérieur</small>
      </footer>
    </div>
  `;

  // --- Références DOM
  els.closeSettingsBtn = modal.querySelector("#closeSettingsBtn");
  els.exportBtn = modal.querySelector("#exportBtn");
  els.importBtn = modal.querySelector("#importBtn");
  els.codesBtn = modal.querySelector("#codesBtn");
  els.themeBtn = modal.querySelector("#themeBtn");
  els.reloadBtn = modal.querySelector("#reloadBtn");
  els.resetBtn = modal.querySelector("#resetBtn");
  const secondaries = modal.querySelector("#settingsSecondaries");

  // --- Helper: create modal-second (keeps style consistent)
  function createSecondary(id, html) {
    const node = document.createElement("div");
    node.id = id;
    node.className = "modal-second";
    node.setAttribute("aria-hidden", "true");
    node.style.display = "none";
    node.innerHTML = html;
    secondaries.appendChild(node);
    return node;
  }

  // --- Export container
  const exportContainer = createSecondary(
    "exportContainer",
    `
      <div class="section">
        <label for="exportPassword" class="section-title">Mot de passe (optionnel)</label>
        <input id="exportPassword" type="password" class="input" />
        <textarea id="exportText" class="textarea" readonly rows="6" placeholder="Cliquez sur Générer pour créer l'export"></textarea>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">
          <button id="doExportBtn" class="btn btn-primary">Générer</button>
          <button id="copyExportBtn" class="btn">Copier</button>
          <button id="backFromExport" class="btn">Retour</button>
        </div>
      </div>
    `
  );

  // --- Import container
  const importContainer = createSecondary(
    "importContainer",
    `
      <div class="section">
        <label for="importPassword" class="section-title">Mot de passe</label>
        <input id="importPassword" type="password" class="input" />
        <label for="importText" class="section-title">Données à importer</label>
        <textarea id="importText" class="textarea" rows="6" placeholder="Collez les données chiffrées ou brutes ici"></textarea>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">
          <button id="doImportBtn" class="btn btn-primary">Importer</button>
          <button id="clearImportBtn" class="btn">Effacer</button>
          <button id="backFromImport" class="btn">Retour</button>
        </div>
      </div>
    `
  );

  // --- Codes container
  const codesContainer = createSecondary(
    "codesContainer",
    `
      <div class="section">
        <label for="codeInput" class="section-title">Entrer un code</label>
        <input id="codeInput" class="input" />
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">
          <button id="applyCodeBtn" class="btn btn-primary">Appliquer</button>
          <button id="backFromCodes" class="btn">Retour</button>
        </div>
        <div id="codesFeedback" style="margin-top:10px;color:var(--muted);"></div>
      </div>
    `
  );

  // --- Selecteurs internes
  const exportPasswordInput = exportContainer.querySelector("#exportPassword");
  const exportText = exportContainer.querySelector("#exportText");
  const doExportBtn = exportContainer.querySelector("#doExportBtn");
  const copyExportBtn = exportContainer.querySelector("#copyExportBtn");
  const backFromExport = exportContainer.querySelector("#backFromExport");

  const importPasswordInput = importContainer.querySelector("#importPassword");
  const importText = importContainer.querySelector("#importText");
  const doImportBtn = importContainer.querySelector("#doImportBtn");
  const clearImportBtn = importContainer.querySelector("#clearImportBtn");
  const backFromImport = importContainer.querySelector("#backFromImport");

  const codeInput = codesContainer.querySelector("#codeInput");
  const applyCodeBtn = codesContainer.querySelector("#applyCodeBtn");
  const codesFeedback = codesContainer.querySelector("#codesFeedback");
  const backFromCodes = codesContainer.querySelector("#backFromCodes");

  // --- Etat
  let isOpen = false;
  let rafId = null;

  // --- Utilitaires d'affichage
  function hideAllSeconds() {
    [exportContainer, importContainer, codesContainer].forEach(c => {
      c.style.display = "none";
      c.setAttribute("aria-hidden", "true");
    });
  }

  function showSecond(container) {
    hideAllSeconds();
    if (!container) return;
    container.style.display = "block";
    container.setAttribute("aria-hidden", "false");
  }

  function openMain() {
    modal.setAttribute("aria-hidden", "false");
    modal.style.display = "flex"; // respecte .modal rules in style.css
    document.body.classList.add("modal-open");
    hideAllSeconds();
    isOpen = true;
    loop();
  }

  function closeMain() {
    modal.setAttribute("aria-hidden", "true");
    modal.style.display = "none";
    document.body.classList.remove("modal-open");
    hideAllSeconds();
    isOpen = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  // --- Loop UI léger (si futur besoin)
  function updateUI() {
    // placeholder pour mises à jour dynamiques si nécessaire
  }
  function loop() {
    if (!isOpen) return;
    updateUI();
    rafId = requestAnimationFrame(loop);
  }

  // --- Event bindings (sûrs)
  // settings button (from els or fallback DOM)
  if (els.settingsBtn) {
    els.settingsBtn.addEventListener("click", openMain);
  } else {
    const fallback = document.getElementById("settingsBtn");
    if (fallback) fallback.addEventListener("click", openMain);
  }

  if (els.closeSettingsBtn) els.closeSettingsBtn.addEventListener("click", closeMain);
  modal.addEventListener("click", e => {
    if (e.target === modal) closeMain();
  });
  window.addEventListener("keydown", e => {
    if (e.key === "Escape" && modal.getAttribute("aria-hidden") === "false") closeMain();
  });

  // --- Reset
  function performFullReset() {
    if (!confirm("⚠️ Réinitialiser tout le stockage local ?")) return;
    localStorage.clear();
    for (const k of keys) state[k] = 0;
    if (typeof state.pointsPerClick !== "undefined") state.pointsPerClick = 1;
    if (typeof state.rebirths !== "undefined") state.rebirths = 0;
    save();
    renderMain();
    renderStore();
    closeMain();
  }
  if (els.resetBtn) els.resetBtn.addEventListener("click", performFullReset);

  // --- Export logic
  async function doExport() {
    try {
      const payload = JSON.stringify(state);
      const pwd = exportPasswordInput.value.trim();
      let out = payload;
      if (pwd && typeof encryptData === "function") {
        out = await encryptData(payload, pwd);
      }
      exportText.value = out;
      exportText.select();
    } catch (err) {
      console.error("Export error", err);
      alert("Erreur lors de l'export");
    }
  }
  if (doExportBtn) doExportBtn.addEventListener("click", async () => {
    await doExport();
    showSecond(exportContainer);
  });

  if (copyExportBtn) copyExportBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(exportText.value);
      alert("Copié dans le presse-papier");
    } catch (err) {
      console.warn("Clipboard failed", err);
      exportText.select();
      document.execCommand("copy");
      alert("Copié (fallback)");
    }
  });
  if (backFromExport) backFromExport.addEventListener("click", () => showSecond(null));

  // --- Import logic (whitelist keys to avoid surprises)
  async function doImport() {
    const pwd = importPasswordInput.value.trim();
    const encrypted = importText.value.trim();
    if (!encrypted) {
      alert("Compléter les champs");
      return;
    }

    try {
      let decrypted = encrypted;
      if (pwd && typeof decryptData === "function") {
        decrypted = await decryptData(encrypted, pwd);
      }
      const imported = JSON.parse(decrypted);
      if (typeof imported !== "object" || imported === null) throw new Error("invalid imported data");

      // whitelist simple : only known keys allowed plus a few safe fields
      const whitelist = new Set([...keys, "rebirths", "theme", "pointsPerClick", "points", "shopBoost"]);
      for (const k of Object.keys(imported)) {
        if (whitelist.has(k)) state[k] = imported[k];
      }

      save();
      renderMain();
      renderStore();
      alert("✅ Import réussi !");
      closeMain();
    } catch (err) {
      console.error("Import error", err);
      alert("Mot de passe incorrect ou données invalides.");
    }
  }
  if (doImportBtn) doImportBtn.addEventListener("click", async () => {
    await doImport();
  });
  if (clearImportBtn) clearImportBtn.addEventListener("click", () => {
    importPasswordInput.value = "";
    importText.value = "";
  });
  if (backFromImport) backFromImport.addEventListener("click", () => showSecond(null));
  if (els.importBtn) els.importBtn.addEventListener("click", () => showSecond(importContainer));

  // --- Codes logic
  if (els.codesBtn) els.codesBtn.addEventListener("click", () => showSecond(codesContainer));
  if (applyCodeBtn) applyCodeBtn.addEventListener("click", () => {
    const code = (codeInput.value || "").trim();
    if (!code) {
      codesFeedback.textContent = "Entrer un code.";
      return;
    }
    if (code === "BONUS100") {
      state.points = (state.points || 0) + 100;
      codesFeedback.textContent = "Code appliqué : +100 points";
    } else if (code === "BOOSTX2") {
      state.pointsPerClick = (state.pointsPerClick || 1) * 2;
      codesFeedback.textContent = "Code appliqué : multiplicateur x2";
    } else {
      codesFeedback.textContent = "Code invalide";
    }
    save();
    renderMain();
    renderStore();
  });
  if (backFromCodes) backFromCodes.addEventListener("click", () => showSecond(null));

  // --- Reload
  if (els.reloadBtn) els.reloadBtn.addEventListener("click", () => {
    const link = document.querySelector("link[rel~='icon']");
    if (link) {
      const href = link.href.split("?")[0];
      link.href = `${href}?t=${Date.now()}`;
    }
    window.location.reload();
  });

  // --- Theme toggle
  if (els.themeBtn) els.themeBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    if (state.theme !== undefined) {
      state.theme = next;
      save();
    }
    renderMain();
  });

  // --- Ensure closed at init
  hideAllSeconds();
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");

  // --- Retourne API utile pour tests / contrôle externe
  return {
    openMain,
    closeMain,
    showSecond,
    modal,
    exportContainer,
    importContainer,
    codesContainer
  };
}
