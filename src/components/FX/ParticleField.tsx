import type { CSSProperties } from 'react'

const particles = Array.from({ length: 26 }, (_, index) => ({
  id: index,
  left: `${(index * 37) % 100}%`,
  top: `${(index * 53) % 100}%`,
  delay: `${(index % 9) * 0.35}s`,
  scale: 0.55 + (index % 5) * 0.12,
}))

export function ParticleField() {
  return (
    <div className="particle-field" aria-hidden="true">
      {particles.map((particle) => (
        <span
          key={particle.id}
          style={
            {
              left: particle.left,
              top: particle.top,
              '--delay': particle.delay,
              '--scale': particle.scale,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
