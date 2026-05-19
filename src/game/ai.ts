import { GAME_CONFIG } from './gameConfig'
import type { CardData, StatKey } from './gameTypes'

const statKeys: StatKey[] = ['attack', 'defense', 'wisdom', 'charisma']

const maybePickNearby = <T,>(ranked: T[], randomness = GAME_CONFIG.aiRandomness): T => {
  if (ranked.length === 1 || Math.random() > randomness) {
    return ranked[0]
  }

  const index = Math.min(ranked.length - 1, Math.floor(Math.random() * 3))
  return ranked[index]
}

export function chooseOpponentResponseCard(
  opponentHand: CardData[],
  playerCard: CardData,
  selectedStat: StatKey,
): CardData {
  const targetValue = playerCard.stats[selectedStat]
  const winningCards = opponentHand
    .filter((card) => card.stats[selectedStat] > targetValue)
    .sort((a, b) => a.stats[selectedStat] - b.stats[selectedStat])

  if (winningCards.length > 0) {
    return maybePickNearby(winningCards)
  }

  const sacrificePool = [...opponentHand].sort(
    (a, b) => a.stats[selectedStat] - b.stats[selectedStat],
  )

  return maybePickNearby(sacrificePool)
}

export function chooseOpponentTurn(opponentHand: CardData[]): {
  card: CardData
  stat: StatKey
} {
  const rankedCards = [...opponentHand].sort((a, b) => {
    const bestA = Math.max(...statKeys.map((stat) => a.stats[stat]))
    const bestB = Math.max(...statKeys.map((stat) => b.stats[stat]))
    return bestB - bestA
  })

  const card = maybePickNearby(rankedCards)
  const rankedStats = [...statKeys].sort((a, b) => card.stats[b] - card.stats[a])
  const stat =
    Math.random() < GAME_CONFIG.aiRandomness
      ? rankedStats[Math.min(1, rankedStats.length - 1)]
      : rankedStats[0]

  return { card, stat }
}
