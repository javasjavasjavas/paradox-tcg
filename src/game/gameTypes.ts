export type PlayerId = 'player' | 'opponent'

export type StatKey = 'attack' | 'defense' | 'wisdom' | 'charisma'

export type Rarity =
  | 'Common'
  | 'Rare'
  | 'Epic'
  | 'Legendary'
  | 'RA'
  | 'RB'
  | 'RC'
  | 'SR'
  | 'UR'

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
  tokenId?: number
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
  isDraw: boolean
  winningPlayer: PlayerId | null
  losingPlayer: PlayerId | null
  playerCard: CardData
  opponentCard: CardData
  winningCard: CardData | null
  losingCard: CardData | null
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

export interface MatchDeckSeed {
  opponentId?: string
  playerCoreTokenIds: string[]
  ownedTokenIds: string[]
  rewardTokenIds?: string[]
}

export interface StatLimitNotice {
  id: number
  stat: StatKey
  message: string
}

export interface OpponentDialogue {
  id: number
  message: string
  tone: 'pressure' | 'taunt' | 'warning'
}

export interface StageReward {
  card: CardData
  status: 'pending' | 'added' | 'discarded'
}

export interface GameState {
  phase: GamePhase
  activePlayer: PlayerId
  selectedStat: StatKey | null
  deckSeed: MatchDeckSeed
  playerDeck: CardData[]
  opponentDeck: CardData[]
  playerHand: CardData[]
  opponentHand: CardData[]
  playerCaptured: CardData[]
  opponentCaptured: CardData[]
  playerLastPlayedCardId: string | null
  opponentLastPlayedCardId: string | null
  roundWinStreak: Record<PlayerId, number>
  playerStatStreak: {
    stat: StatKey | null
    count: number
  }
  statLimitNotice: StatLimitNotice | null
  opponentDialogue: OpponentDialogue | null
  arena: {
    playerCard: CardData | null
    opponentCard: CardData | null
  }
  battleResult: BattleResult | null
  stageReward: StageReward | null
  scoreObtained: number
  log: BattleLogEntry[]
  turnNumber: number
  winner: PlayerId | null
}

export type GameAction =
  | { type: 'restart_game' }
  | { type: 'start_match'; deckSeed: MatchDeckSeed }
  | { type: 'select_player_card'; cardId: string }
  | { type: 'select_player_response'; cardId: string }
  | { type: 'select_stat'; stat: StatKey }
  | { type: 'clear_stat_limit_notice'; noticeId: number }
  | { type: 'clear_opponent_dialogue'; dialogueId: number }
  | { type: 'opponent_response'; cardId: string }
  | { type: 'opponent_turn_chosen'; cardId: string; stat: StatKey }
  | { type: 'resolve_battle' }
  | { type: 'complete_capture' }
  | { type: 'finish_draw_phase' }
  | { type: 'force_stage_clear' }
  | { type: 'add_stage_reward' }
  | { type: 'discard_stage_reward' }
