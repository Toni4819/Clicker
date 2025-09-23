// popup.js

export function initUpdatePopup() {
  const hasSeen400Update = localStorage.getItem('hasSeen400Update');
  if (hasSeen400Update) return;

  const popup = document.createElement('div');
  popup.className = 'update-popup';
  popup.innerHTML = `
    <div class="popup-content">
      <h2>🎉 400ème mise à jour !</h2>
      <p>Merci pour votre fidélité 🙌</p>
      <p>Utilisez le code <strong>400UPDATES!!!</strong> pour débloquer une surprise !</p>
      <button id="closePopup">OK</button>
    </div>
  `;
  document.body.appendChild(popup);

  const style = document.createElement('style');
  style.textContent = `
    .update-popup {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }
    .popup-content {
      background: #0e1117;
      color: #fff;
      padding: 2rem;
      border-radius: 8px;
      text-align: center;
      max-width: 400px;
      box-shadow: 0 0 20px rgba(0,0,0,0.5);
    }
    .popup-content button {
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      background: #ff9800;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    }
  `;
  document.head.appendChild(style);

  document.getElementById('closePopup').addEventListener('click', () => {
    popup.remove();
    localStorage.setItem('hasSeen400Update', 'true');
  });
}
