export function initSettings({ els, state, save, renderMain }) {
  const settingsBtn = els.settingsBtn;
  if (!settingsBtn) {
    console.error("initSettings : #settingsBtn introuvable");
    return;
  }

  // --- Création / récupération de la modale ---
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

  modal.innerHTML = `
    <div class="modal-content">
      <header class="modal-header">
        <h2 id="settingsTitle">⚙️ Paramètres</h2>
        <button class="close-btn" aria-label="Fermer">✕</button>
      </header>

      <div class="modal-body" id="settingsBody">
        <div class="section">
          <h3>Compte</h3>
          <div class="row">
            <button class="btn btn-primary" id="loginBtn">🔐 Se connecter</button>
            <button class="btn btn-primary" id="logoutBtn">🔓 Se déconnecter</button>
          </div>
        </div>

        <div class="section">
          <h3>Données</h3>
          <div class="row">
            <button class="btn btn-primary" id="exportBtn">📤 Exporter</button>
            <button class="btn btn-primary" id="importBtn">📥 Importer</button>
            <button class="btn btn-primary" id="reloadBtn">🔄 Recharger</button>
          </div>
        </div>

        <div class="section">
          <h3>Apparence</h3>
          <div class="row">
            <button class="btn btn-primary" id="themeBtn">🌗 Basculer thème</button>
          </div>
        </div>

        <div class="section">
          <h3>Codes</h3>
          <div class="row">
            <button class="btn btn-primary" id="codesBtn">💳 Entrer un code</button>
          </div>
        </div>

        <div class="section footer">
          <button class="btn btn-reset" id="resetBtn">↺ Reset total</button>
        </div>
      </div>
    </div>
  `;

  const body = modal.querySelector("#settingsBody");
  const closeBtn = modal.querySelector(".close-btn");

  // --- Styles uniformisés (couleur boutons #0e1117) ---
  if (!document.getElementById("settings-modal-styles")) {
    const style = document.createElement("style");
    style.id = "settings-modal-styles";
    style.textContent = `
      /* Modal baseline (assume .modal and .modal-open handled globally) */
      #settingsModal .modal-content { max-width: 760px; margin: 6vh auto; padding: 16px; border-radius: 10px; background: #0f1318; color: #e6eef8; box-shadow: 0 10px 30px rgba(0,0,0,0.6); }
      #settingsModal .modal-header { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px; }
      #settingsModal h2, #settingsModal h3 { margin:0; font-weight:700; color: #f5f8fb; }
      #settingsModal .modal-body { display:flex; flex-direction:column; gap:14px; }
      #settingsModal .section { background: rgba(255,255,255,0.02); padding:12px; border-radius:8px; }
      #settingsModal .row { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }
      #settingsModal .btn { background-color: #0e1117; color: #ffffff; border: 1px solid rgba(255,255,255,0.04); padding: 8px 12px; border-radius: 8px; cursor: pointer; font-size:14px; transition: transform 0.08s ease, background-color 0.12s; }
      #settingsModal .btn:hover { transform: translateY(-1px); background-color: #14161a; }
      #settingsModal .btn:active { transform: translateY(0); }
      #settingsModal .btn[disabled] { opacity:0.45; cursor: not-allowed; transform: none; }
      #settingsModal .btn-reset { background: linear-gradient(180deg,#6b0b0b,#a71b1b); color: #fff; border: none; }
      #settingsModal .close-btn { background: transparent; border: none; color: #cbd6e8; font-size:18px; cursor:pointer; }
      @media (max-width: 560px) {
        #settingsModal .modal-content { margin: 4vh 10px; padding: 12px; }
        #settingsModal .row { gap:6px; }
      }
    `;
    document.head.appendChild(style);
  }

  // --- Références DOM pour listeners ---
  const loginBtn = modal.querySelector("#loginBtn");
  const logoutBtn = modal.querySelector("#logoutBtn");
  const exportBtn = modal.querySelector("#exportBtn");
  const importBtn = modal.querySelector("#importBtn");
  const reloadBtn = modal.querySelector("#reloadBtn");
  const themeBtn = modal.querySelector("#themeBtn");
  const codesBtn = modal.querySelector("#codesBtn");
  const resetBtn = modal.querySelector("#resetBtn");

  // --- Ouverture / fermeture ---
  function openSettings() {
    renderSettingsBody();
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function closeSettings() {
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  // --- Render dynamique du contenu si besoin ---
  function renderSettingsBody() {
    // Exemple : afficher état connecté/déconnecté et activer/désactiver boutons
    const logged = !!state.user;
    loginBtn.disabled = logged;
    logoutBtn.disabled = !logged;
    // Export/Import/Reload are always enabled but can be disabled depending on state
    exportBtn.disabled = false;
    importBtn.disabled = false;
    reloadBtn.disabled = false;
    themeBtn.disabled = false;
    codesBtn.disabled = false;

    // Optionally add small status element
    const existingStatus = body.querySelector(".status-line");
    if (!existingStatus) {
      const status = document.createElement("div");
      status.className = "status-line";
      status.style.opacity = "0.85";
      status.style.fontSize = "13px";
      status.textContent = logged ? `Connecté en tant que ${state.user.name || "utilisateur"}` : "Non connecté";
      body.prepend(status);
    } else {
      existingStatus.textContent = logged ? `Connecté en tant que ${state.user.name || "utilisateur"}` : "Non connecté";
    }
  }

  // --- Actions (logique minimale, extensible) ---
  function onLogin() {
    // placeholder logique de connexion
    console.log("login demandé");
    // simulate change
    state.user = { name: "Player" };
    save();
    renderMain();
    renderSettingsBody();
  }

  function onLogout() {
    console.log("logout demandé");
    state.user = null;
    save();
    renderMain();
    renderSettingsBody();
  }

  function onExport() {
    try {
      const dump = JSON.stringify(state);
      // minimal: copy to clipboard if available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(dump).then(() => {
          console.log("Données copiées dans le presse-papiers");
        }).catch(() => {
          console.log("Impossible de copier, voici la sortie:", dump);
        });
      } else {
        console.log("Export:", dump);
      }
    } catch (err) {
      console.error("Erreur export:", err);
    }
  }

  function onImport() {
    const payload = prompt("Collez l'export JSON ici");
    if (!payload) return;
    try {
      const parsed = JSON.parse(payload);
      // merge minimalement et sauvegarder
      Object.assign(state, parsed);
      save();
      renderMain();
      console.log("Import réussi");
    } catch (err) {
      console.error("Import invalide", err);
      alert("Import invalide. Vérifiez le JSON.");
    }
  }

  function onReload() {
    // technique de reload sans perdre dev tools: appel save puis location.reload
    save();
    location.reload();
  }

  function onToggleTheme() {
    // bascule simple theme dark/light stocké dans state.theme
    state.theme = state.theme === "dark" ? "light" : "dark";
    save();
    renderMain();
    console.log("Thème basculé vers", state.theme);
  }

  function onEnterCode() {
    const code = prompt("Entrez votre code");
    if (!code) return;
    // placeholder : traiter code
    console.log("Code entré:", code);
    // exemple simple : si code === "BONUS" ajouter points
    if (code.trim().toUpperCase() === "BONUS") {
      state.points = (state.points || 0) + 1_000_000;
      save();
      renderMain();
      alert("Code appliqué : +1 000 000 points");
    } else {
      alert("Code invalide");
    }
  }

  function onReset() {
    const ok = confirm("Reset total : toutes les données locales seront perdues. Continuer ?");
    if (!ok) return;
    // reset minimal : clear localStorage keys used by the app
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith("clicker") || k.startsWith("shop") || k === "state") localStorage.removeItem(k);
      });
    } catch (err) {
      console.warn("Erreur lors du nettoyage localStorage", err);
    }
    // reset state in memory
    if (typeof window !== "undefined") {
      if (window.location) window.location.reload();
    }
  }

  // --- Attach listeners (dé-duplicate to avoid double attach) ---
  function safeListen(el, ev, fn) {
    if (!el) return;
    el.removeEventListener(ev, fn);
    el.addEventListener(ev, fn);
  }

  safeListen(settingsBtn, "click", openSettings);
  safeListen(closeBtn, "click", closeSettings);
  safeListen(loginBtn, "click", onLogin);
  safeListen(logoutBtn, "click", onLogout);
  safeListen(exportBtn, "click", onExport);
  safeListen(importBtn, "click", onImport);
  safeListen(reloadBtn, "click", onReload);
  safeListen(themeBtn, "click", onToggleTheme);
  safeListen(codesBtn, "click", onEnterCode);
  safeListen(resetBtn, "click", onReset);

  // close on backdrop click
  modal.addEventListener("click", e => {
    if (e.target === modal) closeSettings();
  });

  // accessibility : ESC to close when modal open
  function onKeydown(e) {
    if (e.key === "Escape" && modal.getAttribute("aria-hidden") === "false") {
      closeSettings();
    }
  }
  document.removeEventListener("keydown", onKeydown);
  document.addEventListener("keydown", onKeydown);

  // --- initial render si besoin ---
  const initiallyHidden = modal.getAttribute("aria-hidden") === "true";
  if (!initiallyHidden) renderSettingsBody();
}
