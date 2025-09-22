// menus/settings.js

// ─── Utilitaires AES-GCM / PBKDF2 ───
const enc = new TextEncoder();
const dec = new TextDecoder();

async function deriveKey(password, salt) {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100_000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptData(plainText, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(password, salt);
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plainText)
  );

  // Concatène salt + iv + ciphertext
  const combined = new Uint8Array(
    salt.byteLength + iv.byteLength + cipherBuffer.byteLength
  );
  combined.set(salt, 0);
  combined.set(iv,   salt.byteLength);
  combined.set(new Uint8Array(cipherBuffer), salt.byteLength + iv.byteLength);

  // Retourne en Base64
  return btoa(String.fromCharCode(...combined));
}

async function decryptData(b64Combined, password) {
  const combined = Uint8Array.from(atob(b64Combined), c => c.charCodeAt(0));
  const salt = combined.slice(0, 16);
  const iv   = combined.slice(16, 28);
  const data = combined.slice(28);

  const key = await deriveKey(password, salt);
  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  return dec.decode(plainBuffer);
}

// ─── Initialisation du menu Settings ───
export function initSettings({ els, state, keys, save, renderMain }) {
  // Création du modal et de son contenu
  const modal = document.getElementById("settingsModal");
  modal.className = "modal";
  modal.setAttribute("aria-hidden", "true");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-labelledby", "settingsTitle");
  modal.innerHTML = `
    <div class="modal-content" style="display:flex;flex-direction:column;height:100%;">
      <header class="modal-header">
        <h2 id="settingsTitle">⚙️ Paramètres</h2>
        <button id="closeSettingsBtn" class="close-btn" aria-label="Fermer">✕</button>
      </header>
      <div class="modal-body" id="settingsBody" style="flex:1;display:flex;flex-direction:column;gap:16px;">
        <button id="loginBtn" class="btn">🔑 Se connecter</button>
        <div style="display:flex;gap:8px;">
          <button id="exportBtn" class="btn">📤 Exporter (chiffré)</button>
          <button id="importBtn" class="btn">📥 Importer (chiffré)</button>
        </div>
        <div style="flex:1;"></div>
        <div style="display:flex;justify-content:center;">
          <button id="resetBtn" class="btn footer-reset">↺ Reset total</button>
        </div>
      </div>
    </div>
  `;

  // Références DOM
  els.closeSettingsBtn = modal.querySelector("#closeSettingsBtn");
  els.resetBtn         = modal.querySelector("#resetBtn");
  els.loginBtn         = modal.querySelector("#loginBtn");
  els.exportBtn        = modal.querySelector("#exportBtn");
  els.importBtn        = modal.querySelector("#importBtn");

  // Input file caché pour l’import
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".txt";
  fileInput.style.display = "none";
  document.body.appendChild(fileInput);

  // Ouvre/ferme
  function openSettings() {
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }
  function closeSettings() {
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  // Reset total
  function performFullReset() {
    const confirmReset = confirm(
      "⚠️ Réinitialiser TOUT le stockage local et remettre les clics à 1 ?"
    );
    if (!confirmReset) return;

    localStorage.clear();
    // RAZ de toutes les clés
    for (const k of keys) state[k] = 0;
    state.pointsPerClick      = 1;
    state.shopBoost           = 1;
    state.tempShopBoostFactor = 1;
    state.tempShopBoostExpiresAt = 0;
    state.rebirths            = 0;

    save();
    renderMain();
    closeSettings();
  }

  // Événements
  els.settingsBtn.addEventListener("click", openSettings);
  els.closeSettingsBtn.addEventListener("click", closeSettings);
  modal.addEventListener("click", e => {
    if (e.target === modal) closeSettings();
  });

  els.loginBtn.addEventListener("click", () => {
    console.log("Fonction de connexion à implémenter");
  });

  // Export chiffré
  els.exportBtn.addEventListener("click", async () => {
    const password = prompt("🔑 Mot de passe pour chiffrer l’export :");
    if (!password) return;

    const dataStr = JSON.stringify(state);
    try {
      const encrypted = await encryptData(dataStr, password);
      const blob = new Blob([encrypted], { type: "text/plain" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = "clicker-state.txt";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Chiffrement impossible", err);
      alert("Erreur lors de l’export chiffré.");
    }
  });

  // Import chiffré
  els.importBtn.addEventListener("click", () => {
    const password = prompt("🔑 Mot de passe pour déchiffrer l’import :");
    if (!password) return;

    fileInput.onchange = async () => {
      const file = fileInput.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        const decrypted = await decryptData(text.trim(), password);
        const imported  = JSON.parse(decrypted);

        // Remplacement des valeurs
        for (const k of keys) {
          if (imported[k] != null) state[k] = imported[k];
        }
        state.pointsPerClick      = imported.pointsPerClick      ?? 1;
        state.shopBoost           = imported.shopBoost           ?? 1;
        state.tempShopBoostFactor = imported.tempShopBoostFactor ?? 1;
        state.tempShopBoostExpiresAt = imported.tempShopBoostExpiresAt ?? 0;
        state.rebirths            = imported.rebirths            ?? 0;

        save();
        renderMain();
        closeSettings();
        alert("Import réussi !");
      } catch (err) {
        console.error("Déchiffrement/parse impossible", err);
        alert("Mot de passe incorrect ou fichier invalide.");
      } finally {
        fileInput.value = "";
      }
    };

    fileInput.click();
  });

  els.resetBtn.addEventListener("click", performFullReset);
}
