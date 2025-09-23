// settings.js
// Init le modal settings en s'appuyant sur les classes .modal et .modal-second
// Utilise le pattern du rebirthModal fourni : création DOM sûre, ouverture/fermeture robustes,
// et containers export / import / codes implémentés comme modal-second.

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
  // Création du modal principal (.modal)
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

  // Contenu du modal principal (minimal, containers injectés)
  modal.innerHTML = `
    <div class="modal-card" role="document" aria-labelledby="settingsTitle">
      <header class="modal-header" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;">
        <h2 id="settingsTitle" style="margin:0;font-size:1.05rem;">⚙️ Paramètres</h2>
        <button id="closeSettingsBtn" aria-label="Fermer" class="btn icon">✕</button>
      </header>

      <section id="settingsButtons" style="padding:12px;display:flex;gap:8px;flex-wrap:wrap;">
        <button id="exportBtn" class="btn">Exporter</button>
        <button id="importBtn" class="btn">Importer</button>
        <button id="codesBtn" class="btn">Codes</button>
        <button id="themeBtn" class="btn">Thème</button>
        <button id="reloadBtn" class="btn">Recharger</button>
        <button id="resetBtn" class="btn danger">Réinitialiser</button>
      </section>

      <section id="settingsSecondaries" style="padding:12px;">
        <!-- modal-second containers injected here -->
      </section>

      <footer style="padding:10px 12px;font-size:.85rem;color:var(--muted-color);">
        Fermer avec Échap ou clic en dehors
      </footer>
    </div>
  `;

  // Références sûres
  els.closeSettingsBtn = modal.querySelector("#closeSettingsBtn");
  els.exportBtn = modal.querySelector("#exportBtn");
  els.importBtn = modal.querySelector("#importBtn");
  els.codesBtn = modal.querySelector("#codesBtn");
  els.themeBtn = modal.querySelector("#themeBtn");
  els.reloadBtn = modal.querySelector("#reloadBtn");
  els.resetBtn = modal.querySelector("#resetBtn");
  const secondaries = modal.querySelector("#settingsSecondaries");
  const buttonsRow = modal.querySelector("#settingsButtons");

  // Créer containers .modal-second (export, import, codes)
  function createSecond(id, innerHTML) {
    const s = document.createElement("div");
    s.id = id;
    s.className = "modal-second";
    s.style.display = "none";
    s.innerHTML = innerHTML;
    secondaries.appendChild(s);
    return s;
  }

  const exportContainer = createSecond(
    "exportContainer",
    `
      <div style="display:flex;flex-direction:column;gap:8px;">
        <label for="exportPassword">Mot de passe (optionnel)</label>
        <input id="exportPassword" type="password" class="input" />
        <textarea id="exportText" class="textarea" readonly rows="6" placeholder="Cliquez sur Générer"></textarea>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button id="doExportBtn" class="btn primary">Générer</button>
          <button id="copyExportBtn" class="btn">Copier</button>
          <button id="backFromExport" class="btn">Retour</button>
        </div>
      </div>
    `
  );

  const importContainer = createSecond(
    "importContainer",
    `
      <div style="display:flex;flex-direction:column;gap:8px;">
        <label for="importPassword">Mot de passe</label>
        <input id="importPassword" type="password" class="input" />
        <label for="importText">Données</label>
        <textarea id="importText" class="textarea" rows="6" placeholder="Collez les données"></textarea>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button id="doImportBtn" class="btn primary">Importer</button>
          <button id="clearImportBtn" class="btn">Effacer</button>
          <button id="backFromImport" class="btn">Retour</button>
        </div>
      </div>
    `
  );

  const codesContainer = createSecond(
    "codesContainer",
    `
      <div style="display:flex;flex-direction:column;gap:8px;">
        <label for="codeInput">Entrer un code</label>
        <input id="codeInput" class="input" />
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button id="applyCodeBtn" class="btn primary">Appliquer</button>
          <button id="backFromCodes" class="btn">Retour</button>
        </div>
        <div id="codesFeedback" style="color:var(--muted-color);font-size:.95rem;"></div>
      </div>
    `
  );

  // Sélecteurs internes
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

  // Etat et animation
  let open = false;
  let rafId = null;

  function openMain() {
    modal.setAttribute("aria-hidden", "false");
    modal.classList.add("open"); // styles externes .modal expected
    open = true;
    // cache toutes les secondary au départ
    hideAllSeconds();
    startLoop();
  }

  function closeMain() {
    modal.setAttribute("aria-hidden", "true");
    modal.classList.remove("open");
    open = false;
    hideAllSeconds();
    stopLoop();
  }

  function showSecond(container) {
    hideAllSeconds();
    if (!container) return;
    container.style.display = "block";
  }

  function hideAllSeconds() {
    exportContainer.style.display = "none";
    importContainer.style.display = "none";
    codesContainer.style.display = "none";
  }

  // Boucle UI légère pour tenir les labels à jour (inspirée de rebirth)
  function updateUI() {
    // rien à faire ici par défaut, kept for parity if needed
  }

  function loop() {
    if (!open) return;
    updateUI();
    rafId = requestAnimationFrame(loop);
  }

  function startLoop() {
    if (!rafId) loop();
  }

  function stopLoop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  // Attache handlers sûrs (existence vérifiée)
  const bindSettingsBtn = () => {
    if (els.settingsBtn) {
      els.settingsBtn.addEventListener("click", openMain);
    } else {
      const fallback = document.getElementById("settingsBtn");
      if (fallback) fallback.addEventListener("click", openMain);
    }
  };
  bindSettingsBtn();

  if (els.closeSettingsBtn) els.closeSettingsBtn.addEventListener("click", closeMain);
  modal.addEventListener("click", e => {
    if (e.target === modal) closeMain();
  });
  window.addEventListener("keydown", e => {
    if (e.key === "Escape" && modal.getAttribute("aria-hidden") === "false") closeMain();
  });

  // Reset global
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

  // Export logic
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
      alert("Copié");
    } catch (err) {
      console.warn("copy failed", err);
      exportText.select();
      document.execCommand("copy");
      alert("Copié (fallback)");
    }
  });
  if (backFromExport) backFromExport.addEventListener("click", () => showSecond(null));

  // Import logic
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
      if (typeof imported !== "object" || imported === null) throw new Error("invalid");
      // whitelist keys to avoid injecting unexpected props
      const whitelist = new Set([...keys, "rebirths", "theme", "pointsPerClick", "points"]);
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
  if (els.importBtn) els.importBtn.addEventListener("click", () => {
    showSecond(importContainer);
  });

  // Codes logic
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

  // Reload
  if (els.reloadBtn) els.reloadBtn.addEventListener("click", () => {
    const link = document.querySelector("link[rel~='icon']");
    if (link) {
      const href = link.href.split("?")[0];
      link.href = `${href}?t=${Date.now()}`;
    }
    window.location.reload();
  });

  // Theme toggler
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

  // S'assure que tout démarre fermé
  hideAllSeconds();
  closeMain();

  // Retourne API utile
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
