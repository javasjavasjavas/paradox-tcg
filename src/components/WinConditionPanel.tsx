import { Trophy } from 'lucide-react'

interface WinConditionPanelProps {
  opponentAvailable: number
  playerAvailable: number
}

export function WinConditionPanel({ opponentAvailable, playerAvailable }: WinConditionPanelProps) {
  return (
    <section className="side-panel win-panel">
      <div className="panel-title">VICTORY CONDITION</div>
      <div className="win-panel__body">
        <Trophy size={22} />
        <p>WIN ROUNDS TO PULL ENEMY CARDS INTO YOUR DECK. REDUCE THE ENEMY DECK TO ZERO.</p>
      </div>
      <div className="win-panel__meters">
        <span>
          ENEMY DECK
          <strong>{opponentAvailable}</strong>
        </span>
        <span>
          YOUR DECK
          <strong>{playerAvailable}</strong>
        </span>
      </div>
    </section>
  )
}
