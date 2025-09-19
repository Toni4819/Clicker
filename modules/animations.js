// animations.js
import { formatCompact } from "./modules/formatters.js";

// Couleur par défaut pour les bursts passifs
let passiveBurstColor = "#00FFAA"; // vert clair

// Permet de changer la couleur depuis l'extérieur
export function setPassiveBurstColor(color) {
  passiveBurstColor = color;
}

/**
 * Animation de clic manuel :
 * - Part du bouton
 * - Monte verticalement vers le compteur de points
 * - Passe sous les boutons (z-index bas)
 */
export function animateClick(amount, tapBtn, pointsEl) {
  const span = document.createElement("span");
  span.textContent = `+${formatCompact(amount)}`;
  span.classList.add("click-burst");
  span.style.position = "fixed";
  span.style.zIndex = 1; // Derrière les boutons
  span.style.pointerEvents = "none";

  // Position de départ = centre du bouton
  const startRect = tapBtn.getBoundingClientRect();
  const startX = startRect.left + startRect.width / 2;
  const startY = startRect.top + startRect.height / 2;

  // Position d'arrivée = même X, Y du compteur
  const endRect = pointsEl.getBoundingClientRect();
  const endX = startX;
  const endY = endRect.top + endRect.height / 2;

  // Position initiale
  span.style.left = `${startX}px`;
  span.style.top = `${startY}px`;

  document.body.appendChild(span);

  requestAnimationFrame(() => {
    span.style.transition = "all 0.5s ease-out";
    span.style.left = `${endX}px`;
    span.style.top = `${endY}px`;
    span.style.opacity = "0";
    span.style.transform = "scale(0.8)";
  });

  span.addEventListener("transitionend", () => span.remove());
}

/**
 * Animation passive :
 * - Spawn à un endroit aléatoire
 * - Évite les boutons
 * - Effet pop + fade lent
 * - Passe sous les modales
 * - Suppression après durée fixe (pas coupée)
 */
export function animatePassive(amount) {
  const span = document.createElement("span");
  span.textContent = `+${formatCompact(amount)}`;
  span.classList.add("click-burst-passive");
  span.style.position = "fixed";
  span.style.zIndex = 5; // Sous les modales (souvent 100+)
  span.style.pointerEvents = "none";
  span.style.color = passiveBurstColor;
  span.style.opacity = "0";
  span.style.transform = "scale(0.5)";

  // Zones interdites = tous les boutons
  const forbiddenZones = [
    ...document.querySelectorAll("button")
  ].map(btn => btn.getBoundingClientRect());

  let randX, randY, safe = false;
  while (!safe) {
    randX = Math.random() * window.innerWidth;
    randY = Math.random() * window.innerHeight;
    safe = !forbiddenZones.some(r =>
      randX >= r.left && randX <= r.right &&
      randY >= r.top && randY <= r.bottom
    );
  }

  span.style.left = `${randX}px`;
  span.style.top = `${randY}px`;

  document.body.appendChild(span);

  // Apparition (pop)
  requestAnimationFrame(() => {
    span.style.transition = "transform 1.5s ease-out, opacity 1.5s ease-out";
    span.style.transform = "scale(1.3)";
    span.style.opacity = "1";
  });

  // Disparition progressive après un délai
  setTimeout(() => {
    span.style.transition = "transform 1.5s ease-in, opacity 1.5s ease-in";
    span.style.transform = "scale(0.8)";
    span.style.opacity = "0";
  }, 1500);

  // Suppression après la durée totale (apparition + disparition)
  setTimeout(() => {
    span.remove();
  }, 3000); // 1.5s + 1.5s
}
