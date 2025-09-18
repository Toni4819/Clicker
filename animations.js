// animations.js
import { formatCompact } from "./formatters.js";

// Couleur par défaut pour les clics passifs
let passiveBurstColor = "#00FFAA"; // vert clair par défaut

export function setPassiveBurstColor(color) {
  passiveBurstColor = color;
}

// Animation de clic manuel : du bouton vers le compteur de points
export function animateClick(amount, tapBtn, pointsEl) {
  const span = document.createElement("span");
  span.textContent = `+${formatCompact(amount)}`;
  span.classList.add("click-burst");
  span.style.position = "fixed";
  span.style.zIndex = 50;

  // Position de départ = centre du bouton
  const startRect = tapBtn.getBoundingClientRect();
  const startX = startRect.left + startRect.width / 2;
  const startY = startRect.top + startRect.height / 2;

  // Position d'arrivée = autour du compteur de points, avec un petit offset aléatoire
  const endRect = pointsEl.getBoundingClientRect();
  const endX = endRect.left + endRect.width / 2 + (Math.random() - 0.5) * 40;
  const endY = endRect.top + endRect.height / 2 + (Math.random() - 0.5) * 20;

  // Position initiale
  span.style.left = `${startX}px`;
  span.style.top = `${startY}px`;

  document.body.appendChild(span);

  // Animation avec transform
  requestAnimationFrame(() => {
    span.style.transition = "all 0.6s ease-out";
    span.style.left = `${endX}px`;
    span.style.top = `${endY}px`;
    span.style.opacity = "0";
    span.style.transform = "scale(0.8)";
  });

  span.addEventListener("transitionend", () => span.remove());
}

// Animation passive : spawn aléatoire sur l'écran
export function animatePassive(amount) {
  const span = document.createElement("span");
  span.textContent = `+${formatCompact(amount)}`;
  span.classList.add("click-burst-passive");
  span.style.position = "fixed";
  span.style.zIndex = 50;
  span.style.color = passiveBurstColor;

  // Position aléatoire sur tout l'écran
  const randX = Math.random() * window.innerWidth;
  const randY = Math.random() * window.innerHeight;

  span.style.left = `${randX}px`;
  span.style.top = `${randY}px`;

  document.body.appendChild(span);

  requestAnimationFrame(() => {
    span.style.transition = "all 1s ease-out";
    span.style.opacity = "0";
    span.style.transform = "translateY(-30px) scale(0.8)";
  });

  span.addEventListener("transitionend", () => span.remove());
}
