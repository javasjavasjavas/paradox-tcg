import { resolveBattle } from './battleResolver'
import { buildMatchDecks, buildRandomStageRewardCard } from './deckBuilder'
import { GAME_CONFIG, STAT_LABELS } from './gameConfig'
import type { BattleLogEntry, CardData, GameAction, GameState, MatchDeckSeed, OpponentDialogue, PlayerId } from './gameTypes'
import { calculateCompletedStageScore } from './scoring'

const emptyDeckSeed: MatchDeckSeed = {
  opponentId: 'remote-viewer',
  ownedTokenIds: [],
  playerCoreTokenIds: [],
  rewardTokenIds: [],
  stageNumber: 1,
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

const calculateStageScore = (state: GameState, winner: PlayerId) => {
  if (winner !== 'player') return 0

  return calculateCompletedStageScore({
    cardsLost: state.opponentCaptured.length,
    stageNumber: state.deckSeed.stageNumber ?? 1,
    threeRoundWinBonusCount: state.threeRoundWinBonusCount,
  })
}

const createStageReward = (winner: PlayerId, opponentId: string | undefined) =>
  winner === 'player'
    ? {
        card: buildRandomStageRewardCard(opponentId),
        status: 'pending' as const,
      }
    : null

const hasPlayableAlternative = (cards: CardData[], blockedCardId: string | null) =>
  Boolean(blockedCardId && cards.length > 1 && cards.some((card) => card.id !== blockedCardId))

const getStreakDialogue = (
  state: GameState,
  winningPlayer: PlayerId,
  streakCount: number,
): OpponentDialogue | null => {
  if (streakCount !== 3) return null

  const nextId = (state.opponentDialogue?.id ?? 0) + 1

  if (winningPlayer === 'player') {
    return {
      id: nextId,
      message: 'THREE ROUNDS IN A ROW... YOUR SIGNAL IS TOO LOUD.',
      tone: 'pressure',
    }
  }

  return {
    id: nextId,
    message: 'YOUR PATTERN IS COLLAPSING. I CAN SEE THE NEXT MOVE.',
    tone: 'taunt',
  }
}

export function createInitialState(deckSeed: MatchDeckSeed = emptyDeckSeed): GameState {
  const { playerCards, opponentCards } = buildMatchDecks(deckSeed)
  const playerDraw = drawToLimit(playerCards, [])
  const opponentDraw = drawToLimit(opponentCards, [])

  return {
    phase: 'player_select_card',
    activePlayer: 'player',
    selectedStat: null,
    deckSeed,
    playerDeck: playerDraw.deck,
    opponentDeck: opponentDraw.deck,
    playerHand: playerDraw.hand,
    opponentHand: opponentDraw.hand,
    playerCaptured: [],
    opponentCaptured: [],
    playerLastPlayedCardId: null,
    opponentLastPlayedCardId: null,
    roundWinStreak: {
      player: 0,
      opponent: 0,
    },
    playerStatStreak: {
      stat: null,
      count: 0,
    },
    statLimitNotice: null,
    opponentDialogue: null,
    threeRoundWinBonusCount: 0,
    arena: {
      playerCard: null,
      opponentCard: null,
    },
    battleResult: null,
    stageReward: null,
    scoreObtained: 0,
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
      return createInitialState(state.deckSeed)

    case 'start_match':
      return createInitialState(action.deckSeed)

    case 'select_player_card': {
      if (state.phase !== 'player_select_card') return state
      if (
        action.cardId === state.playerLastPlayedCardId &&
        hasPlayableAlternative(state.playerHand, state.playerLastPlayedCardId)
      ) {
        const message = 'CARD LOCKED. PLAY A DIFFERENT CARD BEFORE REUSING THIS ONE.'

        return {
          ...state,
          statLimitNotice: {
            id: (state.statLimitNotice?.id ?? 0) + 1,
            stat: 'attack',
            message,
          },
          log: withLog(state, message, 'warning'),
        }
      }

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
      const isRepeatingStat = state.playerStatStreak.stat === action.stat
      const currentStreakCount = isRepeatingStat ? state.playerStatStreak.count : 0

      if (currentStreakCount >= GAME_CONFIG.maxRepeatedStatSelections) {
        const message = `${STAT_LABELS[action.stat]} locked. Choose another stat to reset your flow.`

        return {
          ...state,
          statLimitNotice: {
            id: (state.statLimitNotice?.id ?? 0) + 1,
            stat: action.stat,
            message,
          },
          log: withLog(state, message, 'warning'),
        }
      }

      return {
        ...state,
        selectedStat: action.stat,
        phase: 'opponent_responding',
        playerStatStreak: {
          stat: action.stat,
          count: currentStreakCount + 1,
        },
        statLimitNotice: null,
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
      if (
        action.cardId === state.playerLastPlayedCardId &&
        hasPlayableAlternative(state.playerHand, state.playerLastPlayedCardId)
      ) {
        const message = 'CARD LOCKED. PLAY A DIFFERENT CARD BEFORE REUSING THIS ONE.'

        return {
          ...state,
          statLimitNotice: {
            id: (state.statLimitNotice?.id ?? 0) + 1,
            stat: 'attack',
            message,
          },
          log: withLog(state, message, 'warning'),
        }
      }

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

      const nextLog = [
        logEntry(
          state,
          result.isDraw
            ? `${state.arena.playerCard.name} (${result.playerValue}) VS ${state.arena.opponentCard.name} (${result.opponentValue}). Draw.`
            : `${state.arena.playerCard.name} (${result.playerValue}) VS ${state.arena.opponentCard.name} (${result.opponentValue}). ${result.winningCard?.name ?? 'Unknown card'} wins.`,
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

      if (result.isDraw) {
        playerDeck = [...playerDeck, result.playerCard]
        opponentDeck = [...opponentDeck, result.opponentCard]
      } else if (result.winningPlayer === 'player' && result.losingCard && result.winningCard) {
        playerDeck = [...playerDeck, result.losingCard, result.winningCard]
        playerCaptured.push(result.losingCard)
      } else if (result.winningPlayer === 'opponent' && result.losingCard && result.winningCard) {
        opponentDeck = [...opponentDeck, result.losingCard, result.winningCard]
        opponentCaptured.push(result.losingCard)
      }

      const nextRoundWinStreak = {
        player: result.winningPlayer === 'player' ? state.roundWinStreak.player + 1 : 0,
        opponent: result.winningPlayer === 'opponent' ? state.roundWinStreak.opponent + 1 : 0,
      }
      const playerCompletedThreeRoundBonus =
        result.winningPlayer === 'player' &&
        nextRoundWinStreak.player > 0 &&
        nextRoundWinStreak.player % 3 === 0
      const threeRoundWinBonusCount =
        state.threeRoundWinBonusCount + (playerCompletedThreeRoundBonus ? 1 : 0)
      const opponentDialogue = result.winningPlayer
        ? getStreakDialogue(
            state,
            result.winningPlayer,
            nextRoundWinStreak[result.winningPlayer],
          )
        : null

      const playerDraw = drawToLimit(playerDeck, playerHand)
      const opponentDraw = drawToLimit(opponentDeck, opponentHand)
      playerDeck = playerDraw.deck
      opponentDeck = opponentDraw.deck
      playerHand = playerDraw.hand
      opponentHand = opponentDraw.hand

      const nextState: GameState = {
        ...state,
        activePlayer: result.winningPlayer ?? state.activePlayer,
        selectedStat: null,
        playerDeck,
        opponentDeck,
        playerHand,
        opponentHand,
        playerCaptured,
        opponentCaptured,
        playerLastPlayedCardId: state.arena.playerCard?.id ?? state.playerLastPlayedCardId,
        opponentLastPlayedCardId: state.arena.opponentCard?.id ?? state.opponentLastPlayedCardId,
        roundWinStreak: nextRoundWinStreak,
        opponentDialogue,
        threeRoundWinBonusCount,
        arena: { playerCard: null, opponentCard: null },
        battleResult: null,
        turnNumber: state.turnNumber + 1,
        log: withLog(
          state,
          result.isDraw
            ? 'Draw. Both cards return to the bottom of their decks.'
            : `${result.winningPlayer === 'player' ? 'You capture' : 'Opponent captures'} ${result.losingCard?.name ?? 'the card'}.`,
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
      const resolvedState: GameState = {
        ...nextState,
        phase: winner ? 'game_over' : 'draw_phase',
        winner,
        stageReward: winner ? createStageReward(winner, state.deckSeed.opponentId) : null,
        scoreObtained: winner ? calculateStageScore(nextState, winner) : 0,
      }

      return {
        ...resolvedState,
        log: winner
          ? withLog(
              resolvedState,
              `${winner === 'player' ? 'Victory' : 'Defeat'} registered. Enemy pool exhausted.`,
              winner === 'player' ? 'player' : 'opponent',
            )
          : resolvedState.log,
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

    case 'clear_stat_limit_notice': {
      if (state.statLimitNotice?.id !== action.noticeId) return state

      return {
        ...state,
        statLimitNotice: null,
      }
    }

    case 'clear_opponent_dialogue': {
      if (state.opponentDialogue?.id !== action.dialogueId) return state

      return {
        ...state,
        opponentDialogue: null,
      }
    }

    case 'force_stage_clear': {
      if (state.phase === 'game_over') return state

      const nextState = {
        ...state,
        phase: 'game_over' as const,
        selectedStat: null,
        winner: 'player' as const,
        stageReward: createStageReward('player', state.deckSeed.opponentId),
        scoreObtained: calculateStageScore(state, 'player'),
        log: withLog(state, 'Victory registered. Proceed to the next stage.', 'player'),
      }

      return nextState
    }

    case 'add_stage_reward': {
      if (!state.stageReward || state.stageReward.status !== 'pending') return state

      const rewardTokenId = state.stageReward.card.tokenId
      const rewardTokenIds = rewardTokenId
        ? [...new Set([...(state.deckSeed.rewardTokenIds ?? []), String(rewardTokenId)])]
        : state.deckSeed.rewardTokenIds

      return {
        ...state,
        deckSeed: {
          ...state.deckSeed,
          rewardTokenIds,
        },
        playerDeck: [...state.playerDeck, state.stageReward.card],
        stageReward: {
          ...state.stageReward,
          status: 'added',
        },
        log: withLog(state, `${state.stageReward.card.name} added to your deck.`, 'player'),
      }
    }

    case 'discard_stage_reward': {
      if (!state.stageReward || state.stageReward.status !== 'pending') return state

      return {
        ...state,
        stageReward: {
          ...state.stageReward,
          status: 'discarded',
        },
        log: withLog(state, `${state.stageReward.card.name} discarded.`, 'warning'),
      }
    }

    default:
      return state
  }
}
