// menus/settings/codes.js
export function enterCode(state, save, renderMain, renderSettingsBody) {
  const code = prompt("Entrez votre code :");
  if (!code) return;
  if (code.trim().toUpperCase() === "400UPDATES!!!") {
    state.points = (state.points || 0) + 1_000_000_000;
    save();
    renderMain();
    renderSettingsBody();
    alert("+1 000 000 000 points");
  } else {
    alert("Code invalide");
  }
}
