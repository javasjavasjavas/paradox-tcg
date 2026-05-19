import { Archive } from 'lucide-react'

interface CapturedPileProps {
  label: string
  count: number
}

export function CapturedPile({ label, count }: CapturedPileProps) {
  return (
    <div className="pile pile--captured">
      <div className="pile__cards pile__cards--captured" aria-hidden="true">
        <span />
        <span />
      </div>
      <div>
        <span className="micro-label">{label}</span>
        <strong>{count}</strong>
        <small>
          <Archive size={13} /> taken
        </small>
      </div>
    </div>
  )
}
