import { Cpu, User } from 'lucide-react'
import opponentPortraitUrl from '../assets/portraits/remote-viewer-face.png'
import playerPortraitUrl from '../assets/portraits/player-face.png'
import type { CardData, PlayerId } from '../game/gameTypes'

const CHARACTER_NAMES: Record<PlayerId, string> = {
  player: 'AWARE',
  opponent: 'REMOTE VIEWER',
}

interface PlayerPanelProps {
  player: PlayerId
  title: string
  featuredCard: CardData | null
  deckCount: number
  isActive: boolean
  characterName?: string
  portraitUrl?: string
}

export function PlayerPanel({
  player,
  title,
  featuredCard,
  deckCount,
  isActive,
  characterName: characterNameOverride,
  portraitUrl: portraitUrlOverride,
}: PlayerPanelProps) {
  const Icon = player === 'player' ? User : Cpu
  const defaultPortraitUrl = player === 'player' ? playerPortraitUrl : opponentPortraitUrl
  const portraitUrl = portraitUrlOverride ?? defaultPortraitUrl
  const characterName = characterNameOverride ?? CHARACTER_NAMES[player]

  return (
    <section className="side-panel player-panel" data-active={isActive}>
      <div className="panel-title">{title}</div>
      <div className="player-panel__identity">
        <Icon size={18} />
        <div>
          <strong>{characterName}</strong>
          <span>RANK {featuredCard?.rarity.toUpperCase() ?? '--'}</span>
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
          <em>DECK</em>
        </div>
      </div>
    </section>
  )
}
