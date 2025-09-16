// animations.js

// Affiche l’animation de clic manuel
export function animateClick(amount, tapBtn, formatNumberNoZeros) {
  const span = document.createElement("span");
  span.textContent = `+${formatNumberNoZeros(amount)}`;
  span.classList.add("click-burst");

  const rect = tapBtn.getBoundingClientRect();
  span.style.left = `${rect.left + rect.width / 2}px`;
  span.style.top  = `${rect.top - 10}px`;

  document.body.appendChild(span);
  span.addEventListener("animationend", () => span.remove());
}

// Fallback de position si l’élément n’existe pas ou retourne un rect invalide
function getSafeRect(el) {
  if (el && typeof el.getBoundingClientRect === "function") {
    const r = el.getBoundingClientRect();
    if (Number.isFinite(r.left) && Number.isFinite(r.top)) {
      return r;
    }
  }
  return {
    left: window.innerWidth  / 2,
    top:  window.innerHeight / 2,
    width:  0,
    height: 0
  };
}

// Affiche l’animation des gains passifs
export function animatePassive(amount, startEl, formatNumberNoZeros) {
  const span = document.createElement("span");
  span.textContent = `+${formatNumberNoZeros(amount)}`;
  span.classList.add("click-burst-passive");
  span.style.position = "fixed";

  const sr = getSafeRect(startEl);
  const startX = sr.left + (sr.width  ? Math.random() * sr.width  : 0);
  const startY = sr.top  + (sr.height ? sr.height * 0.3         : 0);

  span.style.left = `${startX}px`;
  span.style.top  = `${startY}px`;
  document.body.appendChild(span);

  // Lance l’animation CSS
  requestAnimationFrame(() => span.classList.add("animate"));

  span.addEventListener("animationend",   () => span.remove());
  span.addEventListener("transitionend",  () => span.remove());
}
