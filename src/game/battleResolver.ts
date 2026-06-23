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

  if (playerValue === opponentValue) {
    return {
      isDraw: true,
      winningPlayer: null,
      losingPlayer: null,
      playerCard,
      opponentCard,
      winningCard: null,
      losingCard: null,
      comparedStat: selectedStat,
      playerValue,
      opponentValue,
      wasTieBreaker: false,
    }
  }

  const winningPlayer: PlayerId = playerValue > opponentValue ? 'player' : 'opponent'
  const losingPlayer = opponentOf(winningPlayer)
  const winningCard = winningPlayer === 'player' ? playerCard : opponentCard
  const losingCard = winningPlayer === 'player' ? opponentCard : playerCard

  return {
    isDraw: false,
    winningPlayer,
    losingPlayer,
    playerCard,
    opponentCard,
    winningCard,
    losingCard,
    comparedStat: selectedStat,
    playerValue,
    opponentValue,
    wasTieBreaker: false,
  }
}
