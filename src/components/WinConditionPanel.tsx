import { Trophy } from 'lucide-react'

interface WinConditionPanelProps {
  opponentAvailable: number
  playerAvailable: number
}

export function WinConditionPanel({ opponentAvailable, playerAvailable }: WinConditionPanelProps) {
  return (
    <section className="side-panel win-panel">
      <div className="panel-title">Victory Condition</div>
      <div className="win-panel__body">
        <Trophy size={22} />
        <p>Exhaust the opponent's deck and hand. Captured cards are removed from their playable pool.</p>
      </div>
      <div className="win-panel__meters">
        <span>
          Enemy pool
          <strong>{opponentAvailable}</strong>
        </span>
        <span>
          Your pool
          <strong>{playerAvailable}</strong>
        </span>
      </div>
    </section>
  )
}
