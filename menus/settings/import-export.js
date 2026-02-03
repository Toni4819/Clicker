// menus/settings/import-export.js
// Ce module fournit exportState/importState et crée un modal-second si besoin
// Utilise la classe CSS modal-second (doit exister dans style.css)
// Chiffrement via Web Crypto API (AES-GCM) — pas de dépendance externe

function bufToBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function base64ToBuf(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}
function strToBuf(str) {
  return new TextEncoder().encode(str);
}
function bufToStr(buf) {
  return new TextDecoder().decode(buf);
}
async function deriveKey(password, salt, usage = ["encrypt", "decrypt"]) {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    strToBuf(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 200_000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    usage
  );
}
async function encryptJsonWithPassword(obj, password) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt, ["encrypt"]);
  const plaintext = strToBuf(JSON.stringify(obj));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  // output base64: salt.iv.ciphertext
  return `${bufToBase64(salt)}.${bufToBase64(iv)}.${bufToBase64(ct)}`;
}
async function decryptJsonWithPassword(b64string, password) {
  const parts = b64string.split(".");
  if (parts.length !== 3) throw new Error("Format invalide");
  const salt = base64ToBuf(parts[0]);
  const iv = base64ToBuf(parts[1]);
  const ct = base64ToBuf(parts[2]);
  const key = await deriveKey(password, salt, ["decrypt"]);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return JSON.parse(bufToStr(pt));
}

export function initImportExport() {
  // modal-second : modal léger placé en dessous du modal principal si besoin
  function ensureModalSecond() {
    let modal = document.getElementById("modalSecond");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "modalSecond";
      modal.className = "modal modal-second"; // utilise les styles existants modal-second
      modal.setAttribute("aria-hidden", "true");
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "false");

      // Force positionnement et z-index pour être au-dessus des autres modales
      modal.style.position = "fixed";
      modal.style.zIndex = "10010";

      modal.innerHTML = `
        <div class="modal-content" role="document">
          <header class="modal-header">
            <h3 id="modalSecondTitle">Importer / Exporter</h3>
            <button class="close-btn" aria-label="Fermer">✕</button>
          </header>
          <div class="modal-body" id="modalSecondBody"></div>
        </div>
      `;
      document.body.append(modal);

      const close = () => {
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
        // cleanup listeners that may remain on dynamic elements
        const doImport = modal.querySelector("#doImport");
        if (doImport) doImport.replaceWith(doImport.cloneNode(true));
        const doExport = modal.querySelector("#doExport");
        if (doExport) doExport.replaceWith(doExport.cloneNode(true));
      };

      modal.querySelector(".close-btn").addEventListener("click", close);
      modal.addEventListener("click", e => {
        if (e.target === modal) close();
      });
      return modal;
    }

    // Si la modal existait déjà, s'assurer que la structure minimale est présente
    if (!modal.querySelector(".modal-content")) {
      const content = document.createElement("div");
      content.className = "modal-content";
      content.setAttribute("role", "document");
      modal.appendChild(content);
    }

    if (!modal.querySelector(".modal-header")) {
      const header = document.createElement("header");
      header.className = "modal-header";
      modal.querySelector(".modal-content").insertBefore(header, modal.querySelector(".modal-content").firstChild);
    }

    if (!modal.querySelector("#modalSecondTitle")) {
      const h3 = document.createElement("h3");
      h3.id = "modalSecondTitle";
      h3.textContent = "Importer / Exporter";
      modal.querySelector(".modal-header").insertBefore(h3, modal.querySelector(".modal-header").firstChild || null);
    }

    if (!modal.querySelector(".close-btn")) {
      const btn = document.createElement("button");
      btn.className = "close-btn";
      btn.setAttribute("aria-label", "Fermer");
      btn.textContent = "✕";
      modal.querySelector(".modal-header").appendChild(btn);
      btn.addEventListener("click", () => {
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
      });
    }

    if (!modal.querySelector("#modalSecondBody")) {
      const bodyDiv = document.createElement("div");
      bodyDiv.className = "modal-body";
      bodyDiv.id = "modalSecondBody";
      modal.querySelector(".modal-content").appendChild(bodyDiv);
    }

    // S'assurer que le style z-index est correct même si la modal existait déjà
    modal.style.position = modal.style.position || "fixed";
    modal.style.zIndex = modal.style.zIndex || "10010";

    // Attacher le listener de clic sur le fond si absent
    if (!modal._modalSecondBackdropListener) {
      const backdropListener = e => { if (e.target === modal) { modal.setAttribute("aria-hidden", "true"); document.body.classList.remove("modal-open"); } };
      modal.addEventListener("click", backdropListener);
      modal._modalSecondBackdropListener = true;
    }

    return modal;
  }

  function showModalSecond(contentHtml, title) {
    const modal = ensureModalSecond();
    const body = modal.querySelector("#modalSecondBody");
    const titleEl = modal.querySelector("#modalSecondTitle");

    if (title) {
      if (titleEl) titleEl.textContent = title;
      else {
        const header = modal.querySelector(".modal-header") || modal.querySelector(".modal-content") || modal;
        const h3 = document.createElement("h3");
        h3.id = "modalSecondTitle";
        h3.textContent = title;
        header.insertBefore(h3, header.firstChild || null);
      }
    }

    if (body) {
      body.innerHTML = contentHtml;
    } else {
      const newBody = document.createElement("div");
      newBody.className = "modal-body";
      newBody.id = "modalSecondBody";
      newBody.innerHTML = contentHtml;
      modal.querySelector(".modal-content").appendChild(newBody);
    }

    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    return modal;
  }

  // Export: chiffre l'objet state avec mot de passe, affiche chaîne encodée,
  // propose copier et télécharger (fichier .txt)
  async function exportState(state) {
    const html = `
      <p class="section-title">Exporter — chiffrer l'état avec un mot de passe</p>
      <label class="label">Mot de passe</label>
      <input id="exportPassword" type="password" class="input" autocomplete="new-password" />
      <div class="row" style="gap:8px; margin-top:8px;">
        <button id="doExport" class="btn btn-primary">Générer la chaîne</button>
      </div>
      <label class="label" style="margin-top:12px;">Chaîne chiffrée</label>
      <textarea id="exportResult" class="input" rows="6" readonly></textarea>
      <div class="row" style="gap:8px; margin-top:8px;">
        <button id="copyExport" class="btn btn-secondary">Copier</button>
        <button id="downloadExport" class="btn btn-secondary">Télécharger</button>
      </div>
    `;
    const modal = showModalSecond(html, "Exporter");
    const pw = modal.querySelector("#exportPassword");
    const doExport = modal.querySelector("#doExport");
    const resultArea = modal.querySelector("#exportResult");
    const copyBtn = modal.querySelector("#copyExport");
    const downloadBtn = modal.querySelector("#downloadExport");

    doExport.addEventListener("click", async () => {
      const password = pw.value || "";
      if (!password) return alert("Mot de passe requis pour chiffrer");
      try {
        const encoded = await encryptJsonWithPassword(state, password);
        resultArea.value = encoded;
      } catch (err) {
        console.error("Encryption error", err);
        alert("Échec lors du chiffrement");
      }
    });

    copyBtn.addEventListener("click", async () => {
      if (!resultArea.value) return;
      try {
        await navigator.clipboard.writeText(resultArea.value);
      } catch {
        resultArea.select();
        document.execCommand("copy");
      }
    });

    downloadBtn.addEventListener("click", () => {
      if (!resultArea.value) return;
      const blob = new Blob([resultArea.value], { type: "text/plain;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "clicker-save.txt";
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }

  // Import: colle chaîne chiffrée, mot de passe, déchiffre et applique
  function importState(state, save, renderMain, renderSettingsBody) {
    const html = `
      <p class="section-title">Importer — collez la chaîne chiffrée</p>
      <label class="label">Chaîne chiffrée</label>
      <textarea id="importData" class="input" rows="6" placeholder="Coller la chaîne ici"></textarea>
      <label class="label" style="margin-top:8px;">Mot de passe</label>
      <input id="importPassword" type="password" class="input" autocomplete="current-password" />
      <div class="row" style="gap:8px; margin-top:8px;">
        <button id="doImport" class="btn btn-primary">Importer</button>
        <button id="pasteClipboard" class="btn btn-secondary">Coller depuis le presse-papiers</button>
      </div>
      <p class="muted" style="margin-top:8px;">Si vous avez téléchargé un fichier, ouvrez-le et copiez-collez son contenu ici.</p>
    `;
    const modal = showModalSecond(html, "Importer");
    const dataArea = modal.querySelector("#importData");
    const pw = modal.querySelector("#importPassword");
    const doImport = modal.querySelector("#doImport");
    const pasteBtn = modal.querySelector("#pasteClipboard");

    pasteBtn.addEventListener("click", async () => {
      try {
        const text = await navigator.clipboard.readText();
        dataArea.value = text;
      } catch {
        alert("Impossible de lire le presse-papiers");
      }
    });

    doImport.addEventListener("click", async () => {
      const encrypted = dataArea.value.trim();
      const password = pw.value || "";
      if (!encrypted) return alert("Aucune donnée fournie");
      if (!password) return alert("Mot de passe requis");
      try {
        const parsed = await decryptJsonWithPassword(encrypted, password);
        // merge safely
        Object.keys(state).forEach(k => delete state[k]);
        Object.assign(state, parsed);
        // persist and rerender via callbacks
        if (typeof save === "function") save();
        if (typeof renderMain === "function") renderMain();
        if (typeof renderSettingsBody === "function") renderSettingsBody();
        // close modal
        const mm = document.getElementById("modalSecond");
        if (mm) {
          mm.setAttribute("aria-hidden", "true");
          document.body.classList.remove("modal-open");
        }
      } catch (err) {
        console.error("Import failed:", err);
        alert("Mot de passe incorrect ou données corrompues");
      }
    });
  }

  return {
    exportState,
    importState,
    ensureModalSecond
  };
}
