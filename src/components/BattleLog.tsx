import { AnimatePresence, motion } from 'framer-motion'
import type { BattleLogEntry } from '../game/gameTypes'

interface BattleLogProps {
  entries: BattleLogEntry[]
}

export function BattleLog({ entries }: BattleLogProps) {
  return (
    <section className="side-panel battle-log">
      <div className="panel-title">Battle Log</div>
      <div className="battle-log__entries">
        <AnimatePresence initial={false}>
          {[...entries].reverse().map((entry) => (
            <motion.div
              className="battle-log__entry"
              data-tone={entry.tone}
              key={entry.id}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
            >
              <span>Turn {entry.turn.toString().padStart(2, '0')}</span>
              <p>{entry.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  )
}
