import { motion } from 'framer-motion'
import { STAT_LABELS } from '../game/gameConfig'
import type { GameState } from '../game/gameTypes'
import { Card } from './Card'
import { ParticleField } from './FX/ParticleField'
import { GlitchText } from './FX/GlitchText'

interface BattleArenaProps {
  state: GameState
}

export function BattleArena({ state }: BattleArenaProps) {
  const { arena, selectedStat, battleResult, phase } = state
  const playerValue = selectedStat && arena.playerCard ? arena.playerCard.stats[selectedStat] : null
  const opponentValue =
    selectedStat && arena.opponentCard ? arena.opponentCard.stats[selectedStat] : null
  const playerWon = battleResult?.winningPlayer === 'player'
  const comparedStat = battleResult?.tieBreakerStat ?? selectedStat
  const comparedStatLabel = comparedStat ? STAT_LABELS[comparedStat] : null

  return (
    <section className="battle-arena">
      <ParticleField />
      <div className="arena-grid">
        <div className="arena-slot arena-slot--player">
          {arena.playerCard ? (
            <Card
              card={arena.playerCard}
              size="arena"
              winner={battleResult?.winningPlayer === 'player'}
              loser={battleResult?.losingPlayer === 'player'}
            />
          ) : (
            <Card faceDown size="arena" disabled />
          )}
        </div>

        <div className="comparison-core">
          <div className="arena-heading">
            <span />
            <h1>Battle Arena</h1>
            <span />
          </div>

          <div className="comparison-core__numbers">
            <motion.div
              className="comparison-core__value"
              data-side="player"
              key={`p-${playerValue ?? 'empty'}-${phase}`}
              initial={{ scale: 0.74, opacity: 0.45 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <strong>
                {battleResult?.tieBreakerStat && arena.playerCard
                  ? arena.playerCard.stats[battleResult.tieBreakerStat]
                  : playerValue ?? '--'}
              </strong>
              {comparedStatLabel ? <em>{comparedStatLabel}</em> : null}
            </motion.div>
            <span>VS</span>
            <motion.div
              className="comparison-core__value"
              data-side="opponent"
              key={`o-${opponentValue ?? 'empty'}-${phase}`}
              initial={{ scale: 0.74, opacity: 0.45 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <strong>
                {battleResult?.tieBreakerStat && arena.opponentCard
                  ? arena.opponentCard.stats[battleResult.tieBreakerStat]
                  : opponentValue ?? '--'}
              </strong>
              {comparedStatLabel ? <em>{comparedStatLabel}</em> : null}
            </motion.div>
          </div>

          {phase === 'capture_animation' && battleResult ? (
            <motion.div
              className="battle-outcome"
              data-result={playerWon ? 'win' : 'lose'}
              initial={{ opacity: 0, y: 10, scale: 0.86 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.34, ease: 'easeOut' }}
            >
              {playerWon ? 'You Win!' : 'You Lose!'}
            </motion.div>
          ) : null}

          <div className="comparison-core__message">
            <GlitchText active={phase === 'capture_animation'}>
              {battleResult
                ? `${battleResult.winningCard.name} wins`
                : phase === 'battle_reveal'
                  ? 'Revealing cards'
                  : 'Awaiting combatants'}
              </GlitchText>
            </div>
        </div>

        <div className="arena-slot arena-slot--opponent">
          {arena.opponentCard ? (
            <Card
              card={arena.opponentCard}
              size="arena"
              winner={battleResult?.winningPlayer === 'opponent'}
              loser={battleResult?.losingPlayer === 'opponent'}
            />
          ) : (
            <Card faceDown size="arena" disabled />
          )}
        </div>
      </div>
    </section>
  )
}
