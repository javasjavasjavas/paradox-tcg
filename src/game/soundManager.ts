export type SoundCue =
  | 'card_select'
  | 'card_move'
  | 'stat_select'
  | 'battle_compare'
  | 'win'
  | 'capture'
  | 'turn_change'
  | 'victory'

export const soundManager = {
  play(cue: SoundCue) {
    void cue
    // Audio files can be wired here later without changing gameplay code.
  },
}
