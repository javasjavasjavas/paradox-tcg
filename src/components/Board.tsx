import { Bug, RotateCcw, SkipForward } from 'lucide-react'
import { useState, type Dispatch } from 'react'
import { BattleArena } from './BattleArena'
import { BattleLog } from './BattleLog'
import { CardInspector } from './CardInspector'
import { DebugPanel } from './DebugPanel'
import { Hand } from './Hand'
import { PlayerPanel } from './PlayerPanel'
import { RoundPanel } from './RoundPanel'
import { StatSelector } from './StatSelector'
import { TurnFlow } from './TurnFlow'
import { VictoryOverlay } from './VictoryOverlay'
import { WinConditionPanel } from './WinConditionPanel'
import type { CardData, GameAction, GameState, StatKey } from '../game/gameTypes'

interface BoardProps {
  state: GameState
  dispatch: Dispatch<GameAction>
  skipAnimations: boolean
  debugOpen: boolean
  onToggleAnimations: () => void
  onToggleDebug: () => void
}

const availableCount = (deck: CardData[], hand: CardData[]) => deck.length + hand.length

export function Board({
  state,
  dispatch,
  skipAnimations,
  debugOpen,
  onToggleAnimations,
  onToggleDebug,
}: BoardProps) {
  const [inspectedCard, setInspectedCard] = useState<CardData | null>(null)
  const playerFeatured =
    state.arena.playerCard ?? state.playerHand[0] ?? state.playerCaptured.at(-1) ?? null
  const opponentFeatured =
    state.arena.opponentCard ?? state.opponentHand[0] ?? state.opponentCaptured.at(-1) ?? null
  const canSelectPlayerCard = state.phase === 'player_select_card'
  const canRespond = state.phase === 'player_responding'
  const playerSelectable = canSelectPlayerCard || canRespond

  const handlePlayerCardClick = (card: CardData) => {
    dispatch({
      type: canRespond ? 'select_player_response' : 'select_player_card',
      cardId: card.id,
    })
  }

  const handleStatSelect = (stat: StatKey) => {
    dispatch({ type: 'select_stat', stat })
  }

  const restart = () => dispatch({ type: 'restart_game' })

  return (
    <main className="game-shell" data-skip-animations={skipAnimations}>
      <div className="app-chrome">
        <div>
          <span className="eyebrow">Mind Reader</span>
          <h1 className="brand-title">
            <span className="brand-title__trading">Trading Card</span>
            <span className="brand-title__battle">Battle</span>
          </h1>
        </div>
        <div className="chrome-actions">
          <button type="button" className="icon-action" onClick={onToggleAnimations}>
            <SkipForward size={17} />
            {skipAnimations ? 'Animations skipped' : 'Skip animations'}
          </button>
          <button type="button" className="icon-action" onClick={onToggleDebug}>
            <Bug size={17} />
            Debug
          </button>
          <button type="button" className="icon-action" onClick={restart}>
            <RotateCcw size={17} />
            Restart
          </button>
        </div>
      </div>

      <div className="board-frame">
        <aside className="board-column board-column--left">
          <PlayerPanel
            player="opponent"
            title="Opponent Info"
            featuredCard={opponentFeatured}
            deckCount={state.opponentDeck.length}
            capturedCount={state.opponentCaptured.length}
            isActive={state.activePlayer === 'opponent'}
          />
          <TurnFlow state={state} />
          <PlayerPanel
            player="player"
            title="Player Info"
            featuredCard={playerFeatured}
            deckCount={state.playerDeck.length}
            capturedCount={state.playerCaptured.length}
            isActive={state.activePlayer === 'player'}
          />
        </aside>

        <section className="board-main">
          <Hand label="Opponent Hand" cards={state.opponentHand} faceDown />
          <BattleArena state={state} />
          <StatSelector
            card={state.arena.playerCard}
            selectedStat={state.selectedStat}
            disabled={state.phase !== 'player_select_stat'}
            onSelect={handleStatSelect}
          />
          <Hand
            label="Your Hand"
            cards={state.playerHand}
            selectable={playerSelectable}
            onCardClick={handlePlayerCardClick}
            onCardInspect={setInspectedCard}
          />
        </section>

        <aside className="board-column board-column--right">
          <RoundPanel turnNumber={state.turnNumber} />
          <WinConditionPanel
            opponentAvailable={availableCount(state.opponentDeck, state.opponentHand)}
            playerAvailable={availableCount(state.playerDeck, state.playerHand)}
          />
          <BattleLog entries={state.log} />
        </aside>
      </div>

      <DebugPanel state={state} open={debugOpen} />
      <CardInspector card={inspectedCard} onClose={() => setInspectedCard(null)} />
      <VictoryOverlay state={state} onRestart={restart} />
    </main>
  )
}
