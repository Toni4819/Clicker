// settings.js
// Version avec logs détaillés pour traçage. Remplace ton fichier settings.js par ceci.
// Dépendances attendues : els (optionnel), state, keys, save, renderMain, renderStore,
// encryptData, decryptData, formatCompact

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
  console.log("[settings] initSettings() called", { elsProvided: !!els, keysLength: keys.length });

  // --- Création / récupération du modal principal
  let modal = document.getElementById("settingsModal");
  if (!modal) {
    console.log("[settings] settingsModal absent — création");
    modal = document.createElement("div");
    modal.id = "settingsModal";
    modal.className = "modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-hidden", "true");
    document.body.appendChild(modal);
  } else {
    console.log("[settings] settingsModal trouvé — réutilisation");
    modal.className = "modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-hidden", "true");
  }

  // --- HTML principal (disposition demandée)
  modal.innerHTML = `
    <div class="modal-content" role="document" aria-labelledby="settingsTitle" id="settingsContent">
      <header class="modal-header">
        <h2 id="settingsTitle">⚙️ Paramètres</h2>
        <button id="closeSettingsBtn" class="close-btn" aria-label="Fermer">✕</button>
      </header>

      <div class="modal-body" id="settingsBody">
        <section class="section">
          <div style="margin-bottom:12px;">
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
        </section>

        <section id="settingsSecondaryRoot" style="display:none;margin-top:12px;">
          <div id="secOverlay" style="display:flex;gap:12px;">
            <nav id="secSidebar" class="modal-second-sidebar" aria-label="Menu paramètres" style="min-width:160px;">
              <ul role="menu" id="secNav" style="list-style:none;margin:0;padding:8px;display:flex;flex-direction:column;gap:8px;">
                <li role="none"><button role="menuitem" data-tab="login" class="sec-tab btn">🔐 Connexion</button></li>
                <li role="none"><button role="menuitem" data-tab="export" class="sec-tab btn">📤 Export</button></li>
                <li role="none"><button role="menuitem" data-tab="import" class="sec-tab btn">📥 Import</button></li>
                <li role="none"><button role="menuitem" data-tab="codes" class="sec-tab btn">🎟️ Codes</button></li>
              </ul>
            </nav>

            <div id="secContent" class="modal-second" role="region" aria-live="polite" style="flex:1;"></div>
          </div>

          <div style="display:flex;justify-content:flex-end;margin-top:8px;gap:8px;">
            <button id="secBack" class="btn">Retour</button>
            <button id="secClose" class="btn">Fermer</button>
          </div>
        </section>
      </div>

      <footer class="modal-footer" style="text-align:center;">
        <button id="resetBtn" class="btn btn-warning" style="padding:6px 12px;font-size:.9rem;">⚠️ Réinitialiser</button>
        <div style="margin-top:8px;font-size:.85rem;color:var(--muted-color);">Fermer avec Échap ou clic à l'extérieur</div>
      </footer>
    </div>
  `;

  console.log("[settings] modal innerHTML injecté");

  // --- Récupération des éléments (local refs garantis)
  const closeSettingsBtn = modal.querySelector("#closeSettingsBtn");
  const loginBtn = modal.querySelector("#loginBtn");
  const exportBtn = modal.querySelector("#exportBtn");
  const importBtn = modal.querySelector("#importBtn");
  const reloadBtn = modal.querySelector("#reloadBtn");
  const themeBtn = modal.querySelector("#themeBtn");
  const codesBtn = modal.querySelector("#codesBtn");
  const resetBtn = modal.querySelector("#resetBtn");

  const secondaryRoot = modal.querySelector("#settingsSecondaryRoot");
  const secNav = modal.querySelector("#secNav");
  const secSidebar = modal.querySelector("#secSidebar");
  const secContent = modal.querySelector("#secContent");
  const secBack = modal.querySelector("#secBack");
  const secClose = modal.querySelector("#secClose");

  console.log("[settings] DOM refs resolved", {
    closeSettingsBtn: !!closeSettingsBtn,
    loginBtn: !!loginBtn,
    exportBtn: !!exportBtn,
    importBtn: !!importBtn,
    reloadBtn: !!reloadBtn,
    themeBtn: !!themeBtn,
    codesBtn: !!codesBtn,
    resetBtn: !!resetBtn,
    secondaryRoot: !!secondaryRoot
  });

  // --- Templates for secondary menu
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

  // --- State
  let activeTab = null;
  let lastFocused = null;
  let rafId = null;
  let isOpen = false;

  // --- Open/close main modal
  function openMain() {
    console.log("[settings] openMain()");
    modal.setAttribute("aria-hidden", "false");
    modal.style.display = "flex";
    document.body.classList.add("modal-open");
    hideSecondary();
    isOpen = true;
    lastFocused = document.activeElement;
    loop();
  }

  function closeMain() {
    console.log("[settings] closeMain()");
    modal.setAttribute("aria-hidden", "true");
    modal.style.display = "none";
    document.body.classList.remove("modal-open");
    hideSecondary();
    isOpen = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    if (lastFocused && typeof lastFocused.focus === "function") {
      try { lastFocused.focus(); } catch (err) { console.warn("[settings] focus return failed", err); }
    }
  }

  function loop() {
    if (!isOpen) return;
    rafId = requestAnimationFrame(loop);
  }

  // --- Secondary show/hide and tab management
  function showSecondary() {
    console.log("[settings] showSecondary()");
    secondaryRoot.style.display = "block";
    secondaryRoot.setAttribute("aria-hidden", "false");
    if (!activeTab) setTab("export");
    const firstBtn = secSidebar.querySelector(".sec-tab");
    if (firstBtn) firstBtn.focus();
  }

  function hideSecondary() {
    console.log("[settings] hideSecondary()");
    if (!secondaryRoot) return;
    secondaryRoot.style.display = "none";
    secondaryRoot.setAttribute("aria-hidden", "true");
    setTab(null);
  }

  function setTab(tab) {
    console.log("[settings] setTab()", tab);
    if (!tab) {
      secContent.innerHTML = "";
      activeTab = null;
      return;
    }
    activeTab = tab;
    secContent.innerHTML = TEMPLATES[tab] || "<div>Vide</div>";
    wireTabControls(tab);
  }

  // --- Wire controls for each injected tab (guards + logs)
  function wireTabControls(tab) {
    console.log("[settings] wireTabControls()", tab);
    try {
      if (tab === "export") {
        const pwd = secContent.querySelector("#secExportPassword");
        const text = secContent.querySelector("#secExportText");
        const doBtn = secContent.querySelector("#secDoExport");
        const copyBtn = secContent.querySelector("#secCopyExport");
        console.log("[settings] export controls:", { pwd: !!pwd, text: !!text, doBtn: !!doBtn, copyBtn: !!copyBtn });

        async function performExport() {
          console.log("[settings] performExport() start");
          try {
            const payload = JSON.stringify(state);
            const p = (pwd && pwd.value) ? pwd.value.trim() : "";
            let out = payload;
            if (p && typeof encryptData === "function") {
              out = await encryptData(payload, p);
              console.log("[settings] export encrypted");
            }
            if (text) text.value = out;
            text && text.select();
            console.log("[settings] performExport() done");
          } catch (err) {
            console.error("[settings] performExport error", err);
            alert("Erreur lors de l'export");
          }
        }

        doBtn && doBtn.addEventListener("click", performExport);
        copyBtn && copyBtn.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText((text && text.value) || "");
            console.log("[settings] export copied to clipboard");
            alert("Copié dans le presse-papier");
          } catch (err) {
            console.warn("[settings] copy fallback", err);
            text && text.select();
            document.execCommand("copy");
            alert("Copié (fallback)");
          }
        });
      }

      if (tab === "import") {
        const pwd = secContent.querySelector("#secImportPassword");
        const txt = secContent.querySelector("#secImportText");
        const doBtn = secContent.querySelector("#secDoImport");
        const clearBtn = secContent.querySelector("#secClearImport");
        console.log("[settings] import controls:", { pwd: !!pwd, txt: !!txt, doBtn: !!doBtn, clearBtn: !!clearBtn });

        async function performImport() {
          console.log("[settings] performImport() start");
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
              console.log("[settings] import decrypted");
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
            console.log("[settings] performImport() success");
            alert("✅ Import réussi !");
            closeMain();
          } catch (err) {
            console.error("[settings] performImport error", err);
            alert("Mot de passe incorrect ou données invalides.");
          }
        }

        doBtn && doBtn.addEventListener("click", performImport);
        clearBtn && clearBtn.addEventListener("click", () => {
          if (pwd) pwd.value = "";
          if (txt) txt.value = "";
          console.log("[settings] import cleared");
        });
      }

      if (tab === "codes") {
        const codeIn = secContent.querySelector("#secCodeInput");
        const apply = secContent.querySelector("#secApplyCode");
        const feedback = secContent.querySelector("#secCodesFeedback");
        console.log("[settings] codes controls:", { codeIn: !!codeIn, apply: !!apply, feedback: !!feedback });
        apply && apply.addEventListener("click", () => {
          const code = (codeIn && codeIn.value || "").trim();
          if (!code) {
            feedback && (feedback.textContent = "Entrer un code.");
            return;
          }
          if (code === "BONUS100") {
            state.points = (state.points || 0) + 100;
            feedback && (feedback.textContent = "Code appliqué : +100 points");
          } else if (code === "BOOSTX2") {
            state.pointsPerClick = (state.pointsPerClick || 1) * 2;
            feedback && (feedback.textContent = "Code appliqué : multiplicateur x2");
          } else {
            feedback && (feedback.textContent = "Code invalide");
          }
          save();
          renderMain();
          renderStore();
          console.log("[settings] code applied", code);
        });
      }

      if (tab === "login") {
        const submit = secContent.querySelector("#loginSubmit");
        console.log("[settings] login controls:", { submit: !!submit });
        submit && submit.addEventListener("click", () => {
          console.log("[settings] login submit clicked (not implemented)");
          alert("Connexion non implémentée");
        });
      }
    } catch (err) {
      console.error("[settings] wireTabControls failed", err);
    }
  }

  // --- Sidebar nav keyboard/click handling
  secNav && secNav.addEventListener("click", e => {
    const btn = e.target.closest(".sec-tab");
    if (!btn) return;
    const tab = btn.getAttribute("data-tab");
    console.log("[settings] sidebar click -> setTab", tab);
    setTab(tab);
  });

  secNav && secNav.addEventListener("keydown", e => {
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

  // --- Top-level button wiring using local refs (guards)
  function safeAdd(el, ev, fn) { if (el) { el.addEventListener(ev, fn); console.log("[settings] bound", ev, "on", el.id); } else console.warn("[settings] element missing for", ev); }

  safeAdd(exportBtn, "click", () => { openMain(); showSecondary(); setTab("export"); });
  safeAdd(importBtn, "click", () => { openMain(); showSecondary(); setTab("import"); });
  safeAdd(codesBtn, "click", () => { openMain(); showSecondary(); setTab("codes"); });
  safeAdd(loginBtn, "click", () => { openMain(); showSecondary(); setTab("login"); });
  safeAdd(reloadBtn, "click", () => {
    console.log("[settings] reloadBtn clicked");
    const link = document.querySelector("link[rel~='icon']");
    if (link) link.href = `${link.href.split("?")[0]}?t=${Date.now()}`;
    window.location.reload();
  });
  safeAdd(themeBtn, "click", () => {
    console.log("[settings] themeBtn clicked");
    const current = document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    if (state.theme !== undefined) {
      state.theme = next;
      save();
    }
    renderMain();
  });

  // --- Secondary control buttons
  safeAdd(secBack, "click", () => { console.log("[settings] secBack clicked"); hideSecondary(); });
  safeAdd(secClose, "click", () => { console.log("[settings] secClose clicked"); closeMain(); });

  // --- Close handlers for main modal
  safeAdd(closeSettingsBtn, "click", () => { console.log("[settings] closeSettingsBtn clicked"); closeMain(); });
  modal.addEventListener("click", e => { if (e.target === modal) { console.log("[settings] backdrop clicked"); closeMain(); } });
  window.addEventListener("keydown", e => {
    if (e.key === "Escape" && modal.getAttribute("aria-hidden") === "false") {
      console.log("[settings] Escape pressed");
      if (secondaryRoot.style.display === "block") hideSecondary();
      else closeMain();
    }
  });

  // --- Reset action
  function performFullReset() {
    console.log("[settings] performFullReset()");
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
  safeAdd(resetBtn, "click", performFullReset);

  // --- Ensure closed at init
  hideSecondary();
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");

  console.log("[settings] initSettings() completed");
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
