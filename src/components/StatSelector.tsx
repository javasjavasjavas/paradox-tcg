import { motion } from 'framer-motion'
import { STAT_LABELS } from '../game/gameConfig'
import type { CardData, StatKey } from '../game/gameTypes'
import { StatIcon } from './StatIcon'

interface StatSelectorProps {
  card: CardData | null
  selectedStat: StatKey | null
  disabled?: boolean
  onSelect: (stat: StatKey) => void
}

const statKeys: StatKey[] = ['attack', 'defense', 'wisdom', 'charisma']

export function StatSelector({ card, selectedStat, disabled = false, onSelect }: StatSelectorProps) {
  const isReady = Boolean(card && !disabled)

  return (
    <section className="stat-selector" data-ready={isReady}>
      <div className="zone-title zone-title--compact" data-ready={isReady}>
        <span>Choose your Stat to Battle</span>
        <strong>{card ? card.name : 'No card'}</strong>
      </div>
      <div className="stat-selector__grid">
        {statKeys.map((stat) => (
          <motion.button
            type="button"
            className="stat-button"
            disabled={disabled || !card}
            key={stat}
            onClick={() => onSelect(stat)}
            whileHover={!disabled && card ? { y: -3, scale: 1.02 } : undefined}
            whileTap={!disabled && card ? { scale: 0.97 } : undefined}
            data-active={selectedStat === stat}
          >
            <StatIcon stat={stat} />
            <span>{STAT_LABELS[stat]}</span>
            <strong>{card?.stats[stat] ?? '--'}</strong>
          </motion.button>
        ))}
      </div>
    </section>
  )
}
