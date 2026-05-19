import { motion } from 'framer-motion'
import clsx from 'clsx'
import type { CSSProperties, MouseEvent } from 'react'
import { STAT_SHORT_LABELS } from '../game/gameConfig'
import type { CardData } from '../game/gameTypes'

type CardSize = 'hand' | 'arena' | 'panel' | 'inspect'

interface CardProps {
  card?: CardData | null
  faceDown?: boolean
  size?: CardSize
  disabled?: boolean
  selected?: boolean
  winner?: boolean
  loser?: boolean
  onClick?: (card: CardData) => void
  onContextMenu?: (card: CardData, event: MouseEvent<HTMLButtonElement>) => void
}

const cardImageModules = import.meta.glob('../assets/cards/*.{png,jpg,jpeg,webp,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const statKeys = ['attack', 'defense', 'wisdom', 'charisma'] as const

const hashString = (value: string) =>
  [...value].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 360, 19)

function resolveCardImage(image: string) {
  if (image.startsWith('/') || image.startsWith('http')) {
    return image
  }

  const match = Object.entries(cardImageModules).find(([path]) => path.endsWith(`/${image}`))
  return match?.[1] ?? null
}

function CardBack() {
  return (
    <div className="card-back" aria-hidden="true">
      <div className="card-back__ring" />
      <div className="card-back__crosshair" />
      <div className="card-back__core" />
    </div>
  )
}

function GeneratedArt({ card }: { card: CardData }) {
  const hue = hashString(card.id)
  const hueTwo = (hue + 54) % 360
  const hueThree = (hue + 194) % 360

  return (
    <div
      className="generated-art"
      style={
        {
          '--art-hue': hue,
          '--art-hue-two': hueTwo,
          '--art-hue-three': hueThree,
        } as CSSProperties
      }
    >
      <div className="generated-art__moon" />
      <div className="generated-art__grid" />
      <div className="generated-art__figure">
        <span className="generated-art__head" />
        <span className="generated-art__torso" />
        <span className="generated-art__coat" />
        <span className="generated-art__legs" />
      </div>
      <div className="generated-art__sigil">{card.rarity}</div>
    </div>
  )
}

function CardArt({ card }: { card: CardData }) {
  const imageSource = resolveCardImage(card.image)

  if (imageSource) {
    return <img className="card-art__image" src={imageSource} alt="" draggable={false} />
  }

  return <GeneratedArt card={card} />
}

export function Card({
  card,
  faceDown = false,
  size = 'hand',
  disabled = false,
  selected = false,
  winner = false,
  loser = false,
  onClick,
  onContextMenu,
}: CardProps) {
  const isInteractive = Boolean(card && onClick && !disabled && !faceDown)
  const isInspectable = Boolean(card && onContextMenu && !faceDown)
  const isFullCard = Boolean(card && card.artLayout === 'full-card')
  const fullCardImage = card ? resolveCardImage(card.image) : null

  return (
    <motion.button
      type="button"
      className={clsx('tcg-card', `tcg-card--${size}`, {
        'tcg-card--full-art': isFullCard,
        'is-face-down': faceDown,
        'is-selected': selected,
        'is-winner': winner,
        'is-loser': loser,
        'is-disabled': disabled,
        'is-interactive': isInteractive,
      })}
      disabled={!isInteractive && !isInspectable}
      onClick={() => card && onClick?.(card)}
      onContextMenu={(event) => {
        if (!card || faceDown || !onContextMenu) return
        event.preventDefault()
        onContextMenu(card, event)
      }}
      whileHover={isInteractive ? { y: -32, rotateX: 7, rotateY: -6, scale: 1.16, zIndex: 20 } : undefined}
      whileTap={isInteractive ? { scale: 0.98 } : undefined}
      layout
    >
      {!card || faceDown ? (
        <CardBack />
      ) : isFullCard && fullCardImage ? (
        <img className="tcg-card__full-image" src={fullCardImage} alt={card.name} draggable={false} />
      ) : (
        <>
          <div className="tcg-card__top">
            <span className="tcg-card__name">{card.name}</span>
            <span className="tcg-card__rarity">{card.rarity}</span>
          </div>

          <div className="tcg-card__type">{card.type}</div>

          <div className="card-art">
            <CardArt card={card} />
          </div>

          <p className="tcg-card__lore">{card.lore}</p>

          <div className="tcg-card__stats">
            {statKeys.map((stat) => (
              <span className="tcg-card__stat" key={stat}>
                <strong>{card.stats[stat]}</strong>
                <em>{STAT_SHORT_LABELS[stat]}</em>
              </span>
            ))}
          </div>

          <div className="tcg-card__number">{card.cardNumber}</div>
        </>
      )}
    </motion.button>
  )
}
