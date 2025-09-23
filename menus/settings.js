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

  // --- Créer / récupérer modal secondaire ---
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

  // --- HTML modal principal ---
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
          </div>
        </section>

        <section class="section">
          <h3 class="section-title" style="text-align:center">Codes</h3>
          <div style="display:flex;gap:8px;justify-content:center;margin-top:8px">
            <button id="codesBtn" class="btn btn-primary btn-codes">💳 Entrer un code</button>
          </div>
        </section>

        <hr style="margin:20px 0;border:0;border-top:1px solid var(--border)" />
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

  // --- Style spécial zone texte "copilot like" ---
  if (!document.getElementById("settings-modal-style")) {
    const style = document.createElement("style");
    style.id = "settings-modal-style";
    style.textContent = `
      .copilot-box {
        position:relative;
        background:rgba(0,0,0,0.4);
        border:1px solid var(--border);
        border-radius:10px;
        padding-top:32px;
        padding:10px;
      }
      .copilot-box button.copy-btn {
        position:absolute;
        top:4px;
        left:4px;
        font-size:12px;
        padding:4px 8px;
        border-radius:6px;
        cursor:pointer;
      }
      .copilot-box textarea {
        width:100%;
        border:none;
        outline:none;
        background:transparent;
        color:var(--fg);
        resize:none;
      }
    `;
    document.head.appendChild(style);
  }

  // --- Refs DOM ---
  const closeSettingsBtn = modal.querySelector("#closeSettingsBtn");
  const acctLabelEl = modal.querySelector("#acctLabel");
  const loginBtn = modal.querySelector("#loginBtn");
  const logoutBtn = modal.querySelector("#logoutBtn");
  const exportBtn = modal.querySelector("#exportBtn");
  const importBtn = modal.querySelector("#importBtn");
  const codesBtn = modal.querySelector("#codesBtn");
  const resetBtn = modal.querySelector("#resetBtn");

  const closeSecondBtn = modalSecond.querySelector("#closeSettingsSecondBtn");
  const secondBody = modalSecond.querySelector("#settingsSecondBody");
  const secondTitle = modalSecond.querySelector("#settingsSecondTitle");

  // --- open / close helpers ---
  function openModal(m) {
    m.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }
  function closeModal(m) {
    m.setAttribute("aria-hidden", "true");
    const anyOpen = Array.from(document.querySelectorAll(".modal")).some(x => x.getAttribute("aria-hidden") === "false");
    if (!anyOpen) document.body.classList.remove("modal-open");
  }

  // --- Render dynamique ---
  function renderSettingsBody() {
    const logged = !!state.user;
    loginBtn.disabled = logged;
    logoutBtn.disabled = !logged;
    acctLabelEl.textContent = logged ? (state.user.name || "utilisateur") : "Non connecté";
  }

  // --- Crypto helpers ---
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
    const salt = new Uint8Array(payload.salt);
    const iv = new Uint8Array(payload.iv);
    const ct = new Uint8Array(payload.ct);
    const key = await deriveKey(password, salt);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
    return JSON.parse(new TextDecoder().decode(pt));
  }

  // --- Actions ---
  async function onExport() {
    secondTitle.textContent = "Exporter (chiffré)";
    secondBody.innerHTML = `
      <div class="section">
        <div style="text-align:center;margin-bottom:8px">Mot de passe pour chiffrer l'export</div>
        <div style="display:flex;justify-content:center;gap:8px">
          <input id="exportPwd" type="password" placeholder="Mot de passe" style="border-radius:10px;padding:10px;border:1px solid var(--border);background:transparent;color:var(--fg)" />
          <button id="doExportBtn" class="item-btn">Générer</button>
        </div>
        <div id="exportOutput" style="margin-top:12px"></div>
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
        exportOutput.innerHTML = `
          <div class="copilot-box">
            <button class="copy-btn">Copier</button>
            <textarea rows="6" readonly>${blob}</textarea>
          </div>
          <div style="text-align:center;margin-top:8px">
            <button id="saveExportBtn" class="item-btn">Enregistrer</button>
          </div>
        `;
        const copyBtn = exportOutput.querySelector(".copy-btn");
        copyBtn.addEventListener("click", () => navigator.clipboard.writeText(blob));

        const saveBtn = exportOutput.querySelector("#saveExportBtn");
        saveBtn.addEventListener("click", () => {
          const now = new Date();
          const name = now.toISOString().replace(/[:T]/g,"-").slice(0,16) + "-clicker-export.txt";
          const a = document.createElement("a");
          a.href = URL.createObjectURL(new Blob([blob], {type:"text/plain"}));
          a.download = name;
          a.click();
        });
      } catch (err) {
        alert("Erreur lors de l'export");
      }
    }, { once: true });
  }

  async function onImport() {
    secondTitle.textContent = "Importer (chiffré)";
    secondBody.innerHTML = `
      <div class="section">
        <div style="text-align:center;margin-bottom:8px">Fichier ou collez votre export</div>
        <input id="importFile" type="file" accept=".txt" style="margin-bottom:8px" />
        <div class="copilot-box">
          <button class="copy-btn">Coller</button>
          <textarea id="importData" rows="6"></textarea>
        </div>
        <input id="importPwd" type="password" placeholder="Mot de passe" style="margin-top:8px;border-radius:10px;padding:10px;border:1px solid var(--border);background:transparent;color:var(--fg);width:60%" />
        <div style="text-align:center;margin-top:8px">
          <button id="doImportBtn" class="item-btn">Importer</button>
        </div>
      </div>
    `;
    openModal(modalSecond);

    const copyBtn = secondBody.querySelector(".copy-btn");
    const importData = secondBody.querySelector("#importData");
    copyBtn.addEventListener("click", async () => {
      try { importData.value = await navigator.clipboard.readText(); } catch {}
    });

    const importFile = secondBody.querySelector("#importFile");
    importFile.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (file) {
        const txt = await file.text();
        importData.value = txt;
      }
    });

    const doImportBtn = secondBody.querySelector("#doImportBtn");
    doImportBtn.addEventListener("click", async () => {
      const raw = importData.value.trim();
      const pwd = secondBody.querySelector("#importPwd").value || "";
      if (!raw || !pwd) return alert("Données et mot de passe requis");
      try {
        const parsed = await decryptJSON(raw, pwd);
        Object.assign(state, parsed);
        save();
        renderMain();
        alert("Import réussi");
        closeModal(modalSecond);
      } catch {
        alert("Import échoué");
      }
    });
  }

  function onLogin() { state.user = { name:"Player" }; save(); renderMain(); renderSettingsBody(); }
  function onLogout() { state.user = null; save(); renderMain(); renderSettingsBody(); }
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
    secondBody.querySelector("#applyCodeBtn").addEventListener("click", () => {
      const code = secondBody.querySelector("#codeInput").value.trim().toUpperCase();
      if (code === "BONUS") {
        state.points = (state.points || 0) + 1_000_000;
        save(); renderMain(); alert("+1 000 000 points");
      } else alert("Code invalide");
      closeModal(modalSecond);
    }, { once:true });
  }
  function onReset() { if(confirm("Reset total ?")) { localStorage.clear(); location.reload(); } }

  // --- Safe listener ---
  function safeListen(el, ev, fn) { if(el){ el.removeEventListener(ev, fn); el.addEventListener(ev, fn); } }
  safeListen(settingsBtn,"click",()=>{ renderSettingsBody(); openModal(modal); });
  safeListen(closeSettingsBtn,"click",()=>closeModal(modal));
  safeListen(loginBtn,"click",onLogin);
  safeListen(logoutBtn,"click",onLogout);
  safeListen(exportBtn,"click",onExport);
  safeListen(importBtn,"click",onImport);
  safeListen(codesBtn,"click",onEnterCode);
  safeListen(resetBtn,"click",onReset);

  safeListen(closeSecondBtn,"click",()=>closeModal(modalSecond));
  modal.addEventListener("click",(e)=>{ if(e.target===modal) closeModal(modal); });
  modalSecond.addEventListener("click",(e)=>{ if(e.target===modalSecond) closeModal(modalSecond); });
  document.addEventListener("keydown",(e)=>{ if(e.key==="Escape"){ if(modalSecond.getAttribute("aria-hidden")==="false") closeModal(modalSecond); else if(modal.getAttribute("aria-hidden")==="false") closeModal(modal);} });

  renderSettingsBody();
}
