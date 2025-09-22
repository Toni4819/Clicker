export function initCoinDrop({ els, state, save, renderMain }) {
  const DROP_INTERVAL = 5 * 60 * 1000  // 5 minutes
  const DROP_CHANCE   = 0.5
  const RARE_CHANCE   = 0.01

  // s’assure que passiveClicksPerSecond est toujours un nombre
  state.passiveClicksPerSecond = Number(state.passiveClicksPerSecond) || 0

  // conteneur des messages en bas de l’écran
  const msgContainer = document.createElement('div')
  Object.assign(msgContainer.style, {
    position:       'fixed',
    bottom:         '20px',
    left:           '50%',
    transform:      'translateX(-50%)',
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            '8px',
    zIndex:         '1001'
  })
  document.body.appendChild(msgContainer)

  // affiche un message temporaire
  function showMessage(text) {
    const msg = document.createElement('div')
    Object.assign(msg.style, {
      backgroundColor: '#2196F3',
      color:           '#fff',
      padding:         '8px 12px',
      borderRadius:    '4px',
      boxShadow:       '0 2px 6px rgba(0,0,0,0.2)',
      fontSize:        '14px',
      opacity:         '0',
      transform:       'translateY(10px)',
      transition:      'opacity 0.3s, transform 0.3s'
    })
    msg.textContent = text
    msgContainer.appendChild(msg)

    requestAnimationFrame(() => {
      msg.style.opacity   = '1'
      msg.style.transform = 'translateY(0)'
    })

    setTimeout(() => {
      msg.style.opacity   = '0'
      msg.style.transform = 'translateY(10px)'
      setTimeout(() => msg.remove(), 300)
    }, 3000)
  }

  // génère une pièce aléatoire
  function spawnCoin() {
    if (Math.random() > DROP_CHANCE) return

    const coin = document.createElement('div')
    coin.className = 'coin-drop'
    coin.textContent = '🪙'
    Object.assign(coin.style, {
      position:   'fixed',
      zIndex:     '1000',
      fontSize:   '32px',
      cursor:     'pointer',
      transition: 'transform 0.2s',
      top:        `${Math.random() * 80 + 10}%`,
      left:       `${Math.random() * 80 + 10}%`
    })
    document.body.appendChild(coin)

    coin.addEventListener('click', event => {
      const isRare     = Math.random() < RARE_CHANCE
      const multiplier = isRare
        ? 100
        : Math.floor(Math.random() * 10) + 1

      // conversion sécurisée et calcul du gain
      const passive = Number(state.passiveClicksPerSecond) || 0
      const gain    = passive * multiplier

      state.points += gain
      save()
      renderMain()

      // feedback visuel sur la pièce
      const target = event.currentTarget
      target.textContent = isRare
        ? '💎 +100×!'
        : `💰 ×${multiplier}`
      target.style.transform = 'scale(1.5)'

      // message informatif
      showMessage(`+${gain} pts ${isRare ? '(rare)' : ''}`)

      setTimeout(() => target.remove(), 800)
    })

    // supprime la pièce au bout de 30s si non cliquée
    setTimeout(() => {
      if (coin.parentNode) coin.remove()
    }, 30_000)
  }

  // démarre la boucle de drop
  setInterval(spawnCoin, DROP_INTERVAL)
}
