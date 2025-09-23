// settings.js
// initSettings : modal principal + "vrai" menu secondaire (sidebar + content).
// Dépendances : els, state, keys, save, renderMain, renderStore, encryptData, decryptData, formatCompact

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
  // --- Création du modal principal
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

  // --- HTML : modal principal + secondary menu layout (sidebar + content)
  modal.innerHTML = `
    <div class="modal-content" role="document" aria-labelledby="settingsTitle" id="settingsContent">
      <header class="modal-header">
        <h2 id="settingsTitle">⚙️ Paramètres</h2>
        <button id="closeSettingsBtn" class="close-btn" aria-label="Fermer">✕</button>
      </header>

      <div class="modal-body" id="settingsBody">
        <!-- Top-level buttons layout as requested -->
        <div class="settings-top" style="margin-bottom:12px;">
          <button id="loginBtn" class="btn btn-primary" style="width:100%;">🔐 Se connecter</button>
        </div>

        <div style="display:flex;gap:8px;margin-bottom:12px;">
          <button id="exportBtn" class="btn btn-primary" style="flex:1;">📤 Exporter</button>
          <button id="importBtn" class="btn" style="flex:1;">📥 Importer</button>
        </div>

        <div style="display:flex;gap:8px;margin-bottom:12px;">
          <button id="reloadBtn" class="btn" style="flex:1;">🔁 Recharger</button>
          <button id="themeBtn" class="btn" style="flex:1;">🎨 Thème</button>
        </div>

        <div style="margin-bottom:12px;">
          <button id="codesBtn" class="btn" style="width:100%;">🎟️ Entrer un code</button>
        </div>

        <!-- placeholder pour le menu secondaire (sidebar + content) -->
        <div id="settingsSecondaryRoot" style="display:none;margin-top:12px;">
          <div id="secOverlay" style="display:flex;gap:12px;">
            <nav id="secSidebar" class="modal-second-sidebar" aria-label="Menu paramètres" style="min-width:160px;">
              <ul role="menu" id="secNav" style="list-style:none;margin:0;padding:8px;display:flex;flex-direction:column;gap:8px;">
                <li role="none"><button role="menuitem" data-tab="login" class="sec-tab btn">🔐 Connexion</button></li>
                <li role="none"><button role="menuitem" data-tab="export" class="sec-tab btn">📤 Export</button></li>
                <li role="none"><button role="menuitem" data-tab="import" class="sec-tab btn">📥 Import</button></li>
                <li role="none"><button role="menuitem" data-tab="codes" class="sec-tab btn">🎟️ Codes</button></li>
              </ul>
            </nav>

            <div id="secContent" class="modal-second" role="region" aria-live="polite" style="flex:1;">
              <!-- contenus par onglet injectés par JS -->
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end;margin-top:8px;gap:8px;">
            <button id="secBack" class="btn">Retour</button>
            <button id="secClose" class="btn">Fermer</button>
          </div>
        </div>
      </div>

      <footer class="modal-footer" style="text-align:center;">
        <button id="resetBtn" class="btn btn-warning" style="padding:6px 12px;font-size:.9rem;">⚠️ Réinitialiser</button>
        <div style="margin-top:8px;font-size:.85rem;color:var(--muted-color);">Fermer avec Échap ou clic à l'extérieur</div>
      </footer>
    </div>
  `;

  // --- DOM refs
  els.closeSettingsBtn = modal.querySelector("#closeSettingsBtn");
  els.loginBtn = modal.querySelector("#loginBtn");
  els.exportBtn = modal.querySelector("#exportBtn");
  els.importBtn = modal.querySelector("#importBtn");
  els.codesBtn = modal.querySelector("#codesBtn");
  els.themeBtn = modal.querySelector("#themeBtn");
  els.reloadBtn = modal.querySelector("#reloadBtn");
  els.resetBtn = modal.querySelector("#resetBtn");

  const secondaryRoot = modal.querySelector("#settingsSecondaryRoot");
  const secSidebar = modal.querySelector("#secSidebar");
  const secNav = modal.querySelector("#secNav");
  const secContent = modal.querySelector("#secContent");
  const secBack = modal.querySelector("#secBack");
  const secClose = modal.querySelector("#secClose");

  // --- Tab contents templates (kept simple, will be wired)
  const TEMPLATES = {
    login: `
      <h3>🔐 Connexion</h3>
      <p class="muted">Fonctionnalité à implémenter.</p>
      <label>Email</label><input id="loginEmail" class="input" type="email" />
      <label>Mot de passe</label><input id="loginPassword" class="input" type="password" />
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">
        <button id="loginSubmit" class="btn btn-primary">Se connecter</button>
      </div>
    `,
    export: `
      <h3>📤 Exporter</h3>
      <label>Mot de passe (optionnel)</label><input id="secExportPassword" type="password" class="input" />
      <textarea id="secExportText" class="textarea" readonly rows="6" placeholder="Cliquez sur Générer"></textarea>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">
        <button id="secDoExport" class="btn btn-primary">Générer</button>
        <button id="secCopyExport" class="btn">Copier</button>
      </div>
    `,
    import: `
      <h3>📥 Importer</h3>
      <label>Mot de passe</label><input id="secImportPassword" type="password" class="input" />
      <label>Données à importer</label><textarea id="secImportText" class="textarea" rows="6" placeholder="Collez les données"></textarea>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">
        <button id="secDoImport" class="btn btn-primary">Importer</button>
        <button id="secClearImport" class="btn">Effacer</button>
      </div>
    `,
    codes: `
      <h3>🎟️ Codes</h3>
      <label>Entrer un code</label><input id="secCodeInput" class="input" />
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">
        <button id="secApplyCode" class="btn btn-primary">Appliquer</button>
      </div>
      <div id="secCodesFeedback" style="margin-top:10px;color:var(--muted-color);"></div>
    `
  };

  // --- State: which tab is active
  let activeTab = null;
  let lastFocused = null;
  let rafId = null;
  let isOpen = false;

  // --- Utilities: open/close main modal
  function openMain() {
    modal.setAttribute("aria-hidden", "false");
    modal.style.display = "flex";
    document.body.classList.add("modal-open");
    hideSecondary();
    isOpen = true;
    lastFocused = document.activeElement;
    loop();
  }

  function closeMain() {
    modal.setAttribute("aria-hidden", "true");
    modal.style.display = "none";
    document.body.classList.remove("modal-open");
    hideSecondary();
    isOpen = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  function loop() {
    if (!isOpen) return;
    rafId = requestAnimationFrame(loop);
  }

  // --- Secondary show/hide
  function showSecondary() {
    secondaryRoot.style.display = "block";
    secondaryRoot.setAttribute("aria-hidden", "false");
    // default to export tab if none
    if (!activeTab) setTab("export");
    // focus first tabbable in sidebar
    const firstBtn = secSidebar.querySelector(".sec-tab");
    if (firstBtn) firstBtn.focus();
  }

  function hideSecondary() {
    secondaryRoot.style.display = "none";
    secondaryRoot.setAttribute("aria-hidden", "true");
    setTab(null);
  }

  // --- Tab switcher
  function setTab(tab) {
    if (!tab) {
      secContent.innerHTML = "";
      activeTab = null;
      return;
    }
    activeTab = tab;
    secContent.innerHTML = TEMPLATES[tab] || "<div>Vide</div>";
    // After injecting content, wire the specific controls for that tab
    wireTabControls(tab);
  }

  // --- Wire controls per tab
  function wireTabControls(tab) {
    if (tab === "export") {
      const pwd = document.getElementById("secExportPassword");
      const text = document.getElementById("secExportText");
      const doBtn = document.getElementById("secDoExport");
      const copyBtn = document.getElementById("secCopyExport");

      async function performExport() {
        try {
          const payload = JSON.stringify(state);
          const p = (pwd && pwd.value) ? pwd.value.trim() : "";
          let out = payload;
          if (p && typeof encryptData === "function") out = await encryptData(payload, p);
          if (text) text.value = out;
          text && text.select();
        } catch (err) {
          console.error("Export error", err);
          alert("Erreur lors de l'export");
        }
      }

      doBtn && doBtn.addEventListener("click", performExport);
      copyBtn && copyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(text.value || "");
          alert("Copié dans le presse-papier");
        } catch (err) {
          console.warn("copy fallback", err);
          text && text.select();
          document.execCommand("copy");
          alert("Copié (fallback)");
        }
      });
    }

    if (tab === "import") {
      const pwd = document.getElementById("secImportPassword");
      const txt = document.getElementById("secImportText");
      const doBtn = document.getElementById("secDoImport");
      const clearBtn = document.getElementById("secClearImport");

      async function performImport() {
        const encrypted = (txt && txt.value) ? txt.value.trim() : "";
        const p = (pwd && pwd.value) ? pwd.value.trim() : "";
        if (!encrypted) {
          alert("Compléter les champs");
          return;
        }
        try {
          let decrypted = encrypted;
          if (p && typeof decryptData === "function") {
            decrypted = await decryptData(encrypted, p);
          }
          const imported = JSON.parse(decrypted);
          if (typeof imported !== "object" || imported === null) throw new Error("invalid data");
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

      doBtn && doBtn.addEventListener("click", performImport);
      clearBtn && clearBtn.addEventListener("click", () => {
        if (pwd) pwd.value = "";
        if (txt) txt.value = "";
      });
    }

    if (tab === "codes") {
      const codeIn = document.getElementById("secCodeInput");
      const apply = document.getElementById("secApplyCode");
      const feedback = document.getElementById("secCodesFeedback");
      apply && apply.addEventListener("click", () => {
        const code = (codeIn && codeIn.value || "").trim();
        if (!code) {
          feedback.textContent = "Entrer un code.";
          return;
        }
        if (code === "BONUS100") {
          state.points = (state.points || 0) + 100;
          feedback.textContent = "Code appliqué : +100 points";
        } else if (code === "BOOSTX2") {
          state.pointsPerClick = (state.pointsPerClick || 1) * 2;
          feedback.textContent = "Code appliqué : multiplicateur x2";
        } else {
          feedback.textContent = "Code invalide";
        }
        save();
        renderMain();
        renderStore();
      });
    }

    if (tab === "login") {
      const submit = document.getElementById("loginSubmit");
      submit && submit.addEventListener("click", () => {
        // no-op placeholder
        alert("Connexion non implémentée");
      });
    }
  }

  // --- Sidebar navigation handling (keyboard & click)
  secNav.addEventListener("click", e => {
    const btn = e.target.closest(".sec-tab");
    if (!btn) return;
    const tab = btn.getAttribute("data-tab");
    setTab(tab);
  });

  secNav.addEventListener("keydown", e => {
    const focused = document.activeElement;
    if (!focused || !focused.classList.contains("sec-tab")) return;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      const next = focused.parentElement.nextElementSibling;
      if (next) next.querySelector(".sec-tab").focus();
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = focused.parentElement.previousElementSibling;
      if (prev) prev.querySelector(".sec-tab").focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const tab = focused.getAttribute("data-tab");
      setTab(tab);
    }
  });

  // --- Top-level button wiring: open the secondary menu and activate the related tab
  if (els.exportBtn) els.exportBtn.addEventListener("click", () => { openMain(); showSecondary(); setTab("export"); });
  if (els.importBtn) els.importBtn.addEventListener("click", () => { openMain(); showSecondary(); setTab("import"); });
  if (els.codesBtn) els.codesBtn.addEventListener("click", () => { openMain(); showSecondary(); setTab("codes"); });
  if (els.loginBtn) els.loginBtn.addEventListener("click", () => { openMain(); showSecondary(); setTab("login"); });

  // --- Secondary back/close
  secBack && secBack.addEventListener("click", () => {
    // simply hide secondary and keep main open
    hideSecondary();
  });
  secClose && secClose.addEventListener("click", () => {
    closeMain();
  });

  // --- Close handlers for the modal
  if (els.closeSettingsBtn) els.closeSettingsBtn.addEventListener("click", closeMain);
  modal.addEventListener("click", e => { if (e.target === modal) closeMain(); });
  window.addEventListener("keydown", e => {
    if (e.key === "Escape" && modal.getAttribute("aria-hidden") === "false") {
      // If secondary open, close it first; else close main
      if (secondaryRoot.style.display === "block") hideSecondary();
      else closeMain();
    }
  });

  // --- Reset button
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

  // --- Reload & Theme top-level
  if (els.reloadBtn) els.reloadBtn.addEventListener("click", () => {
    const link = document.querySelector("link[rel~='icon']");
    if (link) link.href = `${link.href.split("?")[0]}?t=${Date.now()}`;
    window.location.reload();
  });

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
  hideSecondary();
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");

  // --- Return API
  return {
    openMain,
    closeMain,
    showSecondary,
    hideSecondary,
    setTab,
    modal,
    secContent
  };
}
