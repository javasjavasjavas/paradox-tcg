import { motion } from 'framer-motion'
import { STAT_LABELS } from '../game/gameConfig'
import type { CardData, StatKey } from '../game/gameTypes'
import { StatIcon } from './StatIcon'

interface StatSelectorProps {
  blockedStat?: StatKey | null
  card: CardData | null
  selectedStat: StatKey | null
  disabled?: boolean
  onSelect: (stat: StatKey) => void
}

const statKeys: StatKey[] = ['attack', 'defense', 'wisdom', 'charisma']

export function StatSelector({
  blockedStat = null,
  card,
  selectedStat,
  disabled = false,
  onSelect,
}: StatSelectorProps) {
  const isReady = Boolean(card && !disabled)
  const showBlockedNotice = Boolean(isReady && blockedStat)

  return (
    <section className="stat-selector" data-ready={isReady}>
      <div className="zone-title zone-title--compact" data-ready={isReady}>
        <span>Choose your Stat to Battle</span>
        <strong>{card ? card.name : 'No card'}</strong>
        {showBlockedNotice ? (
          <motion.span
            className="stat-selector__notice"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            Choose another stat this turn.
          </motion.span>
        ) : null}
      </div>
      <div className="stat-selector__grid">
        {statKeys.map((stat) => {
          const isBlocked = blockedStat === stat
          const isDisabled = disabled || !card || isBlocked

          return (
            <motion.button
              type="button"
              className="stat-button"
              disabled={isDisabled}
              key={stat}
              onClick={() => onSelect(stat)}
              whileHover={!isDisabled ? { y: -3, scale: 1.02 } : undefined}
              whileTap={!isDisabled ? { scale: 0.97 } : undefined}
              data-active={selectedStat === stat}
              data-blocked={isBlocked}
            >
              <StatIcon stat={stat} />
              <span>{STAT_LABELS[stat]}</span>
              <strong>{card?.stats[stat] ?? '--'}</strong>
            </motion.button>
          )
        })}
      </div>
    </section>
  )
}
