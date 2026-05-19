import type { PlayerId } from '../game/gameTypes'

interface StatusPanelProps {
  title: string
  deckCount: number
  capturedCount: number
  turnNumber: number
  activePlayer: PlayerId
  owner: PlayerId
}

export function StatusPanel({
  title,
  deckCount,
  capturedCount,
  turnNumber,
  activePlayer,
  owner,
}: StatusPanelProps) {
  return (
    <section className="side-panel status-panel">
      <div className="panel-title">{title}</div>
      <div className="status-panel__metrics">
        <span>
          <strong>{deckCount.toString().padStart(2, '0')}</strong>
          Deck
        </span>
        <span>
          <strong>{capturedCount.toString().padStart(2, '0')}</strong>
          Captured
        </span>
      </div>
      <div className="status-panel__round">
        <span>Round</span>
        <strong>{Math.ceil(turnNumber / 2).toString().padStart(2, '0')}</strong>
      </div>
      <div className="status-panel__turn" data-active={activePlayer === owner}>
        <span>Turn</span>
        <strong>{turnNumber.toString().padStart(2, '0')}</strong>
        <em>{activePlayer === owner ? (owner === 'player' ? 'You' : 'Opponent') : 'Standby'}</em>
      </div>
    </section>
  )
}
