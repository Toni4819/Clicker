// initSettings.js
export function initSettings({ els, state, save, renderMain }) {
  const settingsBtn = els.settingsBtn;
  if (!settingsBtn) {
    console.error("initSettings : #settingsBtn introuvable");
    return;
  }

  // --- Création / récupération de la modale principale (settings) ---
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

  // --- Création / récupération de la modale secondaire (codes / import-export) ---
  let secondaryModal = els.settingsSecondaryModal;
  if (!secondaryModal) {
    secondaryModal = document.createElement("div");
    secondaryModal.id = "settingsSecondaryModal";
    secondaryModal.className = "modal";
    secondaryModal.setAttribute("aria-hidden", "true");
    secondaryModal.setAttribute("role", "dialog");
    secondaryModal.setAttribute("aria-labelledby", "settingsSecondaryTitle");
    document.body.append(secondaryModal);
    els.settingsSecondaryModal = secondaryModal;
  }

  // --- Inner HTML main modal (uniformisé comme initShop) ---
  modal.innerHTML = `
    <div class="modal-content">
      <header class="modal-header">
        <h2 id="settingsTitle">⚙️ Paramètres</h2>
        <button class="close-btn" aria-label="Fermer">✕</button>
      </header>

      <div class="modal-body" id="settingsBody">

        <div class="section">
          <h3 class="center">Compte <span id="acctStatus">(<span id="acctState">Non connecté</span>)</span></h3>
          <div class="row center">
            <button class="btn btn-primary" id="loginBtn">🔐 Se connecter</button>
            <button class="btn btn-primary" id="logoutBtn">🔓 Se déconnecter</button>
          </div>
        </div>

        <div class="section">
          <h3 class="center">Données</h3>
          <div class="row center">
            <button class="btn btn-primary" id="exportBtn">📤 Exporter (chiffré)</button>
            <button class="btn btn-primary" id="importBtn">📥 Importer (chiffré)</button>
            <button class="btn btn-primary" id="reloadBtn">🔄 Recharger</button>
          </div>
        </div>

        <div class="section">
          <h3 class="center">Apparence</h3>
          <div class="row center">
            <button class="btn btn-primary" id="themeBtn">🌗 Basculer thème</button>
          </div>
        </div>

        <div class="section">
          <h3 class="center">Codes</h3>
          <div class="row center">
            <button class="btn btn-primary" id="codesBtn">💳 Entrer un code</button>
          </div>
        </div>

        <div class="section footer-center">
          <button class="btn btn-reset" id="resetBtn">↺ Reset total</button>
        </div>

      </div>
    </div>
  `;

  // --- Inner HTML secondary modal (reused for codes / import / export forms) ---
  secondaryModal.innerHTML = `
    <div class="modal-content">
      <header class="modal-header">
        <h2 id="settingsSecondaryTitle">⚙️ Action</h2>
        <button class="close-btn" aria-label="Fermer">✕</button>
      </header>
      <div class="modal-body" id="settingsSecondaryBody">
        <!-- Content injected dynamically -->
      </div>
    </div>
  `;

  const body = modal.querySelector("#settingsBody");
  const closeBtn = modal.querySelector(".close-btn");

  // --- Styles uniformisés (boutons #0e1117) ---
  if (!document.getElementById("settings-modal-styles")) {
    const style = document.createElement("style");
    style.id = "settings-modal-styles";
    style.textContent = `
      /* modal baseline similar to shop */
      .modal { position: fixed; inset: 0; display: none; align-items: center; justify-content: center; z-index: 1000; background: rgba(0,0,0,0.45); }
      .modal[aria-hidden="false"] { display: flex; }
      .modal .modal-content { width: 92%; max-width: 760px; margin: 4vh auto; padding: 16px; border-radius: 10px; background: #0f1318; color: #e6eef8; box-shadow: 0 10px 30px rgba(0,0,0,0.6); position: relative; }
      .modal .modal-header { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px; }
      .modal h2 { margin:0; font-weight:700; color:#f5f8fb; text-align:center; width:100%; }
      .modal h3 { margin:0; font-weight:600; color:#f5f8fb; }
      .modal .modal-body { display:flex; flex-direction:column; gap:12px; }
      .modal .section { background: rgba(255,255,255,0.02); padding:12px; border-radius:8px; }
      .modal .row { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; justify-content:center; }
      .modal .center { text-align:center; display:block; }
      .footer-center { display:flex; justify-content:center; margin-top:8px; }

      /* Buttons */
      .btn { background-color: #0e1117; color: #ffffff; border: 1px solid rgba(255,255,255,0.04); padding: 10px 14px; border-radius: 8px; cursor: pointer; font-size:15px; transition: transform 0.08s ease, background-color 0.12s, opacity 0.12s; }
      .btn:hover { transform: translateY(-1px); background-color: #14161a; }
      .btn:active { transform: translateY(0); }
      .btn[disabled] { opacity:0.45; cursor:not-allowed; transform:none; }
      .btn-reset { background: linear-gradient(180deg,#6b0b0b,#a71b1b); color:#fff; border:none; padding:10px 18px; }

      .close-btn { background: transparent; border: none; color: #cbd6e8; font-size:18px; cursor:pointer; }
      /* ensure modal content sits above overlay; fix opacity oddities if reset button was outside */
      body.modal-open { overflow: hidden; }
      @media (max-width:560px) {
        .modal .modal-content { margin: 4vh 8px; padding: 12px; }
        .btn { font-size:14px; padding: 8px 12px; }
      }
    `;
    document.head.appendChild(style);
  }

  // --- Refs for buttons ---
  const loginBtn = modal.querySelector("#loginBtn");
  const logoutBtn = modal.querySelector("#logoutBtn");
  const exportBtn = modal.querySelector("#exportBtn");
  const importBtn = modal.querySelector("#importBtn");
  const reloadBtn = modal.querySelector("#reloadBtn");
  const themeBtn = modal.querySelector("#themeBtn");
  const codesBtn = modal.querySelector("#codesBtn");
  const resetBtn = modal.querySelector("#resetBtn");
  const acctStateEl = modal.querySelector("#acctState");

  // --- Secondary modal refs ---
  const secondaryCloseBtn = secondaryModal.querySelector(".close-btn");
  const secondaryBody = secondaryModal.querySelector("#settingsSecondaryBody");
  const secondaryTitle = secondaryModal.querySelector("#settingsSecondaryTitle");

  // --- Open / Close handlers ---
  function openModal(m) {
    m.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }
  function closeModal(m) {
    m.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  // --- Render dynamic main body (account status etc) ---
  function renderSettingsBody() {
    const logged = !!state.user;
    loginBtn.disabled = logged;
    logoutBtn.disabled = !logged;
    acctStateEl.textContent = logged ? (state.user.name || "utilisateur") : "Non connecté";
  }

  // --- Utility: Web Crypto helpers for AES-GCM (PBKDF2 -> AES-GCM) ---
  async function deriveKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 150000, hash: "SHA-256" },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );
  }

  async function encryptJSON(obj, password) {
    const enc = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKey(password, salt);
    const data = enc.encode(JSON.stringify(obj));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
    const payload = {
      v: 1,
      salt: Array.from(salt),
      iv: Array.from(iv),
      ct: Array.from(new Uint8Array(ct)),
    };
    return btoa(JSON.stringify(payload));
  }

  async function decryptJSON(b64, password) {
    try {
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
    } catch (err) {
      throw new Error("Déchiffrement échoué");
    }
  }

  // --- Actions ---
  async function onExport() {
    // open secondary modal with password prompt and export button
    secondaryTitle.textContent = "Exporter (chiffré)";
    secondaryBody.innerHTML = `
      <div class="section">
        <label class="center">Mot de passe pour chiffrer l'export</label>
        <div class="row center">
          <input id="exportPwd" type="password" placeholder="Mot de passe" style="padding:8px;border-radius:6px;border:1px solid rgba(255,255,255,0.06);width:60%;" />
        </div>
        <div class="row center" style="margin-top:12px;">
          <button class="btn btn-primary" id="doExportBtn">📤 Générer l'export</button>
        </div>
        <div id="exportResult" style="margin-top:10px;word-break:break-all;"></div>
      </div>
    `;
    openModal(secondaryModal);

    const doExportBtn = secondaryBody.querySelector("#doExportBtn");
    doExportBtn.addEventListener("click", async () => {
      const pwd = secondaryBody.querySelector("#exportPwd").value || "";
      if (!pwd) return alert("Mot de passe requis");
      try {
        const exported = await encryptJSON(state, pwd);
        const outEl = secondaryBody.querySelector("#exportResult");
        outEl.textContent = exported;
        // try copy to clipboard
        if (navigator.clipboard && navigator.clipboard.writeText) {
          try { await navigator.clipboard.writeText(exported); } catch (_) {}
        }
      } catch (err) {
        console.error(err);
        alert("Erreur lors de l'export chiffré");
      }
    });
  }

  async function onImport() {
    // open secondary modal with password + paste area
    secondaryTitle.textContent = "Importer (chiffré)";
    secondaryBody.innerHTML = `
      <div class="section">
        <label class="center">Collez l'export chiffré et entrez le mot de passe</label>
        <div class="row center">
          <textarea id="importData" rows="6" placeholder="Chaîne d'export" style="width:80%;padding:8px;border-radius:6px;border:1px solid rgba(255,255,255,0.06)"></textarea>
        </div>
        <div class="row center">
          <input id="importPwd" type="password" placeholder="Mot de passe" style="padding:8px;border-radius:6px;border:1px solid rgba(255,255,255,0.06);width:60%;" />
        </div>
        <div class="row center" style="margin-top:12px;">
          <button class="btn btn-primary" id="doImportBtn">📥 Importer</button>
        </div>
      </div>
    `;
    openModal(secondaryModal);

    const doImportBtn = secondaryBody.querySelector("#doImportBtn");
    doImportBtn.addEventListener("click", async () => {
      const data = secondaryBody.querySelector("#importData").value || "";
      const pwd = secondaryBody.querySelector("#importPwd").value || "";
      if (!data || !pwd) return alert("Données et mot de passe requis");
      try {
        const parsed = await decryptJSON(data.trim(), pwd);
        // merge safe: only allowed keys (example approach)
        const allowedKeys = Object.keys(state);
        allowedKeys.forEach(k => {
          if (Object.prototype.hasOwnProperty.call(parsed, k)) state[k] = parsed[k];
        });
        save();
        renderMain();
        alert("Import réussi");
        closeModal(secondaryModal);
      } catch (err) {
        console.error(err);
        alert("Import échoué : mot de passe invalide ou fichier corrompu");
      }
    });
  }

  function onLogin() {
    // Placeholder: real auth flow goes here
    state.user = { name: "Player" };
    save();
    renderMain();
    renderSettingsBody();
  }

  function onLogout() {
    state.user = null;
    save();
    renderMain();
    renderSettingsBody();
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
    // Use secondary modal for codes
    secondaryTitle.textContent = "Entrer un code";
    secondaryBody.innerHTML = `
      <div class="section">
        <label class="center">Entrez votre code</label>
        <div class="row center">
          <input id="codeInput" type="text" placeholder="Code" style="padding:8px;border-radius:6px;border:1px solid rgba(255,255,255,0.06);width:60%;" />
        </div>
        <div class="row center" style="margin-top:12px;">
          <button class="btn btn-primary" id="applyCodeBtn">Appliquer</button>
        </div>
      </div>
    `;
    openModal(secondaryModal);

    const applyCodeBtn = secondaryBody.querySelector("#applyCodeBtn");
    applyCodeBtn.addEventListener("click", () => {
      const code = secondaryBody.querySelector("#codeInput").value || "";
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
      closeModal(secondaryModal);
    });
  }

  function onReset() {
    const ok = confirm("Reset total : toutes les données locales seront perdues. Continuer ?");
    if (!ok) return;
    try {
      // conservative clear: remove known keys; adjust to your app prefixes
      const prefixes = ["clicker", "shop", "state"];
      Object.keys(localStorage).forEach(k => {
        if (prefixes.some(p => k.startsWith(p))) localStorage.removeItem(k);
      });
    } catch (err) {
      console.warn("Erreur lors du nettoyage localStorage", err);
    }
    // reload to ensure clean state
    location.reload();
  }

  // --- Safe listener helper (prevent duplicate attaches) ---
  function safeListen(el, ev, fn) {
    if (!el) return;
    el.removeEventListener(ev, fn);
    el.addEventListener(ev, fn);
  }

  // --- Attach listeners ---
  safeListen(settingsBtn, "click", () => { renderSettingsBody(); openModal(modal); });
  safeListen(closeBtn, "click", () => closeModal(modal));
  safeListen(loginBtn, "click", onLogin);
  safeListen(logoutBtn, "click", onLogout);
  safeListen(exportBtn, "click", onExport);
  safeListen(importBtn, "click", onImport);
  safeListen(reloadBtn, "click", onReload);
  safeListen(themeBtn, "click", onToggleTheme);
  safeListen(codesBtn, "click", onEnterCode);
  safeListen(resetBtn, "click", onReset);

  // Secondary modal listeners
  safeListen(secondaryCloseBtn, "click", () => closeModal(secondaryModal));
  secondaryModal.addEventListener("click", e => { if (e.target === secondaryModal) closeModal(secondaryModal); });

  // Close on backdrop click for main modal
  modal.addEventListener("click", e => { if (e.target === modal) closeModal(modal); });

  // ESC to close either modal
  function onKeydown(e) {
    if (e.key === "Escape") {
      if (secondaryModal.getAttribute("aria-hidden") === "false") closeModal(secondaryModal);
      else if (modal.getAttribute("aria-hidden") === "false") closeModal(modal);
    }
  }
  document.removeEventListener("keydown", onKeydown);
  document.addEventListener("keydown", onKeydown);

  // initial render
  renderSettingsBody();
}
