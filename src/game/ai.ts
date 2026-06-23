import { GAME_CONFIG } from './gameConfig'
import type { OpponentDifficulty } from '../data/stages'
import type { CardData, StatKey } from './gameTypes'

const statKeys: StatKey[] = ['attack', 'defense', 'wisdom', 'charisma']
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const defaultDifficulty: OpponentDifficulty = {
  score: 5,
  bestStatChance: 0.68,
  secondBestStatChance: 0.22,
  lowerStatChance: 0.1,
}

function getCardChoiceRandomness(difficulty: OpponentDifficulty = defaultDifficulty) {
  const score = clamp(difficulty.score, 1, 10)
  return clamp(0.92 - score * 0.085, 0.06, 0.84)
}

const maybePickNearby = <T,>(ranked: T[], randomness = GAME_CONFIG.aiRandomness): T => {
  if (ranked.length === 1 || Math.random() > randomness) {
    return ranked[0]
  }

  const index = Math.min(ranked.length - 1, Math.floor(Math.random() * 3))
  return ranked[index]
}

function pickStatByDifficulty(rankedStats: StatKey[], difficulty: OpponentDifficulty = defaultDifficulty) {
  const bestStatChance = clamp(difficulty.bestStatChance, 0, 1)
  const secondBestStatChance = clamp(difficulty.secondBestStatChance, 0, 1)
  const roll = Math.random()

  if (roll < bestStatChance || rankedStats.length === 1) {
    return rankedStats[0]
  }

  if (roll < bestStatChance + secondBestStatChance || rankedStats.length === 2) {
    return rankedStats[Math.min(1, rankedStats.length - 1)]
  }

  const lowerStats = rankedStats.slice(2)
  return lowerStats[Math.floor(Math.random() * lowerStats.length)] ?? rankedStats.at(-1) ?? rankedStats[0]
}

export function chooseOpponentResponseCard(
  opponentHand: CardData[],
  playerCard: CardData,
  selectedStat: StatKey,
  blockedCardId: string | null = null,
  difficulty: OpponentDifficulty = defaultDifficulty,
): CardData {
  const playableHand =
    blockedCardId && opponentHand.length > 1
      ? opponentHand.filter((card) => card.id !== blockedCardId)
      : opponentHand
  const targetValue = playerCard.stats[selectedStat]
  const winningCards = playableHand
    .filter((card) => card.stats[selectedStat] > targetValue)
    .sort((a, b) => a.stats[selectedStat] - b.stats[selectedStat])

  if (winningCards.length > 0) {
    return maybePickNearby(winningCards, getCardChoiceRandomness(difficulty))
  }

  const sacrificePool = [...playableHand].sort(
    (a, b) => a.stats[selectedStat] - b.stats[selectedStat],
  )

  return maybePickNearby(sacrificePool, getCardChoiceRandomness(difficulty))
}

export function chooseOpponentTurn(
  opponentHand: CardData[],
  blockedCardId: string | null = null,
  difficulty: OpponentDifficulty = defaultDifficulty,
): {
  card: CardData
  stat: StatKey
} {
  const playableHand =
    blockedCardId && opponentHand.length > 1
      ? opponentHand.filter((card) => card.id !== blockedCardId)
      : opponentHand
  const rankedCards = [...playableHand].sort((a, b) => {
    const bestA = Math.max(...statKeys.map((stat) => a.stats[stat]))
    const bestB = Math.max(...statKeys.map((stat) => b.stats[stat]))
    return bestB - bestA
  })

  const card = maybePickNearby(rankedCards, getCardChoiceRandomness(difficulty))
  const rankedStats = [...statKeys].sort((a, b) => card.stats[b] - card.stats[a])
  const stat = pickStatByDifficulty(rankedStats, difficulty)

  return { card, stat }
}
