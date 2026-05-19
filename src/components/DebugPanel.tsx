import type { GameState } from '../game/gameTypes'

interface DebugPanelProps {
  state: GameState
  open: boolean
}

export function DebugPanel({ state, open }: DebugPanelProps) {
  if (!open) return null

  return (
    <aside className="debug-panel">
      <strong>Debug State</strong>
      <pre>
        {JSON.stringify(
          {
            phase: state.phase,
            activePlayer: state.activePlayer,
            selectedStat: state.selectedStat,
            turnNumber: state.turnNumber,
            playerHand: state.playerHand.length,
            playerDeck: state.playerDeck.length,
            opponentHand: state.opponentHand.length,
            opponentDeck: state.opponentDeck.length,
            arena: {
              player: state.arena.playerCard?.name,
              opponent: state.arena.opponentCard?.name,
            },
            winner: state.winner,
          },
          null,
          2,
        )}
      </pre>
    </aside>
  )
}
