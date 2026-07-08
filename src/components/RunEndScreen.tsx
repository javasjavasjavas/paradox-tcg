import { AnimatePresence, motion } from 'framer-motion'
import { AtSign, House, RotateCcw, Save, Users, X } from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import victoryBackgroundUrl from '../assets/ui/victory-bg.jpg'
import type { StageData } from '../data/stages'

interface RunEndScreenProps {
  mode: 'game-over' | 'victory'
  opponent: StageData
  defeatedStages: StageData[]
  leaderboardNotice?: string | null
  leaderboardStatus?: 'idle' | 'submitting' | 'submitted' | 'error'
  score: number
  onMainMenu: () => void
  onSaveScore: (xHandle?: string | null) => Promise<boolean> | boolean
  onTryAgain: () => void
}

export function RunEndScreen({
  mode,
  opponent,
  defeatedStages,
  leaderboardNotice,
  leaderboardStatus = 'idle',
  score,
  onMainMenu,
  onSaveScore,
  onTryAgain,
}: RunEndScreenProps) {
  const [noticeId, setNoticeId] = useState(0)
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false)
  const [xHandleDraft, setXHandleDraft] = useState('')
  const isVictory = mode === 'victory'
  const defeatedCount = defeatedStages.length
  const headline = isVictory ? 'VICTORY!' : 'GAME OVER'
  const copy = isVictory
    ? 'ALL RIVAL SIGNALS HAVE BEEN BROKEN. THE RUN IS COMPLETE.'
    : `${opponent.name.toUpperCase()} BROKE YOUR DECK. REBUILD THE ROUTE AND TRY AGAIN.`
  const isSubmittingScore = leaderboardStatus === 'submitting'
  const saveButtonDetail = isSubmittingScore
    ? 'SYNCING SCORE'
    : leaderboardStatus === 'submitted'
      ? 'SCORE SAVED'
      : 'LEADERBOARD LINK'
  const noticeText =
    leaderboardNotice ?? 'SAVE YOUR FINAL SCORE TO THE LEADERBOARD. X HANDLE IS OPTIONAL.'

  function handleOpenScoreModal() {
    setNoticeId(0)
    setIsScoreModalOpen(true)
  }

  async function handleSaveScoreClick() {
    const saved = await onSaveScore(xHandleDraft)
    if (!saved) {
      setNoticeId((current) => current + 1)
      return
    }

    setIsScoreModalOpen(false)
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
            disabled={isSubmittingScore}
            onClick={handleOpenScoreModal}
          >
            <Save size={20} strokeWidth={1.8} />
            <span>SAVE SCORE</span>
            <small>{saveButtonDetail}</small>
          </button>

          <button type="button" className="intro-menu__item" onClick={onMainMenu}>
            <House size={20} strokeWidth={1.8} />
            <span>MAIN MENU</span>
            <small>EXIT RUN</small>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {noticeId > 0 ? (
            <motion.div
              key={noticeId}
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

      <AnimatePresence>
        {isScoreModalOpen ? (
          <motion.div
            className="run-end-screen__score-modal-backdrop"
            role="presentation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !isSubmittingScore) {
                setIsScoreModalOpen(false)
              }
            }}
          >
            <motion.section
              className="run-end-screen__score-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="save-score-title"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <button
                type="button"
                className="run-end-screen__score-modal-close"
                aria-label="Close save score"
                disabled={isSubmittingScore}
                onClick={() => setIsScoreModalOpen(false)}
              >
                <X size={22} strokeWidth={1.8} />
              </button>

              <div className="run-end-screen__score-modal-heading">
                <Save size={20} strokeWidth={1.8} />
                <span>LEADERBOARD SYNC</span>
              </div>

              <h2 id="save-score-title">SAVE SCORE</h2>
              <p>ENTER YOUR X HANDLE IF YOU WANT IT SHOWN. LEAVE IT BLANK TO SAVE WITH WALLET ONLY.</p>

              <label className="run-end-screen__score-input">
                <span>X HANDLE OPTIONAL</span>
                <div>
                  <AtSign size={18} strokeWidth={1.8} />
                  <input
                    type="text"
                    autoComplete="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="handle"
                    value={xHandleDraft}
                    disabled={isSubmittingScore}
                    onChange={(event) => setXHandleDraft(event.target.value)}
                  />
                </div>
              </label>

              <button
                type="button"
                className="intro-menu__item intro-menu__item--primary run-end-screen__score-submit"
                disabled={isSubmittingScore}
                onClick={() => void handleSaveScoreClick()}
              >
                <Save size={18} strokeWidth={1.8} />
                <span>{isSubmittingScore ? 'SAVING SCORE' : 'CONTINUE'}</span>
                <small>{xHandleDraft.trim() ? 'WITH X HANDLE' : 'WALLET ONLY'}</small>
              </button>
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  )
}
