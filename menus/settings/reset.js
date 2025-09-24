// menus/settings/reset.js
export function doReset(state, save, renderMain, renderSettingsBody) {
  if (!confirm("Réinitialiser la partie ?")) return;
  for (const k of Object.keys(state)) delete state[k];
  save();
  renderMain();
  renderSettingsBody();
}
