// animations.js
import { formatCompact } from "./formatters.js";

// Couleur par défaut pour les clics passifs
let passiveBurstColor = "#00FFAA"; // vert clair par défaut

export function setPassiveBurstColor(color) {
  passiveBurstColor = color;
}

// Animation de clic manuel : du bouton vers le compteur (vertical)
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
  const endX = startX; // ligne droite verticale
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

// Animation passive : spawn aléatoire en bas, monte verticalement vers le compteur
export function animatePassive(amount, pointsEl) {
  const span = document.createElement("span");
  span.textContent = `+${formatCompact(amount)}`;
  span.classList.add("click-burst-passive");
  span.style.position = "fixed";
  span.style.zIndex = 1; // Derrière les boutons
  span.style.pointerEvents = "none";
  span.style.color = passiveBurstColor;

  // Position de départ = X aléatoire en bas de l'écran
  const startX = Math.random() * window.innerWidth;
  const startY = window.innerHeight - 50; // proche du bas

  // Position d'arrivée = même X, Y du compteur
  const endRect = pointsEl.getBoundingClientRect();
  const endX = startX;
  const endY = endRect.top + endRect.height / 2;

  span.style.left = `${startX}px`;
  span.style.top = `${startY}px`;

  document.body.appendChild(span);

  requestAnimationFrame(() => {
    span.style.transition = "all 1s ease-out";
    span.style.left = `${endX}px`;
    span.style.top = `${endY}px`;
    span.style.opacity = "0";
    span.style.transform = "scale(0.8)";
  });

  span.addEventListener("transitionend", () => span.remove());
}
