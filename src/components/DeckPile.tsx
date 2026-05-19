import { Layers } from 'lucide-react'

interface DeckPileProps {
  label: string
  count: number
}

export function DeckPile({ label, count }: DeckPileProps) {
  return (
    <div className="pile pile--deck">
      <div className="pile__cards" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div>
        <span className="micro-label">{label}</span>
        <strong>{count}</strong>
        <small>
          <Layers size={13} /> cards
        </small>
      </div>
    </div>
  )
}
