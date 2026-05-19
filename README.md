# Mind Reader: Trading Card Battle

A polished browser TCG prototype built with Vite, React, TypeScript, Framer Motion, and local full-card artwork.

## Run

```bash
npm install
npm run dev
```

For a production build:

```bash
npm run build
```

## Rules

Each player starts with a deck and draws to 5 cards. The active player chooses a card and one stat: Attack, Defense, Wisdom, or Charisma. The opponent responds with a card, both values are compared, and the winner captures the loser. The winning card returns to the winner's hand, the losing card moves to the winner's captured pile, and both players draw back up to 5 cards if possible.

Initiative stays with the battle winner. A player loses when they have no cards left in hand or deck.

Tie rule is configurable in `src/game/gameConfig.ts`. By default, ties compare secondary stats in this order: Attack, Defense, Wisdom, Charisma. If all stats tie, a random cinematic tie break decides the winner.

## File Structure

- `src/data/cards.ts` - imported real cards with names, rarity, type, lore, image filenames, numbers, and stats.
- `src/game/gameTypes.ts` - typed match state, phases, cards, actions, and battle results.
- `src/game/gameReducer.ts` - turn flow, capture flow, draw phase, and win-condition logic.
- `src/game/battleResolver.ts` - stat comparison and tie-break resolution.
- `src/game/ai.ts` - opponent response and opponent initiative logic.
- `src/game/soundManager.ts` - sound cue hooks ready for future audio files.
- `src/components/` - board, card, arena, hands, piles, panels, log, stat selector, debug, and victory overlay.
- `src/index.css` - full game UI theme, responsive layout, card art, textures, and animation states.
- `src/assets/cards/` - local card-art folder for all finished card renders.

## Add Cards

Add a new object to `src/data/cards.ts`:

```ts
{
  id: 'new-card',
  name: 'New Card',
  rarity: 'RA',
  type: 'Class / Role',
  lore: 'Short lore line.',
  image: 'new-card.png',
  artLayout: 'full-card',
  cardNumber: '778/777',
  stats: {
    attack: 80,
    defense: 70,
    wisdom: 90,
    charisma: 65,
  },
}
```

Use `artLayout: 'full-card'` when the image is already a finished card render with its own frame, title, stats, and lore.

## Replace Card Art

Drop an image into `src/assets/cards/`, then set the card's `image` field to the file name:

```ts
image: 'my-card-art.png'
```

The `Card` component automatically resolves local PNG, JPG, WEBP, and SVG assets from that folder.
