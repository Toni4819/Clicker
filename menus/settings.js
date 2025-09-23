// initSettings.js
export function initSettings({ els, state, save, renderMain }) {
  const settingsBtn = els.settingsBtn;
  if (!settingsBtn) {
    console.error("initSettings : #settingsBtn introuvable");
    return;
  }

  // --- Créer / récupérer modal principal (settings) ---
  let modal = els.settingsModal;
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "settingsModal";
    modal.className = "modal";
    modal.setAttribute("aria-hidden", "true");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-labelledby", "settingsTitle");
    document.body.append(modal);
    els.settingsModal = modal;
  }

  // --- Créer / récupérer modal secondaire (codes / import / export) ---
  let modalSecond = els.settingsModalSecond;
  if (!modalSecond) {
    modalSecond = document.createElement("div");
    modalSecond.id = "settingsModalSecond";
    modalSecond.className = "modal modal-second";
    modalSecond.setAttribute("aria-hidden", "true");
    modalSecond.setAttribute("role", "dialog");
    modalSecond.setAttribute("aria-labelledby", "settingsSecondTitle");
    document.body.append(modalSecond);
    els.settingsModalSecond = modalSecond;
  }

  // --- HTML modal principal (structure conforme à shop/upgrades) ---
  modal.innerHTML = `
    <div class="modal-content">
      <header class="modal-header">
        <h2 id="settingsTitle">⚙️ Paramètres</h2>
        <button id="closeSettingsBtn" class="close-btn" aria-label="Fermer">✕</button>
      </header>
      <div class="modal-body" id="settingsBody">
        <section class="section">
          <h3 class="section-title" style="text-align:center">Compte <span id="acctState">(<span id="acctLabel">Non connecté</span>)</span></h3>
          <div style="display:flex;gap:8px;justify-content:center;margin-top:8px">
            <button id="loginBtn" class="btn btn-primary">🔐 Se connecter</button>
            <button id="logoutBtn" class="btn btn-primary">🔓 Se déconnecter</button>
          </div>
        </section>

        <section class="section">
          <h3 class="section-title" style="text-align:center">Données</h3>
          <div style="display:flex;gap:8px;justify-content:center;margin-top:8px;flex-wrap:wrap">
            <button id="exportBtn" class="btn btn-primary btn-data">📤 Exporter (chiffré)</button>
            <button id="importBtn" class="btn btn-primary btn-data">📥 Importer (chiffré)</button>
            <button id="reloadBtn" class="btn btn-primary btn-data">🔄 Recharger</button>
          </div>
        </section>

        <section class="section">
          <h3 class="section-title" style="text-align:center">Apparence</h3>
          <div style="display:flex;gap:8px;justify-content:center;margin-top:8px">
            <button id="themeBtn" class="btn btn-primary btn-appearance">🌗 Basculer thème</button>
          </div>
        </section>

        <section class="section">
          <h3 class="section-title" style="text-align:center">Codes</h3>
          <div style="display:flex;gap:8px;justify-content:center;margin-top:8px">
            <button id="codesBtn" class="btn btn-primary btn-codes">💳 Entrer un code</button>
          </div>
        </section>

        <section class="section" style="display:flex;justify-content:center">
          <button id="resetBtn" class="btn btn-warning">↺ Reset total</button>
        </section>
      </div>
    </div>
  `;

  // --- HTML modal secondaire ---
  modalSecond.innerHTML = `
    <div class="modal-content">
      <header class="modal-header">
        <h2 id="settingsSecondTitle">Action</h2>
        <button id="closeSettingsSecondBtn" class="close-btn" aria-label="Fermer">✕</button>
      </header>
      <div class="modal-body" id="settingsSecondBody"></div>
    </div>
  `;

  // --- Inject scoped color overrides only for this modal, using existing class names ---
  if (!document.getElementById("settings-modal-color-overrides")) {
    const style = document.createElement("style");
    style.id = "settings-modal-color-overrides";
    style.textContent = `
      /* keep all global styles, only override specific buttons inside #settingsModal */
      #settingsModal .btn-data {
        background: linear-gradient(180deg,#1e6ef0,#155ed6);
        border-color: rgba(255,255,255,0.06);
        color:white;
      }
      #settingsModal .btn-data:hover { filter:brightness(1.06); transform:translateY(-1px); }

      #settingsModal .btn-appearance {
        background: linear-gradient(180deg,#8656e0,#6a3fbf);
        border-color: rgba(255,255,255,0.06);
        color:white;
      }
      #settingsModal .btn-appearance:hover { filter:brightness(1.06); transform:translateY(-1px); }

      #settingsModal .btn-codes {
        background: linear-gradient(180deg,#2f9a57,#1f7a44);
        border-color: rgba(255,255,255,0.06);
        color:white;
      }
      #settingsModal .btn-codes:hover { filter:brightness(1.06); transform:translateY(-1px); }

      /* ensure contrast and keep original focus outlines if any */
      #settingsModal .btn-data:focus, #settingsModal .btn-appearance:focus, #settingsModal .btn-codes:focus {
        outline: 2px solid rgba(255,255,255,0.08);
        outline-offset: 2px;
      }

      /* secondary modal uses same button styles when opened from settings */
      #settingsModalSecond .btn, #settingsModalSecond .item-btn {
        /* no override here; secondary content uses default styles */
      }
    `;
    document.head.appendChild(style);
  }

  // --- Refs DOM ---
  const closeSettingsBtn = modal.querySelector("#closeSettingsBtn");
  const settingsBody = modal.querySelector("#settingsBody");
  const acctLabelEl = modal.querySelector("#acctLabel");

  const loginBtn = modal.querySelector("#loginBtn");
  const logoutBtn = modal.querySelector("#logoutBtn");
  const exportBtn = modal.querySelector("#exportBtn");
  const importBtn = modal.querySelector("#importBtn");
  const reloadBtn = modal.querySelector("#reloadBtn");
  const themeBtn = modal.querySelector("#themeBtn");
  const codesBtn = modal.querySelector("#codesBtn");
  const resetBtn = modal.querySelector("#resetBtn");

  const closeSecondBtn = modalSecond.querySelector("#closeSettingsSecondBtn");
  const secondBody = modalSecond.querySelector("#settingsSecondBody");
  const secondTitle = modalSecond.querySelector("#settingsSecondTitle");

  // --- open / close helpers that reuse existing modal classes/styles ---
  function openModal(m) {
    m.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }
  function closeModal(m) {
    m.setAttribute("aria-hidden", "true");
    const anyOpen = Array.from(document.querySelectorAll(".modal")).some(x => x.getAttribute("aria-hidden") === "false");
    if (!anyOpen) document.body.classList.remove("modal-open");
  }

  // --- Render dynamique du contenu principal ---
  function renderSettingsBody() {
    const logged = !!state.user;
    loginBtn.disabled = logged;
    logoutBtn.disabled = !logged;
    acctLabelEl.textContent = logged ? (state.user.name || "utilisateur") : "Non connecté";
  }

  // --- Crypto helpers (PBKDF2 + AES-GCM) ---
  async function deriveKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 150000, hash: "SHA-256" }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  }

  async function encryptJSON(obj, password) {
    const enc = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKey(password, salt);
    const data = enc.encode(JSON.stringify(obj));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
    const payload = { v: 1, salt: Array.from(salt), iv: Array.from(iv), ct: Array.from(new Uint8Array(ct)) };
    return btoa(JSON.stringify(payload));
  }

  async function decryptJSON(b64, password) {
    const raw = atob(b64);
    const payload = JSON.parse(raw);
    if (!payload || !payload.salt || !payload.iv || !payload.ct) throw new Error("payload invalid");
    const salt = new Uint8Array(payload.salt);
    const iv = new Uint8Array(payload.iv);
    const ct = new Uint8Array(payload.ct);
    const key = await deriveKey(password, salt);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
    const dec = new TextDecoder().decode(pt);
    return JSON.parse(dec);
  }

  // --- Actions ---
  function onLogin() {
    state.user = { name: "Player" };
    save();
    renderMain();
    renderSettingsBody();
    alert("Connecté (simulé)");
  }

  function onLogout() {
    state.user = null;
    save();
    renderMain();
    renderSettingsBody();
  }

  async function onExport() {
    secondTitle.textContent = "Exporter (chiffré)";
    secondBody.innerHTML = `
      <div class="section">
        <div style="text-align:center;margin-bottom:8px">Entrez un mot de passe pour chiffrer l'export</div>
        <div style="display:flex;justify-content:center;gap:8px">
          <input id="exportPwd" type="password" placeholder="Mot de passe" style="border-radius:10px;padding:10px;border:1px solid var(--border);background:transparent;color:var(--fg)" />
          <button id="doExportBtn" class="item-btn">Générer</button>
        </div>
        <div id="exportOutput" style="margin-top:12px;word-break:break-all;max-height:200px;overflow:auto"></div>
      </div>
    `;
    openModal(modalSecond);

    const doExportBtn = secondBody.querySelector("#doExportBtn");
    const exportPwd = secondBody.querySelector("#exportPwd");
    const exportOutput = secondBody.querySelector("#exportOutput");

    doExportBtn.addEventListener("click", async function handleExport() {
      const pwd = exportPwd.value || "";
      if (!pwd) return alert("Mot de passe requis");
      try {
        const blob = await encryptJSON(state, pwd);
        exportOutput.textContent = blob;
        try { await navigator.clipboard.writeText(blob); } catch (_) {}
      } catch (err) {
        console.error(err);
        alert("Erreur lors de l'export chiffré");
      } finally {
        doExportBtn.removeEventListener("click", handleExport);
      }
    }, { once: true });
  }

  async function onImport() {
    secondTitle.textContent = "Importer (chiffré)";
    secondBody.innerHTML = `
      <div class="section">
        <div style="text-align:center;margin-bottom:8px">Collez l'export chiffré et entrez le mot de passe</div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
          <textarea id="importData" rows="6" style="width:90%;border-radius:10px;padding:10px;border:1px solid var(--border);background:transparent;color:var(--fg)"></textarea>
          <input id="importPwd" type="password" placeholder="Mot de passe" style="border-radius:10px;padding:10px;border:1px solid var(--border);background:transparent;color:var(--fg);width:60%" />
          <div style="display:flex;gap:8px">
            <button id="doImportBtn" class="item-btn">Importer</button>
            <button id="testDecryptBtn" class="item-btn">Tester</button>
          </div>
        </div>
      </div>
    `;
    openModal(modalSecond);

    const doImportBtn = secondBody.querySelector("#doImportBtn");
    const testDecryptBtn = secondBody.querySelector("#testDecryptBtn");

    doImportBtn.addEventListener("click", async function handleImport() {
      const raw = secondBody.querySelector("#importData").value.trim();
      const pwd = secondBody.querySelector("#importPwd").value || "";
      if (!raw || !pwd) return alert("Données et mot de passe requis");
      try {
        const parsed = await decryptJSON(raw, pwd);
        Object.keys(state).forEach(k => { if (Object.prototype.hasOwnProperty.call(parsed, k)) state[k] = parsed[k]; });
        save();
        renderMain();
        alert("Import réussi");
        closeModal(modalSecond);
      } catch (err) {
        console.error(err);
        alert("Import échoué : mot de passe invalide ou fichier corrompu");
      } finally {
        doImportBtn.removeEventListener("click", handleImport);
      }
    }, { once: true });

    testDecryptBtn.addEventListener("click", async function handleTest() {
      const raw = secondBody.querySelector("#importData").value.trim();
      const pwd = secondBody.querySelector("#importPwd").value || "";
      if (!raw || !pwd) return alert("Données et mot de passe requis");
      try {
        await decryptJSON(raw, pwd);
        alert("Déchiffrement OK");
      } catch (err) {
        alert("Échec du déchiffrement");
      } finally {
        testDecryptBtn.removeEventListener("click", handleTest);
      }
    }, { once: true });
  }

  function onReload() {
    save();
    location.reload();
  }

  function onToggleTheme() {
    state.theme = state.theme === "dark" ? "light" : "dark";
    save();
    renderMain();
  }

  function onEnterCode() {
    secondTitle.textContent = "Entrer un code";
    secondBody.innerHTML = `
      <div class="section">
        <div style="text-align:center;margin-bottom:8px">Entrez votre code</div>
        <div style="display:flex;gap:8px;justify-content:center">
          <input id="codeInput" type="text" placeholder="Code" style="border-radius:10px;padding:10px;border:1px solid var(--border);background:transparent;color:var(--fg)" />
          <button id="applyCodeBtn" class="item-btn">Appliquer</button>
        </div>
      </div>
    `;
    openModal(modalSecond);

    const applyCodeBtn = secondBody.querySelector("#applyCodeBtn");
    applyCodeBtn.addEventListener("click", () => {
      const code = secondBody.querySelector("#codeInput").value || "";
      if (!code) return;
      const norm = code.trim().toUpperCase();
      if (norm === "BONUS") {
        state.points = (state.points || 0) + 1_000_000;
        save();
        renderMain();
        alert("Code appliqué : +1 000 000 points");
      } else {
        alert("Code invalide");
      }
      closeModal(modalSecond);
    }, { once: true });
  }

  function onReset() {
    const ok = confirm("Reset total : toutes les données locales seront perdues. Continuer ?");
    if (!ok) return;
    try {
      const prefixes = ["clicker", "shop", "state"];
      Object.keys(localStorage).forEach(k => { if (prefixes.some(p => k.startsWith(p))) localStorage.removeItem(k); });
    } catch (err) {
      console.warn("Erreur lors du nettoyage localStorage", err);
    }
    location.reload();
  }

  // --- Safe listener helper ---
  function safeListen(el, ev, fn) {
    if (!el) return;
    el.removeEventListener(ev, fn);
    el.addEventListener(ev, fn);
  }

  safeListen(settingsBtn, "click", () => { renderSettingsBody(); openModal(modal); });
  safeListen(closeSettingsBtn, "click", () => closeModal(modal));
  safeListen(loginBtn, "click", onLogin);
  safeListen(logoutBtn, "click", onLogout);
  safeListen(exportBtn, "click", onExport);
  safeListen(importBtn, "click", onImport);
  safeListen(reloadBtn, "click", onReload);
  safeListen(themeBtn, "click", onToggleTheme);
  safeListen(codesBtn, "click", onEnterCode);
  safeListen(resetBtn, "click", onReset);

  safeListen(closeSecondBtn, "click", () => closeModal(modalSecond));
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(modal); });
  modalSecond.addEventListener("click", (e) => { if (e.target === modalSecond) closeModal(modalSecond); });

  function onKeydown(e) {
    if (e.key === "Escape") {
      if (modalSecond.getAttribute("aria-hidden") === "false") closeModal(modalSecond);
      else if (modal.getAttribute("aria-hidden") === "false") closeModal(modal);
    }
  }
  document.removeEventListener("keydown", onKeydown);
  document.addEventListener("keydown", onKeydown);

  // initial render
  renderSettingsBody();
}
