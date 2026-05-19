interface RoundPanelProps {
  turnNumber: number
}

export function RoundPanel({ turnNumber }: RoundPanelProps) {
  const roundNumber = Math.ceil(turnNumber / 2).toString().padStart(2, '0')

  return (
    <section className="side-panel round-panel">
      <div className="panel-title">Round</div>
      <div className="round-panel__body">
        <span>Current Round</span>
        <strong>{roundNumber}</strong>
      </div>
    </section>
  )
}
