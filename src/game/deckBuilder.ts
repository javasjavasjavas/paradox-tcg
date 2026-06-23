import rawCards from '../data/tcgCards.json'
import { getStageById, type OpponentRarityMix, type StageData } from '../data/stages'
import { GAME_CONFIG } from './gameConfig'
import type { CardData, CardStats, MatchDeckSeed, PlayerId, Rarity } from './gameTypes'

type CatalogRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary'

interface TcgCatalogCard {
  tokenId: number
  id: string
  name: string
  description: string
  image: string
  cardNumber: string
  class: string
  rarity: CatalogRarity
  stats: CardStats
}

const tcgCards = rawCards as TcgCatalogCard[]

const emptyDeckSeed: MatchDeckSeed = {
  opponentId: 'remote-viewer',
  ownedTokenIds: [],
  playerCoreTokenIds: [],
  rewardTokenIds: [],
}

const normalizeTokenId = (tokenId: string | number) => Number.parseInt(String(tokenId), 10)

const catalogByTokenId = new Map(tcgCards.map((card) => [card.tokenId, card]))

const commonCards = tcgCards.filter((card) => card.rarity === 'Common')
const rareCards = tcgCards.filter((card) => card.rarity === 'Rare')
const epicCards = tcgCards.filter((card) => card.rarity === 'Epic')
const legendaryCards = tcgCards.filter((card) => card.rarity === 'Legendary')
const commonAndRareCards = [...commonCards, ...rareCards]
const cardsByRarity: Record<keyof OpponentRarityMix, TcgCatalogCard[]> = {
  common: commonCards,
  rare: rareCards,
  epic: epicCards,
  legendary: legendaryCards,
}

function uniqueTokenIds(tokenIds: string[]) {
  return [...new Set(tokenIds.map(normalizeTokenId).filter(Number.isFinite))]
}

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)]
}

function shuffleCards<T>(items: T[]) {
  const shuffled = [...items]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = shuffled[index]
    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = current
  }

  return shuffled
}

function createGameCard(card: TcgCatalogCard, owner: PlayerId, source: 'core' | 'fill' | 'reward', index: number): CardData {
  return {
    id: `${owner}-${source}-${card.tokenId}-${index}`,
    tokenId: card.tokenId,
    name: card.name,
    rarity: card.rarity as Rarity,
    type: card.class,
    lore: card.description,
    image: card.image,
    artLayout: 'full-card',
    cardNumber: card.cardNumber,
    stats: card.stats,
  }
}

function pickWeightedFillCard(excludedTokenIds: Set<number>) {
  const preferredPool = Math.random() < GAME_CONFIG.deckFillCommonChance ? commonCards : rareCards
  const backupPool = preferredPool === commonCards ? rareCards : commonCards

  const eligiblePreferred = preferredPool.filter((card) => !excludedTokenIds.has(card.tokenId))
  const eligibleBackup = backupPool.filter((card) => !excludedTokenIds.has(card.tokenId))
  const eligibleAny = commonAndRareCards.filter((card) => !excludedTokenIds.has(card.tokenId))
  const pool = eligiblePreferred.length ? eligiblePreferred : eligibleBackup.length ? eligibleBackup : eligibleAny

  return pool.length ? randomItem(pool) : null
}

function drawRandomCardsFromPool(
  pool: TcgCatalogCard[],
  count: number,
  excludedTokenIds: Set<number>,
) {
  const pickedCards = shuffleCards(pool.filter((card) => !excludedTokenIds.has(card.tokenId))).slice(0, count)

  pickedCards.forEach((card) => excludedTokenIds.add(card.tokenId))

  return pickedCards
}

function buildDeck(owner: PlayerId, coreTokenIds: number[] = [], rewardTokenIds: number[] = []) {
  const rewardCards = rewardTokenIds
    .map((tokenId) => catalogByTokenId.get(tokenId))
    .filter((card): card is TcgCatalogCard => Boolean(card))
  const excludedTokenIds = new Set<number>(rewardCards.map((card) => card.tokenId))
  const coreCards = coreTokenIds
    .map((tokenId) => catalogByTokenId.get(tokenId))
    .filter((card): card is TcgCatalogCard => Boolean(card))
    .slice(0, GAME_CONFIG.deckCoreLimit)

  const deck = coreCards.map((card, index) => {
    excludedTokenIds.add(card.tokenId)
    return createGameCard(card, owner, 'core', index)
  })

  while (deck.length < GAME_CONFIG.deckSize) {
    const fillCard = pickWeightedFillCard(excludedTokenIds)
    if (!fillCard) break
    excludedTokenIds.add(fillCard.tokenId)
    deck.push(createGameCard(fillCard, owner, 'fill', deck.length))
  }

  return [
    ...deck,
    ...rewardCards.map((card, index) => createGameCard(card, owner, 'reward', deck.length + index)),
  ]
}

function getRarityTargets(mix: OpponentRarityMix, deckSize: number) {
  const entries = (Object.entries(mix) as Array<[keyof OpponentRarityMix, number]>)
    .map(([rarity, share]) => ({
      rarity,
      rawCount: Math.max(0, share) * deckSize,
    }))
  const targets = new Map<keyof OpponentRarityMix, number>()
  let assignedCards = 0

  entries.forEach(({ rarity, rawCount }) => {
    const count = Math.floor(rawCount)
    targets.set(rarity, count)
    assignedCards += count
  })

  const remainingCards = deckSize - assignedCards
  const sortedRemainders = entries
    .map(({ rarity, rawCount }) => ({
      rarity,
      remainder: rawCount - Math.floor(rawCount),
    }))
    .sort((left, right) => right.remainder - left.remainder)

  for (let index = 0; index < remainingCards; index += 1) {
    const rarity = sortedRemainders[index % sortedRemainders.length]?.rarity ?? 'common'
    targets.set(rarity, (targets.get(rarity) ?? 0) + 1)
  }

  return targets
}

function buildOpponentDeck(opponent: StageData) {
  const excludedTokenIds = new Set<number>()
  const targets = getRarityTargets(opponent.deckRarityMix, GAME_CONFIG.deckSize)
  const selectedCards = [...targets.entries()].flatMap(([rarity, count]) =>
    drawRandomCardsFromPool(cardsByRarity[rarity], count, excludedTokenIds),
  )
  const allowedFallbackCards = (Object.entries(opponent.deckRarityMix) as Array<[keyof OpponentRarityMix, number]>)
    .filter(([, share]) => share > 0)
    .flatMap(([rarity]) => cardsByRarity[rarity])

  while (selectedCards.length < GAME_CONFIG.deckSize) {
    const fillCard = randomItem(allowedFallbackCards.filter((card) => !excludedTokenIds.has(card.tokenId)))
    if (!fillCard) break

    selectedCards.push(fillCard)
    excludedTokenIds.add(fillCard.tokenId)
  }

  return shuffleCards(selectedCards).map((card, index) => createGameCard(card, 'opponent', 'fill', index))
}

export function getCatalogCardByTokenId(tokenId: string | number) {
  return catalogByTokenId.get(normalizeTokenId(tokenId)) ?? null
}

export function buildRandomStageRewardCard(opponentId: string | undefined) {
  const stage = getStageById(opponentId)
  const rewardPool =
    stage.stage >= 5 ? legendaryCards : stage.stage >= 3 ? epicCards : rareCards
  const rewardCard = randomItem(rewardPool.length ? rewardPool : rareCards)

  return createGameCard(rewardCard, 'player', 'reward', Math.floor(Math.random() * 100000))
}

export function buildMatchDecks(deckSeed: MatchDeckSeed = emptyDeckSeed) {
  const ownedTokenIds = new Set(uniqueTokenIds(deckSeed.ownedTokenIds))
  const playerCoreTokenIds = uniqueTokenIds(deckSeed.playerCoreTokenIds)
    .filter((tokenId) => ownedTokenIds.has(tokenId))
    .slice(0, GAME_CONFIG.deckCoreLimit)
  const rewardTokenIds = uniqueTokenIds(deckSeed.rewardTokenIds ?? [])

  return {
    playerCards: buildDeck('player', playerCoreTokenIds, rewardTokenIds),
    opponentCards: buildOpponentDeck(getStageById(deckSeed.opponentId)),
  }
}
