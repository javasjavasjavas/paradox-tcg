import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Board } from './components/Board'
import { CollectionScreen } from './components/CollectionScreen'
import { EntryGate } from './components/EntryGate'
import { IntroScreen } from './components/IntroScreen'
import { LeaderboardScreen } from './components/LeaderboardScreen'
import { RunEndScreen } from './components/RunEndScreen'
import { StageIntroScreen } from './components/StageIntroScreen'
import { stages, type StageData } from './data/stages'
import { chooseOpponentResponseCard, chooseOpponentTurn } from './game/ai'
import { GAME_CONFIG } from './game/gameConfig'
import { createInitialState, gameReducer } from './game/gameReducer'
import { soundManager } from './game/soundManager'
import {
  submitLeaderboardRun,
  type LeaderboardRunResult,
  type PendingLeaderboardRun,
} from './supabase/leaderboard'
import { useWalletCollection } from './wallet/useWalletCollection'

const deckStorageKey = 'paradox-tcg.deck-token-ids'
const playerPfpStorageKey = 'paradox-tcg.player-pfp-token-id'
const entryGateMobileQuery = '(max-width: 820px), (pointer: coarse)'
const noTradingCardsMessage = 'YOU NEED AT LEAST ONE TRADING CARD IN THIS WALLET TO PLAY.'

const fastTiming = {
  opponentThinkMs: 160,
  revealMs: 160,
  resolveMs: 160,
  captureMs: 180,
  drawMs: 120,
}

function loadStoredDeckTokenIds() {
  try {
    const stored = window.localStorage.getItem(deckStorageKey)
    const parsed = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed)
      ? parsed
          .filter((tokenId) => typeof tokenId === 'string')
          .slice(0, GAME_CONFIG.deckCoreLimit)
      : []
  } catch {
    return []
  }
}

function loadStoredPlayerPfpTokenId() {
  try {
    return window.localStorage.getItem(playerPfpStorageKey) ?? ''
  } catch {
    return ''
  }
}

function getEntryGateIsMobile() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false
  }

  return window.matchMedia(entryGateMobileQuery).matches
}

function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState)
  const [screen, setScreen] = useState<
    'game_intro' | 'collection' | 'leaderboard' | 'stage_intro' | 'match' | 'game_over' | 'run_victory'
  >('game_intro')
  const [stageIndex, setStageIndex] = useState(0)
  const skipAnimations = false
  const [debugOpen, setDebugOpen] = useState(false)
  const [deckTokenIds, setDeckTokenIds] = useState(loadStoredDeckTokenIds)
  const [selectedPfpTokenId, setSelectedPfpTokenId] = useState(loadStoredPlayerPfpTokenId)
  const [runRewardTokenIds, setRunRewardTokenIds] = useState<string[]>([])
  const [runScore, setRunScore] = useState(0)
  const [defeatedStages, setDefeatedStages] = useState<StageData[]>([])
  const [startGateMessage, setStartGateMessage] = useState<string | null>(null)
  const [musicVolume, setMusicVolume] = useState(() => soundManager.getMusicVolume())
  const [sfxVolume, setSfxVolume] = useState(() => soundManager.getSfxVolume())
  const [leaderboardStatus, setLeaderboardStatus] = useState<
    'idle' | 'submitting' | 'submitted' | 'error'
  >('idle')
  const [leaderboardNotice, setLeaderboardNotice] = useState<string | null>(null)
  const [entryGateAccepted, setEntryGateAccepted] = useState(false)
  const [entryGateIsMobile, setEntryGateIsMobile] = useState(getEntryGateIsMobile)
  const runVictoryCuePlayedRef = useRef(false)
  const wallet = useWalletCollection()
  const timing = skipAnimations ? fastTiming : GAME_CONFIG.timing
  const currentStage = stages[stageIndex] ?? stages[0]
  const ownedTokenIds = useMemo(
    () => wallet.tradingCardNfts.map((nft) => nft.tokenId),
    [wallet.tradingCardNfts],
  )
  const selectedPlayerPfp = useMemo(
    () => wallet.paradoxPfpNfts.find((nft) => nft.tokenId === selectedPfpTokenId) ?? null,
    [selectedPfpTokenId, wallet.paradoxPfpNfts],
  )
  const activeDeckTokenIds = useMemo(() => {
    if (!wallet.connectedWallet || wallet.walletStatus !== 'ready') {
      return deckTokenIds.slice(0, GAME_CONFIG.deckCoreLimit)
    }

    const ownedTokenIdSet = new Set(ownedTokenIds)
    return deckTokenIds
      .filter((tokenId) => ownedTokenIdSet.has(tokenId))
      .slice(0, GAME_CONFIG.deckCoreLimit)
  }, [deckTokenIds, ownedTokenIds, wallet.connectedWallet, wallet.walletStatus])
  const canStartMatch = Boolean(
    wallet.connectedWallet &&
      wallet.walletStatus === 'ready' &&
      wallet.tradingCardNfts.length > 0,
  )
  const startGameDetail = !wallet.connectedWallet
    ? 'WALLET REQUIRED'
    : wallet.walletStatus === 'connecting' || wallet.walletStatus === 'loading_nfts'
      ? 'SCANNING WALLET'
      : wallet.tradingCardNfts.length
        ? `${activeDeckTokenIds.length} DECK CORE`
        : 'TRADING CARD REQUIRED'
  const walletHasNoTradingCards = Boolean(
    screen === 'game_intro' &&
      wallet.connectedWallet &&
      wallet.walletStatus === 'ready' &&
      wallet.tradingCardNfts.length === 0,
  )
  const introGateMessage = walletHasNoTradingCards
    ? noTradingCardsMessage
    : startGateMessage === noTradingCardsMessage
      ? null
      : startGateMessage

  useEffect(() => {
    const mediaQuery = window.matchMedia(entryGateMobileQuery)
    const handleChange = () => setEntryGateIsMobile(mediaQuery.matches)

    handleChange()
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (screen === 'leaderboard') {
      void soundManager.startIntroMusic()
    }
  }, [screen])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'd' && !event.metaKey && !event.ctrlKey) {
        setDebugOpen((current) => !current)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const isDisabledTarget = (element: HTMLElement) =>
      element.matches('button:disabled, [aria-disabled="true"], [data-locked="true"], .is-disabled')

    const containsRelatedTarget = (element: HTMLElement, relatedTarget: EventTarget | null) =>
      relatedTarget instanceof Node && element.contains(relatedTarget)

    const getInteractiveTarget = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return null

      return target.closest('button, [role="button"], a[href]') as HTMLElement | null
    }

    const handlePointerOver = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null
      const hoveredCard = target?.closest('.game-shell .tcg-card.is-interactive') as HTMLElement | null

      if (
        hoveredCard &&
        !isDisabledTarget(hoveredCard) &&
        !containsRelatedTarget(hoveredCard, event.relatedTarget)
      ) {
        soundManager.play('card_hover')
        return
      }

      const interactiveTarget = getInteractiveTarget(event.target)
      if (
        !interactiveTarget ||
        interactiveTarget.closest('.tcg-card') ||
        isDisabledTarget(interactiveTarget) ||
        containsRelatedTarget(interactiveTarget, event.relatedTarget)
      ) {
        return
      }

      soundManager.play('ui_hover')
    }

    const handleClick = (event: MouseEvent) => {
      const interactiveTarget = getInteractiveTarget(event.target)
      if (
        !interactiveTarget ||
        interactiveTarget.closest('.tcg-card') ||
        isDisabledTarget(interactiveTarget)
      ) {
        return
      }

      soundManager.play('ui_click')
    }

    document.addEventListener('pointerover', handlePointerOver, true)
    document.addEventListener('click', handleClick, true)

    return () => {
      document.removeEventListener('pointerover', handlePointerOver, true)
      document.removeEventListener('click', handleClick, true)
    }
  }, [])

  useEffect(() => {
    if (!entryGateAccepted || screen !== 'game_intro') {
      return
    }

    let listening = true

    const removeIntroMusicListeners = () => {
      window.removeEventListener('pointermove', handleIntroMusicStart)
      window.removeEventListener('pointerdown', handleIntroMusicStart, true)
      window.removeEventListener('click', handleIntroMusicStart, true)
      window.removeEventListener('keydown', handleIntroMusicStart, true)
    }

    const handleIntroMusicStart = () => {
      void soundManager.startIntroMusic().then((started) => {
        if (!started || !listening) return

        removeIntroMusicListeners()
      })
    }

    window.addEventListener('pointermove', handleIntroMusicStart, { passive: true })
    window.addEventListener('pointerdown', handleIntroMusicStart, true)
    window.addEventListener('click', handleIntroMusicStart, true)
    window.addEventListener('keydown', handleIntroMusicStart, true)

    return () => {
      listening = false
      removeIntroMusicListeners()
    }
  }, [entryGateAccepted, screen])

  useEffect(() => {
    if (screen === 'stage_intro') {
      soundManager.playStageIntro(currentStage.stage)
    }
  }, [currentStage.stage, screen])

  useEffect(() => {
    window.localStorage.setItem(deckStorageKey, JSON.stringify(deckTokenIds))
  }, [deckTokenIds])

  useEffect(() => {
    if (selectedPfpTokenId) {
      window.localStorage.setItem(playerPfpStorageKey, selectedPfpTokenId)
      return
    }

    window.localStorage.removeItem(playerPfpStorageKey)
  }, [selectedPfpTokenId])

  useEffect(() => {
    if (
      state.phase !== 'opponent_responding' ||
      !state.selectedStat ||
      !state.arena.playerCard ||
      state.opponentHand.length === 0
    ) {
      return
    }

    soundManager.play('stat_select')
    const timer = window.setTimeout(() => {
      const responseCard = chooseOpponentResponseCard(
        state.opponentHand,
        state.arena.playerCard!,
        state.selectedStat!,
        state.opponentLastPlayedCardId,
        currentStage.difficulty,
      )
      soundManager.play('card_move')
      dispatch({ type: 'opponent_response', cardId: responseCard.id })
    }, timing.opponentThinkMs)

    return () => window.clearTimeout(timer)
  }, [
    state.phase,
    state.selectedStat,
    state.arena.playerCard,
    state.opponentHand,
    state.opponentLastPlayedCardId,
    currentStage.difficulty,
    timing.opponentThinkMs,
  ])

  useEffect(() => {
    if (state.phase !== 'opponent_selecting_card_and_stat' || state.opponentHand.length === 0) {
      return
    }

    const timer = window.setTimeout(() => {
      const nextTurn = chooseOpponentTurn(
        state.opponentHand,
        state.opponentLastPlayedCardId,
        currentStage.difficulty,
      )
      soundManager.play('card_move')
      dispatch({
        type: 'opponent_turn_chosen',
        cardId: nextTurn.card.id,
        stat: nextTurn.stat,
      })
    }, timing.opponentThinkMs)

    return () => window.clearTimeout(timer)
  }, [
    state.phase,
    state.opponentHand,
    state.opponentLastPlayedCardId,
    currentStage.difficulty,
    timing.opponentThinkMs,
  ])

  useEffect(() => {
    if (state.phase !== 'battle_reveal') return

    const timer = window.setTimeout(() => {
      soundManager.play('battle_compare')
      dispatch({ type: 'resolve_battle' })
    }, timing.revealMs)

    return () => window.clearTimeout(timer)
  }, [state.phase, timing.revealMs])

  useEffect(() => {
    if (state.phase !== 'capture_animation' || !state.battleResult) return

    soundManager.play(
      state.battleResult.isDraw
        ? 'draw'
        : state.battleResult.winningPlayer === 'player'
          ? 'round_win'
          : 'round_lose',
    )

    const timer = window.setTimeout(() => {
      dispatch({ type: 'complete_capture' })
    }, timing.captureMs)

    return () => window.clearTimeout(timer)
  }, [state.phase, state.battleResult, timing.captureMs])

  useEffect(() => {
    if (state.phase !== 'draw_phase') return

    const timer = window.setTimeout(() => {
      soundManager.play('turn_change')
      dispatch({ type: 'finish_draw_phase' })
    }, timing.drawMs)

    return () => window.clearTimeout(timer)
  }, [state.phase, timing.drawMs])

  useEffect(() => {
    if (state.phase !== 'game_over' || !state.winner) return

    soundManager.play(state.winner === 'player' ? 'stage_clear' : 'defeat')
  }, [state.phase, state.winner])

  useEffect(() => {
    if (screen !== 'run_victory') {
      runVictoryCuePlayedRef.current = false
      return
    }

    if (runVictoryCuePlayedRef.current) return

    runVictoryCuePlayedRef.current = true
    soundManager.play('victory')
  }, [screen])

  function handleOpenCollection() {
    void soundManager.startIntroMusic()
    soundManager.play('card_select')
    setStartGateMessage(null)
    setScreen('collection')
  }

  function handleAcceptEntryGate() {
    if (entryGateIsMobile) return

    setEntryGateAccepted(true)
    soundManager.playWelcome()
    void soundManager.startIntroMusic()
  }

  function handleOpenLeaderboard() {
    void soundManager.startIntroMusic()
    soundManager.play('card_select')
    setStartGateMessage(null)
    setScreen('leaderboard')
  }

  function handleMusicVolumeChange(volume: number) {
    soundManager.setMusicVolume(volume)
    setMusicVolume(soundManager.getMusicVolume())
  }

  function handleSfxVolumeChange(volume: number) {
    soundManager.setSfxVolume(volume)
    setSfxVolume(soundManager.getSfxVolume())
  }

  function handleReturnToMainMenu() {
    soundManager.play('turn_change')
    dispatch({ type: 'restart_game' })
    setStageIndex(0)
    setRunRewardTokenIds([])
    setRunScore(0)
    setDefeatedStages([])
    setStartGateMessage(null)
    setLeaderboardStatus('idle')
    setLeaderboardNotice(null)
    setScreen('game_intro')
  }

  function handleStartGame() {
    if (!wallet.connectedWallet) {
      soundManager.play('warning')
      setStartGateMessage('CONNECT A WALLET BEFORE ENTERING THE MATCH.')
      return
    }

    if (wallet.walletStatus === 'connecting' || wallet.walletStatus === 'loading_nfts') {
      soundManager.play('warning')
      setStartGateMessage('WALLET SCAN STILL RUNNING. GIVE IT A SECOND.')
      return
    }

    if (wallet.tradingCardNfts.length === 0) {
      soundManager.play('warning')
      setStartGateMessage(noTradingCardsMessage)
      return
    }

    soundManager.play('turn_change')
    setStartGateMessage(null)
    setStageIndex(0)
    setRunRewardTokenIds([])
    setRunScore(0)
    setDefeatedStages([])
    setLeaderboardStatus('idle')
    setLeaderboardNotice(null)
    setScreen('stage_intro')
  }

  function handleTryAgain() {
    soundManager.play('turn_change')
    dispatch({ type: 'restart_game' })
    setStageIndex(0)
    setRunRewardTokenIds([])
    setRunScore(0)
    setDefeatedStages([])
    setStartGateMessage(null)
    setLeaderboardStatus('idle')
    setLeaderboardNotice(null)
    setScreen(canStartMatch ? 'stage_intro' : 'game_intro')
  }

  function createLeaderboardRun(runResult: LeaderboardRunResult): PendingLeaderboardRun | null {
    if (!wallet.connectedWallet) {
      return null
    }

    return {
      avatarUrl: selectedPlayerPfp?.imageUrl ?? null,
      character: selectedPlayerPfp?.name ?? 'REMOTE VIEWER',
      defeatedCount: defeatedStages.length,
      runResult,
      score: runScore,
      stage:
        runResult === 'victory'
          ? Math.max(currentStage.stage, defeatedStages.length)
          : currentStage.stage,
      walletAddress: wallet.connectedWallet.address,
    }
  }

  async function handleSaveScore(runResult: LeaderboardRunResult, xHandle?: string | null) {
    soundManager.play('ui_click')

    const pendingRun = createLeaderboardRun(runResult)
    if (!pendingRun) {
      setLeaderboardStatus('error')
      setLeaderboardNotice('CONNECT A WALLET BEFORE SUBMITTING A SCORE.')
      return false
    }

    try {
      setLeaderboardStatus('submitting')
      setLeaderboardNotice('SAVING SCORE TO SUPABASE.')
      const leaderboardEntry = await submitLeaderboardRun(pendingRun, xHandle)
      setLeaderboardStatus('submitted')
      setLeaderboardNotice(
        leaderboardEntry.score > pendingRun.score
          ? 'EXISTING HIGH SCORE KEPT ON THE LEADERBOARD.'
          : 'BEST SCORE SUBMITTED TO THE LEADERBOARD.',
      )
      setScreen('leaderboard')
      return true
    } catch (error) {
      setLeaderboardStatus('error')
      setLeaderboardNotice(error instanceof Error ? error.message : 'SUPABASE SCORE SUBMIT FAILED.')
      return false
    }
  }

  function handleSelectPfpToken(tokenId: string) {
    if (!wallet.paradoxPfpNfts.some((nft) => nft.tokenId === tokenId)) {
      return
    }

    setSelectedPfpTokenId(tokenId)
  }

  function handleToggleDeckToken(tokenId: string) {
    const ownedTokenIdSet = new Set(ownedTokenIds)
    const isSelected = activeDeckTokenIds.includes(tokenId)
    const canAddToken = activeDeckTokenIds.length < GAME_CONFIG.deckCoreLimit

    if (!ownedTokenIdSet.has(tokenId) || (!isSelected && !canAddToken)) {
      setDeckTokenIds((current) =>
        current
          .filter((selectedTokenId) => ownedTokenIdSet.has(selectedTokenId))
          .slice(0, GAME_CONFIG.deckCoreLimit),
      )
      return
    }

    soundManager.play('card_select')
    setDeckTokenIds((current) => {
      const currentForWallet = current
        .filter((selectedTokenId) => ownedTokenIdSet.has(selectedTokenId))
        .slice(0, GAME_CONFIG.deckCoreLimit)

      if (currentForWallet.includes(tokenId)) {
        return currentForWallet.filter((selectedTokenId) => selectedTokenId !== tokenId)
      }

      if (currentForWallet.length >= GAME_CONFIG.deckCoreLimit) {
        return currentForWallet
      }

      return [...currentForWallet, tokenId]
    })
  }

  function handleStartMatch() {
    soundManager.play('turn_change')
    dispatch({
      type: 'start_match',
      deckSeed: {
        ownedTokenIds,
        opponentId: currentStage.id,
        playerCoreTokenIds: activeDeckTokenIds,
        rewardTokenIds: runRewardTokenIds,
        stageNumber: currentStage.stage,
      },
    })
    setScreen('match')
  }

  function applyCurrentStageProgress() {
    const nextRewardTokenIds = state.deckSeed.rewardTokenIds ?? []
    const nextRunScore = runScore + (state.winner === 'player' ? state.scoreObtained : 0)
    const nextDefeatedStages =
      state.winner === 'player' ? [...defeatedStages, currentStage] : defeatedStages

    setRunRewardTokenIds(nextRewardTokenIds)
    setRunScore(nextRunScore)
    setDefeatedStages(nextDefeatedStages)
  }

  function handleNextStage() {
    soundManager.play('turn_change')
    applyCurrentStageProgress()

    setStageIndex((currentIndex) => {
      const nextStageIndex = currentIndex + 1

      if (nextStageIndex < stages.length) {
        setScreen('stage_intro')
        return nextStageIndex
      }

      setScreen('run_victory')
      return currentIndex
    })
  }

  const visibleScreen =
    screen === 'match' && state.phase === 'game_over' && state.winner === 'opponent'
      ? 'game_over'
      : screen

  const screenContent = !entryGateAccepted ? (
    <EntryGate isMobile={entryGateIsMobile} onAccept={handleAcceptEntryGate} />
  ) : visibleScreen === 'game_intro' ? (
      <IntroScreen
        wallet={wallet}
        gateMessage={canStartMatch ? null : introGateMessage}
        selectedPfpTokenId={selectedPfpTokenId}
        startGameDetail={startGameDetail}
        onOpenCollection={handleOpenCollection}
        onOpenLeaderboard={handleOpenLeaderboard}
        onSelectPfpToken={handleSelectPfpToken}
        onStartGame={handleStartGame}
      />
    ) : visibleScreen === 'collection' ? (
      <CollectionScreen
        wallet={wallet}
        deckLimit={GAME_CONFIG.deckCoreLimit}
        deckTokenIds={activeDeckTokenIds}
        selectedPfpTokenId={selectedPfpTokenId}
        onBack={() => setScreen('game_intro')}
        onSelectPfpToken={handleSelectPfpToken}
        onToggleDeckToken={handleToggleDeckToken}
      />
    ) : visibleScreen === 'leaderboard' ? (
      <LeaderboardScreen
        walletAddress={wallet.connectedWallet?.address}
        onBack={() => setScreen('game_intro')}
      />
    ) : visibleScreen === 'stage_intro' ? (
      <StageIntroScreen stage={currentStage} onStartMatch={handleStartMatch} />
    ) : visibleScreen === 'game_over' ? (
      <RunEndScreen
        mode="game-over"
        opponent={currentStage}
        defeatedStages={defeatedStages}
        leaderboardNotice={leaderboardNotice}
        leaderboardStatus={leaderboardStatus}
        score={runScore}
        onMainMenu={handleReturnToMainMenu}
        onSaveScore={(xHandle) => handleSaveScore('game_over', xHandle)}
        onTryAgain={handleTryAgain}
      />
    ) : visibleScreen === 'run_victory' ? (
      <RunEndScreen
        mode="victory"
        opponent={currentStage}
        defeatedStages={defeatedStages}
        leaderboardNotice={leaderboardNotice}
        leaderboardStatus={leaderboardStatus}
        score={runScore}
        onMainMenu={handleReturnToMainMenu}
        onSaveScore={(xHandle) => handleSaveScore('victory', xHandle)}
        onTryAgain={handleTryAgain}
      />
    ) : (
      <Board
        state={state}
        dispatch={dispatch}
        opponentName={currentStage.name}
        stageNumber={currentStage.stage}
        stageBackgroundUrl={currentStage.backgroundUrl}
        opponentPortraitUrl={currentStage.portraitUrl}
        playerName={selectedPlayerPfp?.name}
        playerPortraitUrl={selectedPlayerPfp?.imageUrl}
        skipAnimations={skipAnimations}
        debugOpen={debugOpen}
        musicVolume={musicVolume}
        sfxVolume={sfxVolume}
        isFinalStage={stageIndex === stages.length - 1}
        onMusicVolumeChange={handleMusicVolumeChange}
        onSfxVolumeChange={handleSfxVolumeChange}
        onMainMenu={handleReturnToMainMenu}
        onNextStage={handleNextStage}
      />
    )

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={!entryGateAccepted ? (entryGateIsMobile ? 'entry_gate_mobile' : 'entry_gate') : visibleScreen}
        className="screen-transition"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.38, ease: 'easeInOut' }}
      >
        {screenContent}
      </motion.div>
    </AnimatePresence>
  )
}

export default App
