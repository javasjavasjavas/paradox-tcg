import type { GamePhase, StatKey } from './gameTypes'

export const GAME_CONFIG = {
  handSize: 5,
  tieBreakerOrder: ['attack', 'defense', 'wisdom', 'charisma'] as StatKey[],
  aiRandomness: 0.18,
  timing: {
    opponentThinkMs: 850,
    revealMs: 760,
    resolveMs: 860,
    captureMs: 980,
    drawMs: 520,
  },
}

export const STAT_LABELS: Record<StatKey, string> = {
  attack: 'Attack',
  defense: 'Defense',
  wisdom: 'Wisdom',
  charisma: 'Charisma',
}

export const STAT_SHORT_LABELS: Record<StatKey, string> = {
  attack: 'ATK',
  defense: 'DEF',
  wisdom: 'WIS',
  charisma: 'CHA',
}

export const PHASE_LABELS: Record<GamePhase, string> = {
  setup: 'Initializing match',
  player_select_card: 'Choose a card',
  player_select_stat: 'Choose a stat',
  opponent_responding: 'Opponent is responding',
  opponent_selecting_card_and_stat: 'Opponent has initiative',
  player_responding: 'Choose your response',
  battle_reveal: 'Battle reveal',
  resolving_battle: 'Resolving battle',
  capture_animation: 'Card captured',
  draw_phase: 'Drawing cards',
  game_over: 'Game over',
}
