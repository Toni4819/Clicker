/* Dev menu logic */
const _devKeyParts = ["Mz", "RT", "YX", "Vj", "ZTEy"];
const base64Code = _devKeyParts.join(""); // "MzRTYXVjZTEy"
let devUnlocked = false;

/**
 * Vérifie si le code fourni correspond à la clé de déverrouillage
 * @param {string} inputCode - Code utilisateur
 * @returns {boolean}
 */
function unlockDevMenu(inputCode) {
  if (inputCode === base64Code) {
    devUnlocked = true;
    console.log("Dev menu unlocked.");
    return true;
  }
  console.warn("Invalid dev code.");
  return false;
}

/**
 * Affiche le menu développeur si déverrouillé
 */
function showDevMenu() {
  if (!devUnlocked) return;
  // Ajoute ici le contenu du menu dev
  console.log("Affichage du menu développeur...");
}
