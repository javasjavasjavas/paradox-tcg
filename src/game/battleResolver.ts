import { GAME_CONFIG } from './gameConfig'
import type { BattleResult, CardData, PlayerId, StatKey } from './gameTypes'

interface ResolveBattleInput {
  playerCard: CardData
  opponentCard: CardData
  selectedStat: StatKey
  attacker: PlayerId
}

const opponentOf = (player: PlayerId): PlayerId =>
  player === 'player' ? 'opponent' : 'player'

export function resolveBattle({
  playerCard,
  opponentCard,
  selectedStat,
}: ResolveBattleInput): BattleResult {
  const playerValue = playerCard.stats[selectedStat]
  const opponentValue = opponentCard.stats[selectedStat]

  let winningPlayer: PlayerId = playerValue > opponentValue ? 'player' : 'opponent'
  let comparedStat = selectedStat
  let wasTieBreaker = false
  let randomTieBreak = false

  if (playerValue === opponentValue) {
    wasTieBreaker = true
    const secondaryStat = GAME_CONFIG.tieBreakerOrder
      .filter((stat) => stat !== selectedStat)
      .find((stat) => playerCard.stats[stat] !== opponentCard.stats[stat])

    if (secondaryStat) {
      comparedStat = secondaryStat
      winningPlayer =
        playerCard.stats[secondaryStat] > opponentCard.stats[secondaryStat]
          ? 'player'
          : 'opponent'
    } else {
      randomTieBreak = true
      winningPlayer = Math.random() > 0.5 ? 'player' : 'opponent'
    }
  }

  const losingPlayer = opponentOf(winningPlayer)
  const winningCard = winningPlayer === 'player' ? playerCard : opponentCard
  const losingCard = winningPlayer === 'player' ? opponentCard : playerCard
  const finalPlayerValue = playerCard.stats[comparedStat]
  const finalOpponentValue = opponentCard.stats[comparedStat]

  return {
    winningPlayer,
    losingPlayer,
    winningCard,
    losingCard,
    comparedStat,
    playerValue: finalPlayerValue,
    opponentValue: finalOpponentValue,
    wasTieBreaker,
    tieBreakerStat: comparedStat !== selectedStat ? comparedStat : undefined,
    randomTieBreak,
  }
}
