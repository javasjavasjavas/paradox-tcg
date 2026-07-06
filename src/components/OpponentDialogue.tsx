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
      <svg
        className="opponent-dialogue__shape"
        viewBox="0 0 1000 150"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="opponent-dialogue-fill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(83, 5, 43, 0.96)" />
            <stop offset="52%" stopColor="rgba(8, 5, 20, 0.97)" />
            <stop offset="100%" stopColor="rgba(4, 16, 30, 0.94)" />
          </linearGradient>
        </defs>
        <path
          className="opponent-dialogue__shape-path"
          d="M 44 1 H 991 Q 999 1 999 9 V 141 Q 999 149 991 149 H 44 Q 36 149 36 141 V 92 L 1 75 L 36 58 V 9 Q 36 1 44 1 Z"
          fill="url(#opponent-dialogue-fill)"
          stroke="rgba(255, 45, 155, 0.72)"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="opponent-dialogue__signal">
        <Radio size={16} strokeWidth={1.8} />
        <span>{opponentName.toUpperCase()}</span>
      </div>
      <p>{dialogue.message}</p>
    </motion.aside>
  )
}
