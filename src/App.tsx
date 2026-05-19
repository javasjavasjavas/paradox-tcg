import { useEffect, useReducer, useState } from 'react'
import { Board } from './components/Board'
import { IntroScreen } from './components/IntroScreen'
import { chooseOpponentResponseCard, chooseOpponentTurn } from './game/ai'
import { GAME_CONFIG } from './game/gameConfig'
import { createInitialState, gameReducer } from './game/gameReducer'
import { soundManager } from './game/soundManager'

const fastTiming = {
  opponentThinkMs: 160,
  revealMs: 160,
  resolveMs: 160,
  captureMs: 180,
  drawMs: 120,
}

function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState)
  const [hasStarted, setHasStarted] = useState(false)
  const [skipAnimations, setSkipAnimations] = useState(false)
  const [debugOpen, setDebugOpen] = useState(false)
  const timing = skipAnimations ? fastTiming : GAME_CONFIG.timing

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
      )
      soundManager.play('card_move')
      dispatch({ type: 'opponent_response', cardId: responseCard.id })
    }, timing.opponentThinkMs)

    return () => window.clearTimeout(timer)
  }, [state.phase, state.selectedStat, state.arena.playerCard, state.opponentHand, timing.opponentThinkMs])

  useEffect(() => {
    if (state.phase !== 'opponent_selecting_card_and_stat' || state.opponentHand.length === 0) {
      return
    }

    const timer = window.setTimeout(() => {
      const nextTurn = chooseOpponentTurn(state.opponentHand)
      soundManager.play('turn_change')
      dispatch({
        type: 'opponent_turn_chosen',
        cardId: nextTurn.card.id,
        stat: nextTurn.stat,
      })
    }, timing.opponentThinkMs)

    return () => window.clearTimeout(timer)
  }, [state.phase, state.opponentHand, timing.opponentThinkMs])

  useEffect(() => {
    if (state.phase !== 'battle_reveal') return

    const timer = window.setTimeout(() => {
      soundManager.play('battle_compare')
      dispatch({ type: 'resolve_battle' })
    }, timing.revealMs)

    return () => window.clearTimeout(timer)
  }, [state.phase, timing.revealMs])

  useEffect(() => {
    if (state.phase !== 'capture_animation') return

    const timer = window.setTimeout(() => {
      soundManager.play(state.battleResult?.winningPlayer === 'player' ? 'win' : 'capture')
      dispatch({ type: 'complete_capture' })
    }, timing.captureMs)

    return () => window.clearTimeout(timer)
  }, [state.phase, state.battleResult?.winningPlayer, timing.captureMs])

  useEffect(() => {
    if (state.phase !== 'draw_phase') return

    const timer = window.setTimeout(() => {
      soundManager.play('turn_change')
      dispatch({ type: 'finish_draw_phase' })
    }, timing.drawMs)

    return () => window.clearTimeout(timer)
  }, [state.phase, timing.drawMs])

  useEffect(() => {
    if (state.phase === 'game_over') {
      soundManager.play('victory')
    }
  }, [state.phase])

  if (!hasStarted) {
    return <IntroScreen onStartGame={() => setHasStarted(true)} />
  }

  return (
    <Board
      state={state}
      dispatch={dispatch}
      skipAnimations={skipAnimations}
      debugOpen={debugOpen}
      onToggleAnimations={() => setSkipAnimations((current) => !current)}
      onToggleDebug={() => setDebugOpen((current) => !current)}
    />
  )
}

export default App
