import { useEffect, useMemo, useState } from 'react'
import {
  fetchParadoxPfpNfts,
  fetchTradingCardNfts,
  getMissingNftConfigMessage,
  getMissingPfpConfigMessage,
  getTradingCardNftConfig,
  normalizeChainId,
  switchEvmChain,
} from './evmNfts'
import { discoverWallets } from './walletDiscovery'
import type { ConnectedWallet, EvmProvider, SolanaProvider, WalletNft, WalletOption, WalletStatus } from './walletTypes'

export function isEvmProvider(provider: WalletOption['provider']): provider is EvmProvider {
  return 'request' in provider
}

export function isSolanaProvider(provider: WalletOption['provider']): provider is SolanaProvider {
  return 'connect' in provider
}

export function formatAddress(address: string) {
  const displayAddress = address.toUpperCase()
  if (displayAddress.length <= 12) return displayAddress
  return `${displayAddress.slice(0, 6)}...${displayAddress.slice(-4)}`
}

function getNftLoadErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unable to load Trading Cards.'

  if (message.toLowerCase().includes('execution reverted')) {
    return 'Wallet linked, but this contract does not expose ERC-721 Enumerable reads.'
  }

  return message
}

export function useWalletCollection() {
  const [walletOptions, setWalletOptions] = useState<WalletOption[]>([])
  const [connectedWallet, setConnectedWallet] = useState<ConnectedWallet | null>(null)
  const [walletStatus, setWalletStatus] = useState<WalletStatus>('idle')
  const [walletMessage, setWalletMessage] = useState('Wallet link offline.')
  const [tradingCardNfts, setTradingCardNfts] = useState<WalletNft[]>([])
  const [paradoxPfpNfts, setParadoxPfpNfts] = useState<WalletNft[]>([])
  const missingNftConfigMessage = useMemo(() => getMissingNftConfigMessage(), [])
  const missingPfpConfigMessage = useMemo(() => getMissingPfpConfigMessage(), [])

  useEffect(() => {
    let active = true

    discoverWallets().then((options) => {
      if (!active) return
      setWalletOptions(options)
      setWalletMessage(options.length ? 'Wallet signal detected.' : 'No wallet extension detected.')
    })

    return () => {
      active = false
    }
  }, [])

  async function loadWalletNfts(provider: EvmProvider, address: string) {
    setWalletStatus('loading_nfts')

    let tradingCards: WalletNft[] = []
    let paradoxPfps: WalletNft[] = []
    let tradingCardError: unknown = null
    let paradoxPfpError: unknown = null

    if (missingNftConfigMessage) {
      tradingCardError = new Error(missingNftConfigMessage)
    } else {
      try {
        tradingCards = await fetchTradingCardNfts(provider, address)
      } catch (error) {
        tradingCardError = error
      }
    }

    if (missingPfpConfigMessage) {
      paradoxPfpError = new Error(missingPfpConfigMessage)
    } else {
      try {
        paradoxPfps = await fetchParadoxPfpNfts(provider, address)
      } catch (error) {
        paradoxPfpError = error
      }
    }

    setTradingCardNfts(tradingCards)
    setParadoxPfpNfts(paradoxPfps)

    if (tradingCardError) {
      setWalletStatus('error')
      setWalletMessage(getNftLoadErrorMessage(tradingCardError))
      return
    }

    const tradingCardMessage = tradingCards.length
      ? `${tradingCards.length} Trading Cards`
      : 'No Trading Cards found'
    const pfpMessage = paradoxPfpError
      ? 'PFP scan offline'
      : paradoxPfps.length
        ? `${paradoxPfps.length} Paradox PFP`
        : 'No Paradox PFP found'

    setWalletStatus('ready')
    setWalletMessage(`${tradingCardMessage} / ${pfpMessage}.`)
  }

  async function connectWallet(option: WalletOption) {
    setWalletStatus('connecting')
    setWalletMessage(`Connecting ${option.name}...`)
    setTradingCardNfts([])
    setParadoxPfpNfts([])

    try {
      if (isEvmProvider(option.provider)) {
        const accounts = await option.provider.request<string[]>({ method: 'eth_requestAccounts' })
        const address = accounts[0]

        if (!address) {
          throw new Error('No wallet account returned.')
        }

        let chainId = await option.provider.request<string>({ method: 'eth_chainId' })
        const config = getTradingCardNftConfig()

        if (config.chainId && normalizeChainId(chainId) !== config.chainId) {
          await switchEvmChain(option.provider, config.chainId)
          chainId = await option.provider.request<string>({ method: 'eth_chainId' })
        }

        setConnectedWallet({
          address,
          chainId,
          kind: 'evm',
          name: option.name,
          provider: option.provider,
        })

        await loadWalletNfts(option.provider, address)
        return
      }

      if (isSolanaProvider(option.provider)) {
        const response = await option.provider.connect()
        setConnectedWallet({
          address: response.publicKey.toString(),
          kind: 'solana',
          name: option.name,
          provider: option.provider,
        })
        setWalletStatus('ready')
        setParadoxPfpNfts([])
        setWalletMessage('Phantom Solana linked. Trading Cards need an EVM contract or indexer.')
      }
    } catch (error) {
      setWalletStatus('error')
      setWalletMessage(error instanceof Error ? error.message : 'Wallet connection rejected.')
    }
  }

  function refreshTradingCards() {
    if (connectedWallet?.kind !== 'evm' || !isEvmProvider(connectedWallet.provider)) return
    void loadWalletNfts(connectedWallet.provider, connectedWallet.address)
  }

  return {
    connectedWallet,
    connectWallet,
    paradoxPfpNfts,
    refreshTradingCards,
    tradingCardNfts,
    walletMessage,
    walletOptions,
    walletStatus,
  }
}

export type WalletCollectionController = ReturnType<typeof useWalletCollection>
