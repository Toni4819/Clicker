// menus/settings/import-export.js
// Ce module fournit exportState/importState et crée un modal-second si besoin
export function initImportExport() {
  // modal-second : modal léger placé en dessous du modal principal si besoin
  function ensureModalSecond() {
    let modal = document.getElementById("modalSecond");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "modalSecond";
    modal.className = "modal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="modal-content" role="document" style="max-width:520px;">
        <header class="modal-header">
          <h3 id="modalSecondTitle">Importer / Exporter</h3>
          <button class="close-btn" aria-label="Fermer">✕</button>
        </header>
        <div class="modal-body" id="modalSecondBody"></div>
      </div>
    `;
    document.body.append(modal);
    modal.querySelector(".close-btn").addEventListener("click", () => {
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
    });
    modal.addEventListener("click", e => {
      if (e.target === modal) {
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
      }
    });
    return modal;
  }

  function showModalSecond(contentHtml) {
    const modal = ensureModalSecond();
    const body = modal.querySelector("#modalSecondBody");
    body.innerHTML = contentHtml;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  }

  function exportState(state) {
    const data = JSON.stringify(state);
    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "clicker-save.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importState(state, save, renderMain, renderSettingsBody) {
    // on ouvre modal-second avec un input file
    showModalSecond(`
      <p class="section-title">Choisissez un fichier JSON</p>
      <div style="display:flex; gap:10px; align-items:center;">
        <input id="importFile" type="file" accept="application/json" />
        <button id="doImport" class="btn btn-secondary">Importer</button>
      </div>
    `);
    const modal = document.getElementById("modalSecond");
    const input = modal.querySelector("#importFile");
    const doImport = modal.querySelector("#doImport");
    doImport.addEventListener("click", async () => {
      const file = input.files?.[0];
      if (!file) return alert("Aucun fichier sélectionné");
      try {
        const text = await file.text();
        Object.assign(state, JSON.parse(text));
        save();
        renderMain();
        renderSettingsBody();
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("modal-open");
      } catch (err) {
        console.error("Import failed:", err);
        alert("Fichier invalide");
      }
    });
  }

  return {
    exportState,
    importState,
    ensureModalSecond
  };
}
