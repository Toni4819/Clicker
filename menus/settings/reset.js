export function doReset(state, save, renderMain, renderSettingsBody) {
  if (!confirm("Réinitialiser la partie ?")) return;

  Object.assign(state, {
    score: 0,
    clickValue: 1,
    multiplier: 1,
    autoClickers: 0,
    upgrades: {
      clickBoost: false,
      autoClickerBoost: false
    },
    settings: {
      sound: true,
    },
    lastSave: null
  });

  save();
  renderMain();
  renderSettingsBody();
}
