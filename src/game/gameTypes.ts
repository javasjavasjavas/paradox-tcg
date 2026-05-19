export type PlayerId = 'player' | 'opponent'

export type StatKey = 'attack' | 'defense' | 'wisdom' | 'charisma'

export type Rarity = 'RA' | 'RB' | 'RC' | 'SR' | 'UR'

export type GamePhase =
  | 'setup'
  | 'player_select_card'
  | 'player_select_stat'
  | 'opponent_responding'
  | 'opponent_selecting_card_and_stat'
  | 'player_responding'
  | 'battle_reveal'
  | 'resolving_battle'
  | 'capture_animation'
  | 'draw_phase'
  | 'game_over'

export interface CardStats {
  attack: number
  defense: number
  wisdom: number
  charisma: number
}

export interface CardData {
  id: string
  name: string
  rarity: Rarity
  type: string
  lore: string
  image: string
  artLayout?: 'portrait' | 'full-card' | 'generated'
  cardNumber: string
  stats: CardStats
}

export interface BattleResult {
  winningPlayer: PlayerId
  losingPlayer: PlayerId
  winningCard: CardData
  losingCard: CardData
  comparedStat: StatKey
  playerValue: number
  opponentValue: number
  wasTieBreaker: boolean
  tieBreakerStat?: StatKey
  randomTieBreak?: boolean
}

export interface BattleLogEntry {
  id: string
  turn: number
  message: string
  tone: 'system' | 'player' | 'opponent' | 'battle' | 'warning'
}

export interface GameState {
  phase: GamePhase
  activePlayer: PlayerId
  selectedStat: StatKey | null
  playerDeck: CardData[]
  opponentDeck: CardData[]
  playerHand: CardData[]
  opponentHand: CardData[]
  playerCaptured: CardData[]
  opponentCaptured: CardData[]
  arena: {
    playerCard: CardData | null
    opponentCard: CardData | null
  }
  battleResult: BattleResult | null
  log: BattleLogEntry[]
  turnNumber: number
  winner: PlayerId | null
}

export type GameAction =
  | { type: 'restart_game' }
  | { type: 'select_player_card'; cardId: string }
  | { type: 'select_player_response'; cardId: string }
  | { type: 'select_stat'; stat: StatKey }
  | { type: 'opponent_response'; cardId: string }
  | { type: 'opponent_turn_chosen'; cardId: string; stat: StatKey }
  | { type: 'resolve_battle' }
  | { type: 'complete_capture' }
  | { type: 'finish_draw_phase' }
