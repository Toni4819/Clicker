// settings.js
// Exporte initSettings qui initialise et gère le modal des paramètres.
// Attention : les fonctions utilitaires comme encryptData / decryptData, save() et renderMain()
// sont attendues ailleurs dans ton projet et sont utilisées ici par référence.

export function initSettings({ els = {}, state = {}, keys = [], save = () => {}, renderMain = () => {}, encryptData, decryptData }) {
  // Crée et attache le modal si il n'existe pas déjà
  let modal = document.getElementById("settingsModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "settingsModal";
    modal.className = "modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-hidden", "true");
    modal.style.display = "none";
    document.body.appendChild(modal);
  } else {
    // Force état caché sûr à l'initialisation pour éviter ouverture au chargement
    modal.className = "modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-hidden", "true");
    modal.style.display = "none";
  }

  // HTML interne du modal (simple et accessible)
  modal.innerHTML = `
    <div class="modal-content" role="document" aria-labelledby="settingsTitle" id="settingsContent">
      <header class="modal-header">
        <h2 id="settingsTitle">Paramètres</h2>
        <button id="closeSettingsBtn" class="btn icon" aria-label="Fermer les paramètres">✕</button>
      </header>

      <section id="buttonRow" class="settings-buttons" style="display:flex;gap:8px;">
        <button id="exportBtn" class="btn">Exporter</button>
        <button id="importBtn" class="btn">Importer</button>
        <button id="codesBtn" class="btn">Codes</button>
        <button id="themeBtn" class="btn">Thème</button>
        <button id="reloadBtn" class="btn">Recharger</button>
        <button id="resetBtn" class="btn danger">Réinitialiser</button>
      </section>

      <section id="containerRow" class="settings-containers" style="margin-top:12px;">
        <!-- Conteneurs dynamiques injectés par JS -->
      </section>

      <footer class="modal-footer">
        <small>Fermer avec Échap ou en cliquant à l'extérieur</small>
      </footer>
    </div>
  `;

  // Références DOM (sûres)
  els.closeSettingsBtn = modal.querySelector("#closeSettingsBtn");
  els.exportBtn = modal.querySelector("#exportBtn");
  els.importBtn = modal.querySelector("#importBtn");
  els.codesBtn = modal.querySelector("#codesBtn");
  els.themeBtn = modal.querySelector("#themeBtn");
  els.reloadBtn = modal.querySelector("#reloadBtn");
  els.resetBtn = modal.querySelector("#resetBtn");
  const buttonRow = modal.querySelector("#buttonRow");
  const containerRow = modal.querySelector("#containerRow");

  // Crée les 3 containers utiles : export / import / codes
  const exportContainer = document.createElement("div");
  exportContainer.id = "exportContainer";
  exportContainer.style.display = "none";
  exportContainer.innerHTML = `
    <label for="exportPassword">Mot de passe (optionnel)</label>
    <input id="exportPassword" type="password" class="input" />
    <textarea id="exportText" class="textarea" readonly rows="6" placeholder="Cliquez sur Exporter pour générer les données"></textarea>
    <div style="margin-top:8px;">
      <button id="doExportBtn" class="btn primary">Générer l'export</button>
      <button id="copyExportBtn" class="btn">Copier</button>
    </div>
  `;

  const importContainer = document.createElement("div");
  importContainer.id = "importContainer";
  importContainer.style.display = "none";
  importContainer.innerHTML = `
    <label for="importPassword">Mot de passe</label>
    <input id="importPassword" type="password" class="input" />
    <label for="importText">Données à importer</label>
    <textarea id="importText" class="textarea" rows="6" placeholder="Collez les données chiffrées ou brutes ici"></textarea>
    <div style="margin-top:8px;">
      <button id="doImportBtn" class="btn primary">Importer</button>
      <button id="clearImportBtn" class="btn">Effacer</button>
    </div>
  `;

  const codesContainer = document.createElement("div");
  codesContainer.id = "codesContainer";
  codesContainer.style.display = "none";
  codesContainer.innerHTML = `
    <label for="codeInput">Entrer un code</label>
    <input id="codeInput" class="input" />
    <div style="margin-top:8px;">
      <button id="applyCodeBtn" class="btn primary">Appliquer</button>
    </div>
    <div id="codesFeedback" style="margin-top:8px;color:var(--muted-color);"></div>
  `;

  containerRow.appendChild(exportContainer);
  containerRow.appendChild(importContainer);
  containerRow.appendChild(codesContainer);

  // Sélecteurs internes
  const exportPasswordInput = exportContainer.querySelector("#exportPassword");
  const exportText = exportContainer.querySelector("#exportText");
  const doExportBtn = exportContainer.querySelector("#doExportBtn");
  const copyExportBtn = exportContainer.querySelector("#copyExportBtn");

  const importPasswordInput = importContainer.querySelector("#importPassword");
  const importText = importContainer.querySelector("#importText");
  const doImportBtn = importContainer.querySelector("#doImportBtn");
  const clearImportBtn = importContainer.querySelector("#clearImportBtn");

  const codeInput = codesContainer.querySelector("#codeInput");
  const applyCodeBtn = codesContainer.querySelector("#applyCodeBtn");
  const codesFeedback = codesContainer.querySelector("#codesFeedback");

  // Fonctions d'ouverture / fermeture (robustes)
  function openSettings(showContainerId) {
    modal.setAttribute("aria-hidden", "false");
    modal.style.display = "block";
    document.body.classList.add("modal-open");
    // Masque tous les containers puis affiche le demandé (si fourni)
    exportContainer.style.display = "none";
    importContainer.style.display = "none";
    codesContainer.style.display = "none";
    if (showContainerId === "export") exportContainer.style.display = "block";
    if (showContainerId === "import") importContainer.style.display = "block";
    if (showContainerId === "codes") codesContainer.style.display = "block";
  }

  function closeSettings() {
    modal.setAttribute("aria-hidden", "true");
    modal.style.display = "none";
    document.body.classList.remove("modal-open");
    // nettoyage visuel
    exportContainer.style.display = "none";
    importContainer.style.display = "none";
    codesContainer.style.display = "none";
  }

  // Attach events sûrs (vérif existence)
  if (els.settingsBtn) {
    els.settingsBtn.addEventListener("click", () => openSettings());
  } else {
    // Si on n'a pas reçu els.settingsBtn, essaie de trouver un bouton global
    const fallback = document.getElementById("settingsBtn");
    if (fallback) fallback.addEventListener("click", () => openSettings());
  }

  if (els.closeSettingsBtn) els.closeSettingsBtn.addEventListener("click", closeSettings);
  // fermer si clic en dehors de la fenêtre
  modal.addEventListener("click", e => {
    if (e.target === modal) closeSettings();
  });
  // Échap pour fermer
  window.addEventListener("keydown", e => {
    if (e.key === "Escape" && modal.style.display === "block") closeSettings();
  });

  // Reset complet
  function performFullReset() {
    if (!confirm("⚠️ Réinitialiser tout le stockage local ?")) return;
    localStorage.clear();
    // Réinitialise les clés numériques connues dans le state
    for (const k of keys) {
      state[k] = 0;
    }
    // Exemples d'initialisation complémentaires s'il y en a
    if (typeof state.pointsPerClick !== "undefined") state.pointsPerClick = 1;
    if (typeof state.rebirths !== "undefined") state.rebirths = 0;
    save();
    renderMain();
    closeSettings();
  }

  if (els.resetBtn) els.resetBtn.addEventListener("click", performFullReset);

  // Export: génère JSON, optionnellement chiffre si encryptData fourni
  async function doExport() {
    try {
      const payload = JSON.stringify(state);
      let out = payload;
      const pwd = exportPasswordInput.value.trim();
      if (pwd && typeof encryptData === "function") {
        out = await encryptData(payload, pwd);
      }
      exportText.value = out;
      exportText.select();
    } catch (err) {
      console.error("Erreur export:", err);
      alert("Erreur lors de l'export. Voir console.");
    }
  }

  if (doExportBtn) doExportBtn.addEventListener("click", async () => {
    await doExport();
    openSettings("export");
  });

  if (copyExportBtn) copyExportBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(exportText.value);
      alert("Copié dans le presse-papier");
    } catch (err) {
      console.warn("Impossible de copier:", err);
      exportText.select();
      document.execCommand("copy");
      alert("Données copiées (mode de repli)");
    }
  });

  // Import : validé / décrypte si nécessaire / parse JSON / merge dans state
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
      } else {
        // si pas de mot de passe, on essaie d'utiliser tel quel
        decrypted = encrypted;
      }

      const imported = JSON.parse(decrypted);
      if (typeof imported !== "object" || imported === null) throw new Error("Données invalides");
      Object.assign(state, imported);
      save();
      renderMain();
      alert("✅ Import réussi !");
      closeSettings();
    } catch (err) {
      console.error("Erreur d'import :", err);
      alert("Mot de passe incorrect ou données invalides.");
    }
  }

  if (doImportBtn) doImportBtn.addEventListener("click", async () => {
    await doImport();
    openSettings("import");
  });

  if (clearImportBtn) clearImportBtn.addEventListener("click", () => {
    importPasswordInput.value = "";
    importText.value = "";
  });

  // Reload (rafraîchir favicon to bust cache puis reload)
  if (els.reloadBtn) els.reloadBtn.addEventListener("click", () => {
    const link = document.querySelector("link[rel~='icon']");
    if (link) {
      const href = link.href.split("?")[0];
      link.href = `${href}?t=${Date.now()}`;
    }
    window.location.reload();
  });

  // Theme switch placeholder (implémenter selon ton système de thème)
  if (els.themeBtn) els.themeBtn.addEventListener("click", () => {
    // Toggle a data-theme attribute or class on body as appropriate
    const current = document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    // Sauvegarde si tu gères le thème dans state
    if (state.theme !== undefined) {
      state.theme = next;
      save();
    }
    renderMain();
  });

  // Codes : example simple (adapter la logique réelle)
  if (els.codesBtn) els.codesBtn.addEventListener("click", () => openSettings("codes"));

  if (applyCodeBtn) applyCodeBtn.addEventListener("click", () => {
    const code = (codeInput.value || "").trim();
    if (!code) {
      codesFeedback.textContent = "Entrer un code.";
      return;
    }

    // Exemple: 3 codes tests (adapter à ta logique)
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
  });

  // Empêche l'ouverture automatique au load (garantie contre scripts qui ouvrent le modal)
  // Si un autre script tente d'ouvrir le modal par erreur, il faudra inspecter l'appel incriminé.
  // Ici on s'assure que tout commence fermé.
  closeSettings();

  // Retourne un objet utile pour tests ou contrôle externe
  return {
    openSettings,
    closeSettings,
    modal,
    exportContainer,
    importContainer,
    codesContainer
  };
}
