import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { StageData } from '../data/stages'

interface StageIntroScreenProps {
  stage: StageData
  onStartMatch: () => void
}

export function StageIntroScreen({ stage, onStartMatch }: StageIntroScreenProps) {
  return (
    <main
      className="stage-intro"
      style={{ '--stage-bg': `url(${stage.backgroundUrl})` } as CSSProperties}
    >
      <section className="stage-intro__content" aria-label="Stage introduction">
        <motion.div
          className="stage-intro__headline"
          initial={{ opacity: 0, x: -48, filter: 'blur(10px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.72, ease: 'easeOut', delay: 0.12 }}
        >
          <span>STAGE {stage.stage}</span>
        </motion.div>

        <motion.div
          className="stage-intro__opponent"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, ease: 'easeOut', delay: 0.34 }}
        >
          <span>OPPONENT</span>
          <strong>{stage.name}</strong>
          <p>{stage.lore.toUpperCase()}</p>
        </motion.div>

        <motion.button
          type="button"
          className="intro-menu__item intro-menu__item--primary stage-intro__start"
          onClick={onStartMatch}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut', delay: 0.58 }}
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Play size={24} strokeWidth={1.8} />
          <span>START MATCH</span>
          <small>RIVAL LINK READY</small>
        </motion.button>
      </section>
    </main>
  )
}
