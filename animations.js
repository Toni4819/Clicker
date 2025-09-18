// animations.js
import { formatCompact } from "./formatters.js";

// Couleur par défaut des bursts
let burstColor = "#FFD700"; // or par défaut

export function setBurstColor(color) {
  burstColor = color;
}

// Animation de clic manuel (spawn aléatoire sur l'écran)
export function animateClick(amount, tapBtn, color = burstColor) {
  const span = document.createElement("span");
  span.textContent = `+${formatCompact(amount)}`;
  span.classList.add("click-burst");

  // Position aléatoire sur tout l'écran
  const randX = Math.random() * window.innerWidth;
  const randY = Math.random() * window.innerHeight;

  span.style.left = `${randX}px`;
  span.style.top = `${randY}px`;
  span.style.position = "fixed";
  span.style.zIndex = 50;
  span.style.color = color;

  document.body.appendChild(span);
  requestAnimationFrame(() => span.classList.add("animate"));
  span.addEventListener("animationend", () => span.remove());
}

// Animation passive (spawn aléatoire sur l'écran)
export function animatePassive(amount, startEl, color = burstColor) {
  const span = document.createElement("span");
  span.textContent = `+${formatCompact(amount)}`;
  span.classList.add("click-burst-passive");

  // Position aléatoire sur tout l'écran
  const randX = Math.random() * window.innerWidth;
  const randY = Math.random() * window.innerHeight;

  span.style.left = `${randX}px`;
  span.style.top = `${randY}px`;
  span.style.position = "fixed";
  span.style.zIndex = 50;
  span.style.color = color;

  document.body.appendChild(span);
  requestAnimationFrame(() => span.classList.add("animate"));
  span.addEventListener("animationend", () => span.remove());
}
