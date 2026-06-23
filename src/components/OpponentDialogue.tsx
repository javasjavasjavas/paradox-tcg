import { motion } from 'framer-motion'
import { Radio } from 'lucide-react'
import type { OpponentDialogue as OpponentDialogueData } from '../game/gameTypes'

interface OpponentDialogueProps {
  dialogue: OpponentDialogueData
  opponentName: string
}

export function OpponentDialogue({ dialogue, opponentName }: OpponentDialogueProps) {
  return (
    <motion.aside
      className="opponent-dialogue"
      data-tone={dialogue.tone}
      initial={{ opacity: 0, y: -16, scale: 0.94, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -10, scale: 0.96, filter: 'blur(10px)' }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      role="status"
    >
      <span className="opponent-dialogue__tail" aria-hidden="true" />
      <div className="opponent-dialogue__signal">
        <Radio size={16} strokeWidth={1.8} />
        <span>{opponentName.toUpperCase()}</span>
      </div>
      <p>{dialogue.message}</p>
    </motion.aside>
  )
}
