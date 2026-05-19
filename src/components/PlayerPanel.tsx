import { Cpu, User } from 'lucide-react'
import opponentPortraitUrl from '../assets/portraits/opponent-face.png'
import playerPortraitUrl from '../assets/portraits/player-face.png'
import type { CardData, PlayerId } from '../game/gameTypes'

const CHARACTER_NAMES: Record<PlayerId, string> = {
  player: 'Aware',
  opponent: 'Arcade Hero',
}

interface PlayerPanelProps {
  player: PlayerId
  title: string
  featuredCard: CardData | null
  deckCount: number
  capturedCount: number
  isActive: boolean
}

export function PlayerPanel({
  player,
  title,
  featuredCard,
  deckCount,
  capturedCount,
  isActive,
}: PlayerPanelProps) {
  const Icon = player === 'player' ? User : Cpu
  const portraitUrl = player === 'player' ? playerPortraitUrl : opponentPortraitUrl
  const characterName = CHARACTER_NAMES[player]

  return (
    <section className="side-panel player-panel" data-active={isActive}>
      <div className="panel-title">{title}</div>
      <div className="player-panel__identity">
        <Icon size={18} />
        <div>
          <strong>{characterName}</strong>
          <span>Rank {featuredCard?.rarity ?? '--'}</span>
        </div>
      </div>
      <div className="player-panel__preview">
        <div className="player-panel__portrait">
          <img
            src={portraitUrl}
            alt={`${characterName} portrait`}
            draggable={false}
          />
        </div>
      </div>
      <div className="player-panel__counts">
        <div className="player-panel__count">
          <i className="player-panel__count-icon player-panel__count-icon--deck" aria-hidden="true">
            <b />
          </i>
          <strong>{deckCount}</strong>
          <em>Deck</em>
        </div>
        <div className="player-panel__count">
          <i
            className="player-panel__count-icon player-panel__count-icon--captured"
            aria-hidden="true"
          >
            <b />
          </i>
          <strong>{capturedCount}</strong>
          <em>Captured</em>
        </div>
      </div>
    </section>
  )
}
