import { sampleCards } from '../data/cards'
import { resolveBattle } from './battleResolver'
import { GAME_CONFIG, STAT_LABELS } from './gameConfig'
import type { BattleLogEntry, CardData, GameAction, GameState, PlayerId } from './gameTypes'

const splitDecks = () => {
  const playerCards = sampleCards
    .filter((_, index) => index % 2 === 0)
    .map((card) => ({ ...card, id: `player-${card.id}` }))
  const opponentCards = sampleCards
    .filter((_, index) => index % 2 === 1)
    .map((card) => ({ ...card, id: `opponent-${card.id}` }))

  return { playerCards, opponentCards }
}

const drawToLimit = (deck: CardData[], hand: CardData[]) => {
  const nextDeck = [...deck]
  const nextHand = [...hand]

  while (nextHand.length < GAME_CONFIG.handSize && nextDeck.length > 0) {
    const nextCard = nextDeck.shift()
    if (nextCard) {
      nextHand.push(nextCard)
    }
  }

  return { deck: nextDeck, hand: nextHand }
}

const removeCard = (cards: CardData[], cardId: string) => {
  const card = cards.find((item) => item.id === cardId) ?? null
  return {
    card,
    cards: cards.filter((item) => item.id !== cardId),
  }
}

const logEntry = (
  state: GameState,
  message: string,
  tone: BattleLogEntry['tone'] = 'system',
): BattleLogEntry => ({
  id: `${state.turnNumber}-${state.log.length}-${message}`,
  turn: state.turnNumber,
  message,
  tone,
})

const withLog = (
  state: GameState,
  message: string,
  tone?: BattleLogEntry['tone'],
) => [...state.log, logEntry(state, message, tone)].slice(-12)

const availableCards = (state: GameState, player: PlayerId) =>
  player === 'player'
    ? state.playerDeck.length + state.playerHand.length
    : state.opponentDeck.length + state.opponentHand.length

export function createInitialState(): GameState {
  const { playerCards, opponentCards } = splitDecks()
  const playerDraw = drawToLimit(playerCards, [])
  const opponentDraw = drawToLimit(opponentCards, [])

  return {
    phase: 'player_select_card',
    activePlayer: 'player',
    selectedStat: null,
    playerDeck: playerDraw.deck,
    opponentDeck: opponentDraw.deck,
    playerHand: playerDraw.hand,
    opponentHand: opponentDraw.hand,
    playerCaptured: [],
    opponentCaptured: [],
    arena: {
      playerCard: null,
      opponentCard: null,
    },
    battleResult: null,
    log: [
      {
        id: 'match-start',
        turn: 1,
        message: 'Match linked. Reduce the enemy pool to zero cards.',
        tone: 'system',
      },
    ],
    turnNumber: 1,
    winner: null,
  }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'restart_game':
      return createInitialState()

    case 'select_player_card': {
      if (state.phase !== 'player_select_card') return state

      const { card, cards } = removeCard(state.playerHand, action.cardId)
      if (!card) return state

      return {
        ...state,
        phase: 'player_select_stat',
        playerHand: cards,
        arena: { ...state.arena, playerCard: card },
        battleResult: null,
        log: withLog(state, `You deployed ${card.name}.`, 'player'),
      }
    }

    case 'select_stat': {
      if (state.phase !== 'player_select_stat' || !state.arena.playerCard) return state

      return {
        ...state,
        selectedStat: action.stat,
        phase: 'opponent_responding',
        log: withLog(
          state,
          `You declared ${STAT_LABELS[action.stat].toUpperCase()}.`,
          'player',
        ),
      }
    }

    case 'opponent_response': {
      if (state.phase !== 'opponent_responding') return state

      const { card, cards } = removeCard(state.opponentHand, action.cardId)
      if (!card) return state

      return {
        ...state,
        phase: 'battle_reveal',
        opponentHand: cards,
        arena: { ...state.arena, opponentCard: card },
        log: withLog(state, `Opponent answered with ${card.name}.`, 'opponent'),
      }
    }

    case 'opponent_turn_chosen': {
      if (state.phase !== 'opponent_selecting_card_and_stat') return state

      const { card, cards } = removeCard(state.opponentHand, action.cardId)
      if (!card) return state

      return {
        ...state,
        phase: 'player_responding',
        selectedStat: action.stat,
        opponentHand: cards,
        arena: { ...state.arena, opponentCard: card },
        battleResult: null,
        log: withLog(
          state,
          `Opponent initiated ${STAT_LABELS[action.stat].toUpperCase()} with ${card.name}.`,
          'opponent',
        ),
      }
    }

    case 'select_player_response': {
      if (state.phase !== 'player_responding') return state

      const { card, cards } = removeCard(state.playerHand, action.cardId)
      if (!card) return state

      return {
        ...state,
        phase: 'battle_reveal',
        playerHand: cards,
        arena: { ...state.arena, playerCard: card },
        log: withLog(state, `You responded with ${card.name}.`, 'player'),
      }
    }

    case 'resolve_battle': {
      if (
        state.phase !== 'battle_reveal' ||
        !state.selectedStat ||
        !state.arena.playerCard ||
        !state.arena.opponentCard
      ) {
        return state
      }

      const result = resolveBattle({
        playerCard: state.arena.playerCard,
        opponentCard: state.arena.opponentCard,
        selectedStat: state.selectedStat,
        attacker: state.activePlayer,
      })

      const tieLog = result.wasTieBreaker
        ? result.randomTieBreak
          ? 'Exact tie. Random tie break triggered.'
          : `Tie detected. Secondary stat: ${STAT_LABELS[result.comparedStat].toUpperCase()}.`
        : null

      const nextLog = [
        ...(tieLog ? [logEntry(state, tieLog, 'warning')] : []),
        logEntry(
          state,
          `${state.arena.playerCard.name} (${result.playerValue}) VS ${state.arena.opponentCard.name} (${result.opponentValue}). ${result.winningCard.name} wins.`,
          'battle',
        ),
      ]

      return {
        ...state,
        phase: 'capture_animation',
        battleResult: result,
        log: [...state.log, ...nextLog].slice(-12),
      }
    }

    case 'complete_capture': {
      if (state.phase !== 'capture_animation' || !state.battleResult) return state

      const result = state.battleResult
      let playerDeck = state.playerDeck
      let opponentDeck = state.opponentDeck
      let playerHand = [...state.playerHand]
      let opponentHand = [...state.opponentHand]
      const playerCaptured = [...state.playerCaptured]
      const opponentCaptured = [...state.opponentCaptured]

      if (result.winningPlayer === 'player') {
        playerHand = [...playerHand, result.winningCard]
        playerCaptured.push(result.losingCard)
      } else {
        opponentHand = [...opponentHand, result.winningCard]
        opponentCaptured.push(result.losingCard)
      }

      const playerDraw = drawToLimit(playerDeck, playerHand)
      const opponentDraw = drawToLimit(opponentDeck, opponentHand)
      playerDeck = playerDraw.deck
      opponentDeck = opponentDraw.deck
      playerHand = playerDraw.hand
      opponentHand = opponentDraw.hand

      const nextState: GameState = {
        ...state,
        activePlayer: result.winningPlayer,
        selectedStat: null,
        playerDeck,
        opponentDeck,
        playerHand,
        opponentHand,
        playerCaptured,
        opponentCaptured,
        arena: { playerCard: null, opponentCard: null },
        battleResult: null,
        turnNumber: state.turnNumber + 1,
        log: withLog(
          state,
          `${result.winningPlayer === 'player' ? 'You capture' : 'Opponent captures'} ${result.losingCard.name}.`,
          'battle',
        ),
      }

      const playerOut = availableCards(nextState, 'player') === 0
      const opponentOut = availableCards(nextState, 'opponent') === 0
      const winner: PlayerId | null = playerOut
        ? 'opponent'
        : opponentOut
          ? 'player'
          : null

      return {
        ...nextState,
        phase: winner ? 'game_over' : 'draw_phase',
        winner,
        log: winner
          ? withLog(
              nextState,
              `${winner === 'player' ? 'Victory' : 'Defeat'} registered. Enemy pool exhausted.`,
              winner === 'player' ? 'player' : 'opponent',
            )
          : nextState.log,
      }
    }

    case 'finish_draw_phase': {
      if (state.phase !== 'draw_phase') return state

      return {
        ...state,
        phase:
          state.activePlayer === 'player'
            ? 'player_select_card'
            : 'opponent_selecting_card_and_stat',
        log: withLog(
          state,
          `${state.activePlayer === 'player' ? 'You keep' : 'Opponent keeps'} initiative.`,
          state.activePlayer === 'player' ? 'player' : 'opponent',
        ),
      }
    }

    default:
      return state
  }
}
