import type { EvmProvider, WalletNft } from './walletTypes'

const balanceOfSelector = '0x70a08231'
const supportsInterfaceSelector = '0x01ffc9a7'
const tokenOfOwnerByIndexSelector = '0x2f745c59'
const tokenUriSelector = '0xc87b56dd'
const tokensOfOwnerSelector = '0x8462151c'
const ownerOfSelector = '0x6352211e'
const totalSupplySelector = '0x18160ddd'
const erc721EnumerableInterfaceId = '0x780e9d63'
const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
const logChunkSize = 9_999
const paradoxPfpContractAddress = '0xeb1352bC1BfD11e8a67E1253F02C21f99E4d1BD9'
const paradoxPfpStartBlock = '29805669'

interface NftMetadata {
  description?: string
  image?: string
  image_url?: string
  name?: string
}

export interface TradingCardNftConfig {
  chainId?: string
  contractAddress?: string
  gatewayUrl: string
  maxTokens: number
  ownerScanLimit?: number
  rpcUrl?: string
  startBlock?: string
}

interface EvmLog {
  blockNumber: string
  data: string
  logIndex: string
  topics: string[]
  transactionIndex: string
}

interface BatchEvmProvider extends EvmProvider {
  batchRequest?<T = unknown>(calls: Array<{
    method: string
    params?: unknown[] | Record<string, unknown>
  }>): Promise<T[]>
}

export function normalizeChainId(chainId: string) {
  const cleanChainId = chainId.trim()
  if (!cleanChainId) return ''
  return cleanChainId.startsWith('0x')
    ? `0x${BigInt(cleanChainId).toString(16)}`
    : `0x${BigInt(cleanChainId).toString(16)}`
}

export function getTradingCardNftConfig(): TradingCardNftConfig {
  const contractAddress = String(import.meta.env.VITE_TCG_NFT_CONTRACT_ADDRESS ?? '').trim()
  const chainId = String(import.meta.env.VITE_TCG_NFT_CHAIN_ID ?? '').trim()
  const gatewayUrl = String(import.meta.env.VITE_TCG_IPFS_GATEWAY ?? 'https://ipfs.io/ipfs/').trim()
  const maxTokens = Number(import.meta.env.VITE_TCG_NFT_MAX_TOKENS ?? 24)
  const startBlock = String(import.meta.env.VITE_TCG_NFT_START_BLOCK ?? '').trim()

  return {
    chainId: chainId ? normalizeChainId(chainId) : undefined,
    contractAddress: contractAddress || undefined,
    gatewayUrl: gatewayUrl.endsWith('/') ? gatewayUrl : `${gatewayUrl}/`,
    maxTokens: Number.isFinite(maxTokens) ? Math.max(1, Math.min(maxTokens, 80)) : 24,
    startBlock: startBlock ? `0x${BigInt(startBlock).toString(16)}` : undefined,
  }
}

export function getParadoxPfpNftConfig(): TradingCardNftConfig {
  const contractAddress = String(import.meta.env.VITE_PARADOX_PFP_NFT_CONTRACT_ADDRESS ?? paradoxPfpContractAddress).trim()
  const chainId = String(import.meta.env.VITE_PARADOX_PFP_NFT_CHAIN_ID ?? '8453').trim()
  const gatewayUrl = String(import.meta.env.VITE_TCG_IPFS_GATEWAY ?? 'https://ipfs.io/ipfs/').trim()
  const maxTokens = Number(import.meta.env.VITE_PARADOX_PFP_NFT_MAX_TOKENS ?? 24)
  const ownerScanLimit = Number(import.meta.env.VITE_PARADOX_PFP_NFT_OWNER_SCAN_LIMIT ?? 5000)
  const rpcUrl = String(import.meta.env.VITE_PARADOX_PFP_NFT_RPC_URL ?? 'https://base-rpc.publicnode.com').trim()
  const startBlock = String(import.meta.env.VITE_PARADOX_PFP_NFT_START_BLOCK ?? paradoxPfpStartBlock).trim()

  return {
    chainId: chainId ? normalizeChainId(chainId) : undefined,
    contractAddress: contractAddress || undefined,
    gatewayUrl: gatewayUrl.endsWith('/') ? gatewayUrl : `${gatewayUrl}/`,
    maxTokens: Number.isFinite(maxTokens) ? Math.max(1, Math.min(maxTokens, 80)) : 24,
    ownerScanLimit: Number.isFinite(ownerScanLimit) ? Math.max(0, Math.min(ownerScanLimit, 10_000)) : 5000,
    rpcUrl: rpcUrl || undefined,
    startBlock: startBlock ? `0x${BigInt(startBlock).toString(16)}` : undefined,
  }
}

export function getMissingNftConfigMessage() {
  const config = getTradingCardNftConfig()

  if (!config.contractAddress) {
    return 'Set VITE_TCG_NFT_CONTRACT_ADDRESS to load Trading Cards.'
  }

  return null
}

export function getMissingPfpConfigMessage() {
  const config = getParadoxPfpNftConfig()

  if (!config.contractAddress) {
    return 'Set VITE_PARADOX_PFP_NFT_CONTRACT_ADDRESS to load Paradox PFP.'
  }

  return null
}

function stripHexPrefix(value: string) {
  return value.startsWith('0x') ? value.slice(2) : value
}

function encodeAddress(address: string) {
  return stripHexPrefix(address).toLowerCase().padStart(64, '0')
}

function encodeTopicAddress(address: string) {
  return `0x${encodeAddress(address)}`
}

function decodeAddress(value: string) {
  const cleanValue = stripHexPrefix(value)
  if (cleanValue.length < 40) return ''
  return `0x${cleanValue.slice(-40)}`.toLowerCase()
}

function encodeUint256(value: bigint | number) {
  return BigInt(value).toString(16).padStart(64, '0')
}

function hexToBigInt(value: string) {
  const cleanValue = stripHexPrefix(value)
  return cleanValue ? BigInt(`0x${cleanValue}`) : 0n
}

function hexToBytes(hex: string) {
  const cleanHex = stripHexPrefix(hex)
  const bytes = new Uint8Array(cleanHex.length / 2)

  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(cleanHex.slice(index * 2, index * 2 + 2), 16)
  }

  return bytes
}

function decodeAbiString(value: string) {
  const cleanValue = stripHexPrefix(value)
  if (cleanValue.length < 128) return ''

  const offset = Number(hexToBigInt(cleanValue.slice(0, 64))) * 2
  const length = Number(hexToBigInt(cleanValue.slice(offset, offset + 64)))
  const stringHex = cleanValue.slice(offset + 64, offset + 64 + length * 2)

  return new TextDecoder().decode(hexToBytes(stringHex)).replace(/\0+$/, '')
}

function decodeAbiUint256Array(value: string) {
  const cleanValue = stripHexPrefix(value)
  if (cleanValue.length < 128) return []

  const offset = Number(hexToBigInt(cleanValue.slice(0, 64))) * 2
  const length = Number(hexToBigInt(cleanValue.slice(offset, offset + 64)))
  const tokenIds: bigint[] = []

  for (let index = 0; index < length; index += 1) {
    const start = offset + 64 + index * 64
    tokenIds.push(hexToBigInt(cleanValue.slice(start, start + 64)))
  }

  return tokenIds.length ? tokenIds : null
}

function resolveUri(uri: string, gatewayUrl: string) {
  if (uri.startsWith('ipfs://ipfs/')) {
    return `${gatewayUrl}${uri.slice('ipfs://ipfs/'.length)}`
  }

  if (uri.startsWith('ipfs://')) {
    return `${gatewayUrl}${uri.slice('ipfs://'.length)}`
  }

  if (uri.startsWith('ar://')) {
    return `https://arweave.net/${uri.slice('ar://'.length)}`
  }

  return uri
}

async function ethCall(provider: EvmProvider, to: string, data: string) {
  return provider.request<string>({
    method: 'eth_call',
    params: [{ data, to }, 'latest'],
  })
}

function createRpcProvider(rpcUrl: string): BatchEvmProvider {
  let requestId = 0

  return {
    async request<T = unknown>({ method, params }: { method: string; params?: unknown[] | Record<string, unknown> }) {
      requestId += 1
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: requestId,
          jsonrpc: '2.0',
          method,
          params: params ?? [],
        }),
      })

      if (!response.ok) {
        throw new Error(`RPC request failed with ${response.status}`)
      }

      const payload = (await response.json()) as { error?: { message?: string }; result?: T }

      if (payload.error) {
        throw new Error(payload.error.message ?? 'RPC request failed.')
      }

      return payload.result as T
    },

    async batchRequest<T = unknown>(calls: Array<{ method: string; params?: unknown[] | Record<string, unknown> }>) {
      if (!calls.length) return []

      const payload = calls.map((call) => {
        requestId += 1
        return {
          id: requestId,
          jsonrpc: '2.0',
          method: call.method,
          params: call.params ?? [],
        }
      })

      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`RPC batch request failed with ${response.status}`)
      }

      const results = (await response.json()) as Array<{
        error?: { message?: string }
        id: number
        result?: T
      }>
      const orderedResults = new Map(results.map((result) => [result.id, result]))

      return payload.map((call) => {
        const result = orderedResults.get(call.id)
        if (!result || result.error) return undefined as T
        return result.result as T
      })
    },
  }
}

async function getLatestBlock(provider: EvmProvider) {
  return hexToBigInt(await provider.request<string>({ method: 'eth_blockNumber' }))
}

async function getLogs(
  provider: EvmProvider,
  contractAddress: string,
  fromBlock: bigint,
  toBlock: bigint,
  topics: Array<string | null> = [transferTopic],
): Promise<EvmLog[]> {
  return provider.request<EvmLog[]>({
    method: 'eth_getLogs',
    params: [
      {
        address: contractAddress,
        fromBlock: `0x${fromBlock.toString(16)}`,
        toBlock: `0x${toBlock.toString(16)}`,
        topics,
      },
    ],
  })
}

async function fetchMetadata(tokenUri: string, gatewayUrl: string): Promise<NftMetadata> {
  if (!tokenUri) return {}

  if (tokenUri.startsWith('data:application/json;base64,')) {
    return JSON.parse(window.atob(tokenUri.slice('data:application/json;base64,'.length))) as NftMetadata
  }

  if (tokenUri.startsWith('data:application/json,')) {
    return JSON.parse(decodeURIComponent(tokenUri.slice('data:application/json,'.length))) as NftMetadata
  }

  const response = await fetch(resolveUri(tokenUri, gatewayUrl))
  if (!response.ok) {
    throw new Error(`Metadata request failed with ${response.status}`)
  }

  return response.json() as Promise<NftMetadata>
}

async function readTokenUri(provider: EvmProvider, contractAddress: string, tokenId: bigint) {
  const result = await ethCall(provider, contractAddress, `${tokenUriSelector}${encodeUint256(tokenId)}`)
  return decodeAbiString(result)
}

async function supportsInterface(provider: EvmProvider, contractAddress: string, interfaceId: string) {
  try {
    const result = await ethCall(
      provider,
      contractAddress,
      `${supportsInterfaceSelector}${stripHexPrefix(interfaceId).padEnd(64, '0')}`,
    )
    return hexToBigInt(result) === 1n
  } catch {
    return false
  }
}

function sortLogs(logs: EvmLog[]) {
  return [...logs].sort((left, right) => {
    const blockDiff = Number(hexToBigInt(left.blockNumber) - hexToBigInt(right.blockNumber))
    if (blockDiff !== 0) return blockDiff

    const transactionDiff = Number(hexToBigInt(left.transactionIndex) - hexToBigInt(right.transactionIndex))
    if (transactionDiff !== 0) return transactionDiff

    return Number(hexToBigInt(left.logIndex) - hexToBigInt(right.logIndex))
  })
}

async function getOwnedTokenIdsFromTransferLogs(
  provider: EvmProvider,
  contractAddress: string,
  ownerAddress: string,
  startBlock: string | undefined,
  maxTokens: number,
) {
  const ownerTopic = encodeTopicAddress(ownerAddress).toLowerCase()
  const latestBlock = await getLatestBlock(provider)
  const firstBlock = startBlock ? hexToBigInt(startBlock) : latestBlock > BigInt(logChunkSize) ? latestBlock - BigInt(logChunkSize) : 0n
  const logs: EvmLog[] = []

  for (let fromBlock = firstBlock; fromBlock <= latestBlock; fromBlock += BigInt(logChunkSize + 1)) {
    const toBlock = fromBlock + BigInt(logChunkSize) > latestBlock ? latestBlock : fromBlock + BigInt(logChunkSize)
    const incomingLogs = await getLogs(provider, contractAddress, fromBlock, toBlock, [transferTopic, null, ownerTopic])
    const outgoingLogs = await getLogs(provider, contractAddress, fromBlock, toBlock, [transferTopic, ownerTopic])

    logs.push(...incomingLogs, ...outgoingLogs)
  }

  const ownedTokenIds = new Set<string>()

  for (const log of sortLogs(logs)) {
    const fromTopic = log.topics[1]?.toLowerCase()
    const toTopic = log.topics[2]?.toLowerCase()
    const tokenId = log.topics[3] ? hexToBigInt(log.topics[3]).toString() : null

    if (!tokenId) continue
    if (fromTopic === ownerTopic) ownedTokenIds.delete(tokenId)
    if (toTopic === ownerTopic) ownedTokenIds.add(tokenId)
  }

  return [...ownedTokenIds].slice(0, maxTokens).map((tokenId) => BigInt(tokenId))
}

async function getEnumerableTokenIds(
  provider: EvmProvider,
  contractAddress: string,
  ownerAddress: string,
  tokenCount: number,
) {
  const tokenIds: bigint[] = []

  for (let index = 0; index < tokenCount; index += 1) {
    const tokenIdResult = await ethCall(
      provider,
      contractAddress,
      `${tokenOfOwnerByIndexSelector}${encodeAddress(ownerAddress)}${encodeUint256(index)}`,
    )
    tokenIds.push(hexToBigInt(tokenIdResult))
  }

  return tokenIds
}

async function getQueryableTokenIds(
  provider: EvmProvider,
  contractAddress: string,
  ownerAddress: string,
) {
  try {
    const result = await ethCall(
      provider,
      contractAddress,
      `${tokensOfOwnerSelector}${encodeAddress(ownerAddress)}`,
    )

    return decodeAbiUint256Array(result)
  } catch {
    return null
  }
}

async function getOwnerScannedTokenIds(
  provider: BatchEvmProvider,
  contractAddress: string,
  ownerAddress: string,
  ownerBalance: number,
  ownerScanLimit: number | undefined,
) {
  if (!ownerScanLimit || ownerScanLimit <= 0) return null

  let totalSupply: bigint

  try {
    totalSupply = hexToBigInt(await ethCall(provider, contractAddress, totalSupplySelector))
  } catch {
    return null
  }

  const scanCount = Number(totalSupply > BigInt(ownerScanLimit) ? BigInt(ownerScanLimit) : totalSupply)
  const ownerAddressLower = ownerAddress.toLowerCase()
  const tokenIds: bigint[] = []
  const batchSize = 100

  for (let tokenIdStart = 1; tokenIdStart <= scanCount; tokenIdStart += batchSize) {
    const tokenIdsToScan = Array.from(
      { length: Math.min(batchSize, scanCount - tokenIdStart + 1) },
      (_, index) => BigInt(tokenIdStart + index),
    )

    const calls = tokenIdsToScan.map((tokenId) => ({
      method: 'eth_call',
      params: [
        {
          data: `${ownerOfSelector}${encodeUint256(tokenId)}`,
          to: contractAddress,
        },
        'latest',
      ],
    }))
    const ownerResults = provider.batchRequest
      ? await provider.batchRequest<string>(calls)
      : await Promise.all(calls.map((call) => provider.request<string>(call).catch(() => undefined)))

    ownerResults.forEach((ownerResult, index) => {
      if (ownerResult && decodeAddress(ownerResult) === ownerAddressLower) {
        tokenIds.push(tokenIdsToScan[index])
      }
    })

    if (tokenIds.length >= ownerBalance) break
  }

  return tokenIds
}

export async function switchEvmChain(provider: EvmProvider, chainId: string) {
  await provider.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId }],
  })
}

async function fetchContractNfts(
  provider: EvmProvider,
  ownerAddress: string,
  config: TradingCardNftConfig,
  collection: WalletNft['collection'],
  fallbackName: string,
) {
  if (!config.contractAddress) {
    throw new Error(`${fallbackName} contract is not configured.`)
  }

  const readProvider: BatchEvmProvider = config.rpcUrl ? createRpcProvider(config.rpcUrl) : provider
  const balanceResult = await ethCall(
    readProvider,
    config.contractAddress,
    `${balanceOfSelector}${encodeAddress(ownerAddress)}`,
  )
  const balance = hexToBigInt(balanceResult)
  const tokenCount = Number(balance > BigInt(config.maxTokens) ? BigInt(config.maxTokens) : balance)
  const nfts: WalletNft[] = []

  if (tokenCount === 0) return nfts

  const queryableTokenIds = await getQueryableTokenIds(readProvider, config.contractAddress, ownerAddress)
  const supportsEnumerable = queryableTokenIds ? false : await supportsInterface(readProvider, config.contractAddress, erc721EnumerableInterfaceId)
  const tokenIds = queryableTokenIds
    ? queryableTokenIds.slice(0, tokenCount)
    : supportsEnumerable
      ? await getEnumerableTokenIds(readProvider, config.contractAddress, ownerAddress, tokenCount)
      : await getOwnerScannedTokenIds(
          readProvider,
          config.contractAddress,
          ownerAddress,
          tokenCount,
          config.ownerScanLimit,
        ) ?? await getOwnedTokenIdsFromTransferLogs(
            readProvider,
            config.contractAddress,
            ownerAddress,
            config.startBlock,
            config.maxTokens,
          )

  for (const tokenId of tokenIds) {
    const tokenUri = await readTokenUri(readProvider, config.contractAddress, tokenId)
    const metadata = await fetchMetadata(tokenUri, config.gatewayUrl)
    const imageUrl = metadata.image_url ?? metadata.image

    nfts.push({
      collection,
      contractAddress: config.contractAddress,
      description: metadata.description,
      imageUrl: imageUrl ? resolveUri(imageUrl, config.gatewayUrl) : undefined,
      name: metadata.name ?? `${fallbackName} #${tokenId.toString()}`,
      tokenId: tokenId.toString(),
      tokenUri,
    })
  }

  return nfts
}

export async function fetchTradingCardNfts(provider: EvmProvider, ownerAddress: string) {
  const config = getTradingCardNftConfig()

  if (!config.contractAddress) {
    throw new Error(getMissingNftConfigMessage() ?? 'Trading Cards contract is not configured.')
  }

  return fetchContractNfts(provider, ownerAddress, config, 'trading-card', 'Trading Card')
}

export async function fetchParadoxPfpNfts(provider: EvmProvider, ownerAddress: string) {
  const config = getParadoxPfpNftConfig()

  if (!config.contractAddress) {
    throw new Error(getMissingPfpConfigMessage() ?? 'Paradox PFP contract is not configured.')
  }

  return fetchContractNfts(provider, ownerAddress, config, 'paradox-pfp', 'Paradox PFP')
}
