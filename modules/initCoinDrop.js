export function initCoinDrop({ els, state, save, renderMain }) {
  const DROP_CHANCE = 0.5       // 50% de chance de drop à chaque intervalle
  const RARE_CHANCE = 0.01      // 1% de chance que la pièce soit rare

  // S’assure que passiveClicksPerSecond est bien un nombre
  state.passiveClicksPerSecond = Number(state.passiveClicksPerSecond) || 0

  // Conteneur des messages en bas de l’écran
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

  // Affiche un message temporaire
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

  // Génère une pièce aléatoire
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
      const multiplier = isRare ? 100 : Math.floor(Math.random() * 10) + 1
      const passive    = Number(state.passiveClicksPerSecond) || 0
      const gain       = passive * multiplier

      state.points += gain
      save()
      renderMain()

      const target = event.currentTarget
      target.textContent = isRare ? '💎 +100×!' : `💰 ×${multiplier}`
      target.style.transform = 'scale(1.5)'

      showMessage(`+${gain} pts ${isRare ? '(rare)' : ''}`)

      setTimeout(() => target.remove(), 800)
    })

    // Supprime la pièce après 30 secondes si non cliquée
    setTimeout(() => {
      if (coin.parentNode) coin.remove()
    }, 30_000)
  }

  // Boucle de drop avec intervalle aléatoire entre 2 et 5 minutes
  function startCoinLoop() {
    const randomDelay = Math.random() * (5 - 2) * 60 * 1000 + 2 * 60 * 1000
    setTimeout(() => {
      spawnCoin()
      startCoinLoop()
    }, randomDelay)
  }

  startCoinLoop()
}
