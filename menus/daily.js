// ─── 📅 Récompense quotidienne (modal) ───

export function initDaily({ els, state, save, renderMain }) {
  // 1️⃣ Crée le modal
  const modal = document.createElement("div");
  modal.id = "dailyModal";
  modal.className = "modal";
  modal.setAttribute("aria-hidden", "true");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-labelledby", "dailyTitle");
  modal.innerHTML = `
    <div class="modal-content" 
         style="display:flex;flex-direction:column;height:100%;max-width:600px;margin:auto;">
      <header class="modal-header" style="display:flex;justify-content:space-between;">
        <h2 id="dailyTitle">🎁 Récompenses quotidiennes</h2>
        <button id="closeDailyBtn" class="close-btn" aria-label="Fermer">✕</button>
      </header>
      <div class="modal-body" 
           style="padding:16px;display:flex;flex-direction:column;gap:16px;">
        <div id="daysGrid" 
             style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px;"></div>
        <div style="text-align:center;">
          <button id="closeDailyFooter" class="btn" style="width:100%;">🔒 Fermer</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // 2️⃣ Références DOM
  const closeBtn   = modal.querySelector("#closeDailyBtn");
  const footerBtn  = modal.querySelector("#closeDailyFooter");
  const daysGrid   = modal.querySelector("#daysGrid");

  // 3️⃣ Configuration des récompenses
  const REWARDS = [
    { desc: "10 000 clics", apply: () => { state.points = (state.points||0) + 10_000; } },
    { desc: "Boost ×2 boutique (10 min)", apply: () => {
        state.tempShopBoostFactor    = 2;
        state.tempShopBoostExpiresAt = Date.now() + 10 * 60 * 1000;
      }
    },
    { desc: "Récompense jour 3 (à configurer)", apply: () => {} },
    { desc: "Récompense jour 4 (à configurer)", apply: () => {} },
    { desc: "Récompense jour 5 (à configurer)", apply: () => {} },
    { desc: "Récompense jour 6 (à configurer)", apply: () => {} },
    { desc: "Récompense jour 7 (à configurer)", apply: () => {} }
  ];

  // 4️⃣ Helpers de date et de suivi
  function isoDate(d = new Date()) {
    return d.toISOString().slice(0, 10);
  }

  function loadDailyData() {
    const lastDate = localStorage.getItem("dailyLastDate") || null;
    const streak   = parseInt(localStorage.getItem("dailyStreak") || "0", 10);
    return { lastDate, streak };
  }

  function saveDailyData(lastDate, streak) {
    localStorage.setItem("dailyLastDate", lastDate);
    localStorage.setItem("dailyStreak", String(streak));
  }

  // 5️⃣ Ouvrir / Fermer modal
  function openDaily() {
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    renderDays();
  }

  function closeDaily() {
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  // 6️⃣ Génère et rafraîchit la grille des jours
  function renderDays() {
    daysGrid.innerHTML = "";
    const today    = isoDate();
    const yesterday = isoDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
    let { lastDate, streak } = loadDailyData();

    // Détermine le prochain jour à réclamer
    let nextDayIndex = 1;
    if (lastDate === today) {
      nextDayIndex = streak;            // déjà réclamé aujourd’hui
    } else if (lastDate === yesterday) {
      nextDayIndex = Math.min(streak + 1, 7);
    } else {
      streak        = 0;
      nextDayIndex  = 1;
    }

    REWARDS.forEach((reward, idx) => {
      const dayNum = idx + 1;
      const btn    = document.createElement("button");
      btn.className = "btn";
      btn.style = "display:flex;flex-direction:column;align-items:center;padding:8px;";
      btn.textContent = `Jour ${dayNum}`;
      const small = document.createElement("small");
      small.textContent = reward.desc;
      btn.appendChild(small);

      // Styles selon état
      if (dayNum < nextDayIndex || (dayNum === nextDayIndex && lastDate === today)) {
        btn.disabled = true;
        btn.style.opacity = "0.6";
      } else if (dayNum === nextDayIndex) {
        btn.disabled = false;
        btn.style.border = "2px solid var(--accent)";
      } else {
        btn.disabled = true;
        btn.style.opacity = "0.3";
      }

      btn.onclick = () => {
        if (dayNum !== nextDayIndex) return;
        // applique la récompense
        reward.apply();
        // met à jour streak et date
        const newStreak = dayNum;
        saveDailyData(today, newStreak);
        save();
        renderMain();
        renderDays();
        alert(`🎉 Vous avez récupéré la récompense du jour ${dayNum} !`);
      };

      daysGrid.appendChild(btn);
    });
  }

  // 7️⃣ Hooks et événements
  els.dailyBtn && els.dailyBtn.addEventListener("click", openDaily);
  closeBtn.addEventListener("click", closeDaily);
  footerBtn.addEventListener("click", closeDaily);
  modal.addEventListener("click", e => {
    if (e.target === modal) closeDaily();
  });
}
