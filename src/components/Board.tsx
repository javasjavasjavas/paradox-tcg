import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, House, Music2, SkipForward, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useState, type Dispatch } from 'react'
import { BattleArena } from './BattleArena'
import { BattleLog } from './BattleLog'
import { CardInspector } from './CardInspector'
import { DebugPanel } from './DebugPanel'
import { Hand } from './Hand'
import { OpponentDialogue } from './OpponentDialogue'
import { PlayerPanel } from './PlayerPanel'
import { RoundPanel } from './RoundPanel'
import { StatSelector } from './StatSelector'
import { TurnFlow } from './TurnFlow'
import { VictoryOverlay } from './VictoryOverlay'
import { GAME_CONFIG } from '../game/gameConfig'
import { soundManager } from '../game/soundManager'
import type { CardData, GameAction, GameState, StatKey } from '../game/gameTypes'

interface BoardProps {
  state: GameState
  dispatch: Dispatch<GameAction>
  opponentName: string
  stageNumber: number
  stageBackgroundUrl: string
  opponentPortraitUrl: string
  playerName?: string
  playerPortraitUrl?: string
  skipAnimations: boolean
  debugOpen: boolean
  musicVolume: number
  sfxVolume: number
  isFinalStage: boolean
  onMusicVolumeChange: (volume: number) => void
  onSfxVolumeChange: (volume: number) => void
  onMainMenu: () => void
  onNextStage: () => void
  onVictoryPreview: () => void
  onGameOverPreview: () => void
}

const availableCount = (deck: CardData[], hand: CardData[], arenaCard?: CardData | null) =>
  deck.length + hand.length + (arenaCard ? 1 : 0)

export function Board({
  state,
  dispatch,
  opponentName,
  stageNumber,
  stageBackgroundUrl,
  opponentPortraitUrl,
  playerName,
  playerPortraitUrl,
  skipAnimations,
  debugOpen,
  musicVolume,
  sfxVolume,
  isFinalStage,
  onMusicVolumeChange,
  onSfxVolumeChange,
  onMainMenu,
  onNextStage,
  onVictoryPreview,
  onGameOverPreview,
}: BoardProps) {
  const [inspectedCard, setInspectedCard] = useState<CardData | null>(null)
  const [openAudioPanel, setOpenAudioPanel] = useState<'music' | 'sfx' | null>(null)
  const playerFeatured =
    state.arena.playerCard ?? state.playerHand[0] ?? state.playerDeck[0] ?? null
  const opponentFeatured =
    state.arena.opponentCard ?? state.opponentHand[0] ?? state.opponentDeck[0] ?? null
  const canSelectPlayerCard = state.phase === 'player_select_card'
  const canRespond = state.phase === 'player_responding'
  const playerSelectable = canSelectPlayerCard || canRespond
  const playerBlockedCardIds =
    playerSelectable &&
    state.playerLastPlayedCardId &&
    state.playerHand.length > 1 &&
    state.playerHand.some((card) => card.id !== state.playerLastPlayedCardId)
      ? [state.playerLastPlayedCardId]
      : []
  const playerPoolCount = availableCount(state.playerDeck, state.playerHand, state.arena.playerCard)
  const opponentPoolCount = availableCount(
    state.opponentDeck,
    state.opponentHand,
    state.arena.opponentCard,
  )
  const blockedStat =
    state.phase === 'player_select_stat' &&
    state.playerStatStreak.count >= GAME_CONFIG.maxRepeatedStatSelections
      ? state.playerStatStreak.stat
      : null

  useEffect(() => {
    if (!state.statLimitNotice) return

    soundManager.play('warning')

    const noticeId = state.statLimitNotice.id
    const timer = window.setTimeout(() => {
      dispatch({ type: 'clear_stat_limit_notice', noticeId })
    }, 2200)

    return () => window.clearTimeout(timer)
  }, [dispatch, state.statLimitNotice])

  useEffect(() => {
    if (!state.opponentDialogue) return

    const dialogueId = state.opponentDialogue.id
    const timer = window.setTimeout(() => {
      dispatch({ type: 'clear_opponent_dialogue', dialogueId })
    }, 3600)

    return () => window.clearTimeout(timer)
  }, [dispatch, state.opponentDialogue])

  const handlePlayerCardClick = (card: CardData) => {
    soundManager.play('card_move')
    dispatch({
      type: canRespond ? 'select_player_response' : 'select_player_card',
      cardId: card.id,
    })
  }

  const handleStatSelect = (stat: StatKey) => {
    soundManager.play('stat_select')
    dispatch({ type: 'select_stat', stat })
  }

  const forceStageClear = () => dispatch({ type: 'force_stage_clear' })
  const musicPercent = Math.round(musicVolume * 100)
  const sfxPercent = Math.round(sfxVolume * 100)

  const toggleAudioPanel = (panel: 'music' | 'sfx') => {
    if (panel === 'music') {
      void soundManager.startIntroMusic()
    }

    setOpenAudioPanel((current) => (current === panel ? null : panel))
  }

  const matchControls = (
    <section className="side-panel match-options-panel">
      <div className="match-options-panel__body">
        <span className="match-options-panel__label">OPTIONS</span>
        <div className="match-control-dock" aria-label="MATCH CONTROLS">
          <div className="match-control">
            <button
              type="button"
              className="match-control__button"
              aria-label="MUSIC VOLUME"
              aria-expanded={openAudioPanel === 'music'}
              title="Music"
              onClick={() => toggleAudioPanel('music')}
            >
              <Music2 size={15} strokeWidth={1.8} />
            </button>
            <AnimatePresence>
              {openAudioPanel === 'music' ? (
                <motion.div
                  className="match-volume-popover"
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                >
                  <label htmlFor="match-music-volume">
                    <span>MUSIC</span>
                    <strong>{musicPercent}%</strong>
                  </label>
                  <input
                    id="match-music-volume"
                    aria-label="Music volume"
                    type="range"
                    min="0"
                    max="100"
                    value={musicPercent}
                    onChange={(event) =>
                      onMusicVolumeChange(Number(event.currentTarget.value) / 100)
                    }
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="match-control">
            <button
              type="button"
              className="match-control__button"
              aria-label="SFX VOLUME"
              aria-expanded={openAudioPanel === 'sfx'}
              title="SFX"
              onClick={() => toggleAudioPanel('sfx')}
            >
              {sfxVolume > 0 ? (
                <Volume2 size={15} strokeWidth={1.8} />
              ) : (
                <VolumeX size={15} strokeWidth={1.8} />
              )}
            </button>
            <AnimatePresence>
              {openAudioPanel === 'sfx' ? (
                <motion.div
                  className="match-volume-popover"
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                >
                  <label htmlFor="match-sfx-volume">
                    <span>SFX</span>
                    <strong>{sfxPercent}%</strong>
                  </label>
                  <input
                    id="match-sfx-volume"
                    aria-label="SFX volume"
                    type="range"
                    min="0"
                    max="100"
                    value={sfxPercent}
                    onChange={(event) =>
                      onSfxVolumeChange(Number(event.currentTarget.value) / 100)
                    }
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <button
            type="button"
            className="match-control__button"
            aria-label="MAIN MENU"
            title="Main menu"
            onClick={onMainMenu}
          >
            <House size={15} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </section>
  )

  return (
    <main className="game-shell" data-skip-animations={skipAnimations}>
      <div className="app-chrome">
        <div>
          <span className="eyebrow">Mind Reader</span>
          <h1 className="brand-title">
            <span className="brand-title__trading">Trading Card</span>
            <span className="brand-title__battle">Battle</span>
          </h1>
        </div>
      </div>

      <div className="board-frame">
        <aside className="board-column board-column--left">
          <PlayerPanel
            player="opponent"
            title="OPPONENT INFO"
            featuredCard={opponentFeatured}
            deckCount={opponentPoolCount}
            isActive={state.activePlayer === 'opponent'}
            characterName={opponentName.toUpperCase()}
            portraitUrl={opponentPortraitUrl}
          />
          <TurnFlow state={state} />
          <PlayerPanel
            player="player"
            title="PLAYER INFO"
            featuredCard={playerFeatured}
            deckCount={playerPoolCount}
            isActive={state.activePlayer === 'player'}
            characterName={playerName?.toUpperCase()}
            portraitUrl={playerPortraitUrl}
          />
        </aside>

        <section className="board-main">
          <Hand label="OPPONENT HAND" cards={state.opponentHand} faceDown />
          <BattleArena state={state} />
          <StatSelector
            blockedStat={blockedStat}
            card={state.arena.playerCard}
            selectedStat={state.selectedStat}
            disabled={state.phase !== 'player_select_stat'}
            onSelect={handleStatSelect}
          />
          <Hand
            label="YOUR HAND"
            cards={state.playerHand}
            disabledCardIds={playerBlockedCardIds}
            selectable={playerSelectable}
            onCardClick={handlePlayerCardClick}
            onCardInspect={setInspectedCard}
          />
        </section>

        <aside className="board-column board-column--right">
          {matchControls}
          <RoundPanel turnNumber={state.turnNumber} />
          <section className="side-panel match-next-panel">
            <div className="panel-title">TEMPORARY FLOW</div>
            <button
              type="button"
              className="intro-menu__item intro-menu__item--primary match-next-panel__button"
              onClick={forceStageClear}
            >
              <SkipForward size={18} strokeWidth={1.8} />
              <span>NEXT MATCH</span>
              <small>STAGE CLEAR TEST</small>
            </button>
          </section>
          <BattleLog entries={state.log} />
        </aside>
      </div>

      <AnimatePresence>
        {state.opponentDialogue ? (
          <OpponentDialogue
            dialogue={state.opponentDialogue}
            opponentName={opponentName}
            key={state.opponentDialogue.id}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {state.statLimitNotice ? (
          <motion.div
            className="stat-limit-toast"
            initial={{ opacity: 0, y: 18, scale: 0.96, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 12, scale: 0.98, filter: 'blur(8px)' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            role="status"
          >
            <AlertTriangle size={18} strokeWidth={1.8} />
            <span>{state.statLimitNotice.message}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <DebugPanel state={state} open={debugOpen} />
      <CardInspector card={inspectedCard} onClose={() => setInspectedCard(null)} />
      <VictoryOverlay
        state={state}
        stageNumber={stageNumber}
        stageBackgroundUrl={stageBackgroundUrl}
        isFinalStage={isFinalStage}
        onAddReward={() => dispatch({ type: 'add_stage_reward' })}
        onDiscardReward={() => dispatch({ type: 'discard_stage_reward' })}
        onNextStage={onNextStage}
        onVictoryPreview={onVictoryPreview}
        onGameOverPreview={onGameOverPreview}
      />
    </main>
  )
}
