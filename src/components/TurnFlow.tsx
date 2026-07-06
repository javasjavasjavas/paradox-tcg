import { PHASE_LABELS, STAT_LABELS } from '../game/gameConfig'
import type { GameState, PlayerId } from '../game/gameTypes'

interface TurnFlowProps {
  state: GameState
}

const order: PlayerId[] = ['player', 'opponent', 'player']

const phaseDescription = (state: GameState) => {
  switch (state.phase) {
    case 'setup':
      return 'Syncing decks and preparing the first hand.'
    case 'player_select_card':
      return 'Select a card to open the exchange.'
    case 'player_select_stat':
      return 'Declare the stat this card will attack with.'
    case 'opponent_responding':
      return state.selectedStat
        ? `Opponent is answering your ${STAT_LABELS[state.selectedStat]} channel.`
        : 'Opponent is choosing a response.'
    case 'opponent_selecting_card_and_stat':
      return 'Opponent is calculating pressure.'
    case 'player_responding':
      return state.selectedStat
        ? `Choose a response to their ${STAT_LABELS[state.selectedStat]} channel.`
        : 'Choose a response card.'
    case 'battle_reveal':
      return state.selectedStat
        ? `${STAT_LABELS[state.selectedStat]} values are exposed.`
        : 'Revealing the exchange.'
    case 'resolving_battle':
      return 'Comparing values and checking tie breakers.'
    case 'capture_animation':
      return 'Banking the losing card and returning the winner.'
    case 'draw_phase':
      return 'Refilling hands before initiative continues.'
    case 'game_over':
      return 'Match complete.'
    default:
      return state.activePlayer === 'player'
        ? 'Select a card to open the exchange.'
        : 'Opponent is calculating pressure.'
  }
}

export function TurnFlow({ state }: TurnFlowProps) {
  const activeIndex = state.activePlayer === 'player' ? 0 : 1

  return (
    <section className="side-panel turn-flow">
      <div className="panel-title">Turn Order</div>
      <div className="turn-flow__list">
        {order.map((player, index) => (
          <div
            className="turn-flow__item"
            data-active={activeIndex === index}
            key={`${player}-${index}`}
          >
            <strong>{(index + 1).toString().padStart(2, '0')}</strong>
            <span>{player === 'player' ? 'You' : 'Opponent'}</span>
          </div>
        ))}
      </div>
      <div className="turn-flow__phase">
        <span>Current phase</span>
        <strong>{PHASE_LABELS[state.phase]}</strong>
        <p>{phaseDescription(state)}</p>
      </div>
    </section>
  )
}
