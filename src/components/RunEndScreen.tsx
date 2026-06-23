import { AnimatePresence, motion } from 'framer-motion'
import { House, RotateCcw, Users } from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import type { StageData } from '../data/stages'
import victoryBackgroundUrl from '../assets/ui/victory-bg.jpg'

interface RunEndScreenProps {
  mode: 'game-over' | 'victory'
  opponent: StageData
  defeatedStages: StageData[]
  leaderboardNotice?: string | null
  leaderboardStatus?: 'idle' | 'authenticating' | 'submitting' | 'submitted' | 'error'
  score: number
  xHandle?: string | null
  onConnectX: () => Promise<void> | void
  onMainMenu: () => void
  onTryAgain: () => void
}

export function RunEndScreen({
  mode,
  opponent,
  defeatedStages,
  leaderboardNotice,
  leaderboardStatus = 'idle',
  score,
  xHandle,
  onConnectX,
  onMainMenu,
  onTryAgain,
}: RunEndScreenProps) {
  const [connectNoticeId, setConnectNoticeId] = useState(0)
  const isVictory = mode === 'victory'
  const defeatedCount = defeatedStages.length
  const headline = isVictory ? 'VICTORY!' : 'GAME OVER'
  const copy = isVictory
    ? 'ALL RIVAL SIGNALS HAVE BEEN BROKEN. THE RUN IS COMPLETE.'
    : `${opponent.name.toUpperCase()} BROKE YOUR DECK. REBUILD THE ROUTE AND TRY AGAIN.`
  const isConnectingX = leaderboardStatus === 'authenticating'
  const isSubmittingScore = leaderboardStatus === 'submitting'
  const isConnectDisabled = isConnectingX || isSubmittingScore
  const connectButtonLabel = xHandle ? 'SUBMIT SCORE' : 'CONNECT X'
  const connectButtonDetail = isConnectingX
    ? 'X AUTH'
    : isSubmittingScore
      ? 'SYNCING SCORE'
      : leaderboardStatus === 'submitted'
        ? 'SCORE LINKED'
        : xHandle
          ? xHandle
          : 'LEADERBOARD LINK'
  const noticeText =
    leaderboardNotice ??
    (xHandle ? 'X CONNECTED. SCORE READY FOR THE LEADERBOARD.' : 'CONNECT X TO CLAIM THE SCORE.')

  async function handleConnectXClick() {
    await onConnectX()
    setConnectNoticeId((current) => current + 1)
  }

  return (
    <main
      className={`run-end-screen run-end-screen--${mode}`}
      style={
        {
          '--run-bg': `url(${isVictory ? victoryBackgroundUrl : opponent.backgroundUrl})`,
        } as CSSProperties
      }
    >
      <motion.section
        className="run-end-screen__content"
        initial={{ opacity: 0, y: 28, filter: 'blur(14px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <h1>{headline}</h1>
        <p>{copy}</p>

        <div className="run-end-screen__summary" aria-label="RUN SUMMARY">
          <article>
            <span>TOTAL SCORE</span>
            <strong>{score.toLocaleString('en-US')}</strong>
            <em>RUN TOTAL</em>
          </article>

          <article>
            <span>CHARACTERS DEFEATED</span>
            <strong>{defeatedCount}</strong>
            <em>RIVALS CLEARED</em>
          </article>
        </div>

        {defeatedStages.length ? (
          <section className="run-end-screen__defeated" aria-label="DEFEATED CHARACTERS">
            <div className="run-end-screen__section-title">
              <Users size={16} strokeWidth={1.8} />
              <span>DEFEATED CHARACTERS</span>
            </div>

            <div className="run-end-screen__defeated-list">
              {defeatedStages.map((stage) => (
                <span key={stage.id}>
                  <img src={stage.portraitUrl} alt="" />
                  {stage.name.toUpperCase()}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <div className="run-end-screen__actions">
          {isVictory ? (
            <button
              type="button"
              className="intro-menu__item intro-menu__item--primary"
              onClick={onTryAgain}
            >
              <RotateCcw size={20} strokeWidth={1.8} />
              <span>PLAY AGAIN</span>
              <small>NEW RUN</small>
            </button>
          ) : null}

          <button
            type="button"
            className="intro-menu__item"
            disabled={isConnectDisabled}
            onClick={() => void handleConnectXClick()}
          >
            <span className="run-end-screen__x-icon" aria-hidden="true" />
            <span>{connectButtonLabel}</span>
            <small>{connectButtonDetail}</small>
          </button>

          <button type="button" className="intro-menu__item" onClick={onMainMenu}>
            <House size={20} strokeWidth={1.8} />
            <span>MAIN MENU</span>
            <small>EXIT RUN</small>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {connectNoticeId > 0 ? (
            <motion.div
              key={connectNoticeId}
              className="run-end-screen__connect-notice"
              role="status"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {noticeText}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.section>

    </main>
  )
}
