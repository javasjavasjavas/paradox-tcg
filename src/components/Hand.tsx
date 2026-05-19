import { AnimatePresence, motion } from 'framer-motion'
import { Card } from './Card'
import type { CardData } from '../game/gameTypes'

interface HandProps {
  label: string
  cards: CardData[]
  faceDown?: boolean
  selectable?: boolean
  selectedCardId?: string | null
  onCardClick?: (card: CardData) => void
  onCardInspect?: (card: CardData) => void
}

export function Hand({
  label,
  cards,
  faceDown = false,
  selectable = false,
  selectedCardId = null,
  onCardClick,
  onCardInspect,
}: HandProps) {
  const emptySlots = Math.max(0, 5 - cards.length)

  return (
    <section className={`hand-zone ${faceDown ? 'hand-zone--opponent' : 'hand-zone--player'}`}>
      <div className="zone-title">
        <span>{label}</span>
        <strong>{cards.length} / 5</strong>
      </div>
      <div className="hand-zone__cards">
        <AnimatePresence initial={false}>
          {cards.map((card, index) => (
            <motion.div
              className="hand-zone__card-wrap"
              key={card.id}
              initial={{ opacity: 0, y: faceDown ? -20 : 20, scale: 0.86 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: faceDown ? 20 : -20, scale: 0.78 }}
              transition={{ delay: index * 0.035, type: 'spring', stiffness: 360, damping: 34 }}
            >
              <Card
                card={card}
                faceDown={faceDown}
                size="hand"
                disabled={!selectable}
                selected={selectedCardId === card.id}
                onClick={selectable ? onCardClick : undefined}
                onContextMenu={!faceDown ? onCardInspect : undefined}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        {Array.from({ length: emptySlots }).map((_, index) => (
          <div className="hand-zone__empty" key={`empty-${index}`} />
        ))}
      </div>
    </section>
  )
}
