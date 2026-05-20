export const triggerExplosion = (x, y) => {
  const particlesCount = 12;
  const colors = ['#6366f1', '#8b5cf6', '#10b981', '#f43f5e', '#f59e0b'];
  const symbols = ['✨', '⭐', '🎉', '•', '✧'];

  for (let i = 0; i < particlesCount; i++) {
    const particle = document.createElement('span');
    particle.className = 'particle-sparkle';
    
    // Randomly use a symbol or a colored dot
    const isEmoji = Math.random() > 0.4;
    if (isEmoji) {
      particle.innerText = symbols[Math.floor(Math.random() * symbols.length)];
    } else {
      particle.innerText = '•';
      particle.style.color = colors[Math.floor(Math.random() * colors.length)];
      particle.style.fontWeight = 'bold';
    }

    // Set starting position at click center
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;

    // Dynamic trajectory (bias slightly upwards like a burst)
    const angle = Math.random() * Math.PI * 2;
    const distance = 40 + Math.random() * 85;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance - (30 + Math.random() * 30);
    const rot = (Math.random() - 0.5) * 360;

    particle.style.setProperty('--tx', `${tx}px`);
    particle.style.setProperty('--ty', `${ty}px`);
    particle.style.setProperty('--rot', `${rot}deg`);

    document.body.appendChild(particle);

    // Remove element after animation duration (700ms)
    setTimeout(() => {
      particle.remove();
    }, 700);
  }
};
