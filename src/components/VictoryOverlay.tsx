import { motion } from 'framer-motion'
import { RotateCcw, Trophy } from 'lucide-react'
import type { GameState } from '../game/gameTypes'

interface VictoryOverlayProps {
  state: GameState
  onRestart: () => void
}

export function VictoryOverlay({ state, onRestart }: VictoryOverlayProps) {
  if (!state.winner) return null

  const isPlayerWinner = state.winner === 'player'

  return (
    <motion.div
      className="victory-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="victory-overlay__panel"
        initial={{ scale: 0.88, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      >
        <Trophy size={46} />
        <span>{isPlayerWinner ? 'Victory' : 'Defeat'}</span>
        <h2>{isPlayerWinner ? 'You exhausted the enemy pool' : 'Opponent exhausted your pool'}</h2>
        <p>
          You captured {state.playerCaptured.length} cards. Opponent captured{' '}
          {state.opponentCaptured.length} cards.
        </p>
        <button type="button" className="primary-action" onClick={onRestart}>
          <RotateCcw size={18} />
          New Match
        </button>
      </motion.div>
    </motion.div>
  )
}
