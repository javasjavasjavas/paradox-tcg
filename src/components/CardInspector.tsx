import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import type { CardData } from '../game/gameTypes'
import { Card } from './Card'

interface CardInspectorProps {
  card: CardData | null
  onClose: () => void
}

export function CardInspector({ card, onClose }: CardInspectorProps) {
  useEffect(() => {
    if (!card) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [card, onClose])

  return (
    <AnimatePresence>
      {card ? (
        <motion.div
          className="card-inspector"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          onContextMenu={(event) => {
            event.preventDefault()
            onClose()
          }}
        >
          <motion.div
            className="card-inspector__content"
            initial={{ opacity: 0, y: 28, scale: 0.82, rotateX: 10 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, y: 18, scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 240, damping: 24 }}
            onClick={(event) => event.stopPropagation()}
          >
            <button className="card-inspector__close" type="button" onClick={onClose} aria-label="Close card preview">
              <X size={22} />
            </button>
            <Card
              card={card}
              size="inspect"
              onContextMenu={(_, event) => event.preventDefault()}
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
