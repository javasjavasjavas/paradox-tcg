import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, ChevronRight, Plus, Sparkles, X } from 'lucide-react'
import { useEffect, useState, type CSSProperties } from 'react'
import { Card } from './Card'
import type { GameState } from '../game/gameTypes'

interface VictoryOverlayProps {
  state: GameState
  stageNumber: number
  stageBackgroundUrl: string
  isFinalStage: boolean
  onAddReward: () => void
  onDiscardReward: () => void
  onNextStage: () => void
}

export function VictoryOverlay({
  state,
  stageNumber,
  stageBackgroundUrl,
  isFinalStage,
  onAddReward,
  onDiscardReward,
  onNextStage,
}: VictoryOverlayProps) {
  const [nextStageNoticeId, setNextStageNoticeId] = useState(0)

  const playerDeckCount = state.playerDeck.length + state.playerHand.length
  const opponentDeckCount = state.opponentDeck.length + state.opponentHand.length
  const reward = state.stageReward
  const rewardPending = Boolean(reward && reward.status === 'pending')
  const rewardAdded = reward?.status === 'added'
  const rewardDiscarded = reward?.status === 'discarded'
  const rewardRarityLabel = reward?.card.rarity.toUpperCase() ?? 'RARE'
  const showNextStageNotice = rewardPending && nextStageNoticeId > 0

  useEffect(() => {
    if (!showNextStageNotice) return

    const timer = window.setTimeout(() => {
      setNextStageNoticeId(0)
    }, 2600)

    return () => window.clearTimeout(timer)
  }, [showNextStageNotice, nextStageNoticeId])

  function handleNextStageClick() {
    if (rewardPending) {
      setNextStageNoticeId((current) => current + 1)
      return
    }

    onNextStage()
  }

  if (state.winner !== 'player') return null

  return (
    <motion.main
      className="victory-overlay stage-clear"
      style={{ '--stage-bg': `url(${stageBackgroundUrl})` } as CSSProperties}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.section
        className="stage-clear__frame"
        initial={{ opacity: 0, y: 28, filter: 'blur(12px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.52, ease: 'easeOut' }}
      >
        <div className="stage-clear__copy">
          <h2>{`STAGE ${stageNumber} CLEAR`}</h2>

          <div className="stage-clear__reward-dock">
            <p className="stage-clear__reward-copy">
              THE OPPONENT HAS BEEN DEFEATED. YOUR DECK GROWS STRONGER.
            </p>

            <div className="stage-clear__rewards" aria-label="MATCH REWARDS">
              <article className="stage-clear__reward-box">
                <span>CARDS OBTAINED</span>
                <strong>+1</strong>
                <em>{rewardAdded ? 'ADDED' : rewardDiscarded ? 'DISCARDED' : `${rewardRarityLabel} SIGNAL`}</em>
              </article>

              <article className="stage-clear__reward-box stage-clear__reward-box--score">
                <span>SCORE OBTAINED</span>
                <strong>+{state.scoreObtained}</strong>
                <em>FINAL DECK {playerDeckCount} / ENEMY {opponentDeckCount}</em>
              </article>
            </div>

            <div className="stage-clear__next-wrap">
              <AnimatePresence mode="wait">
                {showNextStageNotice ? (
                  <motion.div
                    id="stage-clear-next-tooltip"
                    className="stage-clear__next-tooltip"
                    key={nextStageNoticeId}
                    role="status"
                    initial={{ opacity: 0, y: 10, scale: 0.96, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: 8, scale: 0.98, filter: 'blur(8px)' }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                  >
                    <AlertTriangle size={17} strokeWidth={1.8} />
                    <span>CHOOSE THE CARD FATE FIRST. ADD IT TO YOUR DECK OR DISCARD IT TO CONTINUE.</span>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <button
                type="button"
                className="intro-menu__item intro-menu__item--primary stage-clear__next"
                aria-describedby={showNextStageNotice ? 'stage-clear-next-tooltip' : undefined}
                aria-disabled={rewardPending}
                data-locked={rewardPending}
                onClick={handleNextStageClick}
              >
                <ChevronRight size={22} strokeWidth={1.8} />
                <span>{isFinalStage ? 'VICTORY' : 'NEXT STAGE'}</span>
                <small>
                  {rewardPending ? 'CHOOSE REWARD' : isFinalStage ? 'FINAL RESULT' : 'RIVAL LINK READY'}
                </small>
              </button>

            </div>
          </div>
        </div>

        {reward ? (
          <motion.aside
            className="stage-clear__card-panel"
            aria-label="RARE CARD REWARD"
            initial={{ opacity: 0, x: 42, scale: 0.95, filter: 'blur(12px)' }}
            animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.58, ease: 'easeOut', delay: 0.16 }}
          >
            <div className="stage-clear__reward-particles" aria-hidden="true">
              {Array.from({ length: 34 }, (_, index) => (
                <i key={index} />
              ))}
            </div>

            <div className="stage-clear__card-heading">
              <Sparkles size={18} strokeWidth={1.8} />
              <span>{rewardRarityLabel} CARD UNLOCKED</span>
            </div>

            <motion.div
              className="stage-clear__card"
              initial={{ opacity: 0, y: 26, rotateY: -10, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, rotateY: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 140, damping: 18, delay: 0.26 }}
            >
              <Card card={reward.card} size="inspect" />
            </motion.div>

            <div className="stage-clear__card-actions">
              <button
                type="button"
                className="collection-card__deck-toggle"
                data-selected={rewardAdded}
                disabled={!rewardPending}
                onClick={onAddReward}
              >
                <Plus size={16} strokeWidth={1.8} />
                <span>{rewardAdded ? 'ADDED TO DECK' : 'ADD TO DECK'}</span>
              </button>

              <button
                type="button"
                className="collection-card__deck-toggle stage-clear__discard"
                data-selected={rewardDiscarded}
                disabled={!rewardPending}
                onClick={onDiscardReward}
              >
                <X size={16} strokeWidth={1.8} />
                <span>{rewardDiscarded ? 'DISCARDED' : 'DISCARD'}</span>
              </button>
            </div>
          </motion.aside>
        ) : null}
      </motion.section>
    </motion.main>
  )
}
