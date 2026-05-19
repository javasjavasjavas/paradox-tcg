import { Layers, Map, Play, Settings, type LucideIcon } from 'lucide-react'
import type { CSSProperties } from 'react'
import bgIntro from '../assets/ui/bg_intro.jpg'
import paradoxLogo from '../assets/ui/paradox-logo.png'

interface IntroScreenProps {
  onStartGame: () => void
}

interface IntroMenuOption {
  label: string
  detail: string
  Icon: LucideIcon
}

const secondaryOptions: IntroMenuOption[] = [
  {
    label: 'Stage Select',
    detail: 'Neon district',
    Icon: Map,
  },
  {
    label: 'Deck',
    detail: '17 cards online',
    Icon: Layers,
  },
  {
    label: 'Options',
    detail: 'Protocol stable',
    Icon: Settings,
  },
]

export function IntroScreen({ onStartGame }: IntroScreenProps) {
  return (
    <main
      className="intro-screen"
      style={{ '--intro-bg': `url(${bgIntro})` } as CSSProperties}
    >
      <section className="intro-screen__content" aria-label="Main menu">
        <div className="intro-brand">
          <img className="intro-brand__logo" src={paradoxLogo} alt="Paradox" />
        </div>

        <nav className="intro-menu" aria-label="Game menu">
          <button
            type="button"
            aria-label="Start Game"
            className="intro-menu__item intro-menu__item--primary"
            onClick={onStartGame}
          >
            <Play size={24} strokeWidth={1.8} />
            <span>Start Game</span>
            <small>Battle link ready</small>
          </button>

          {secondaryOptions.map(({ label, detail, Icon }) => (
            <button type="button" className="intro-menu__item" disabled key={label}>
              <Icon size={24} strokeWidth={1.6} />
              <span>{label}</span>
              <small>{detail}</small>
            </button>
          ))}
        </nav>

        <div className="intro-profile">
          <span>Welcome back, Anare</span>
          <strong>Build. Trade. Rewrite fate.</strong>
        </div>
      </section>
    </main>
  )
}
