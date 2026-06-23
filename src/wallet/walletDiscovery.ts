import type { Eip6963ProviderDetail, EvmProvider, SolanaProvider, WalletOption } from './walletTypes'

function describeEvmProvider(provider: EvmProvider, index: number) {
  if (provider.isPhantom) return 'Phantom'
  if (provider.isMetaMask) return 'MetaMask'
  if (provider.isCoinbaseWallet) return 'Coinbase Wallet'
  if (provider.isBraveWallet) return 'Brave Wallet'
  return index === 0 ? 'Browser Wallet' : `Browser Wallet ${index + 1}`
}

function addEvmOption(
  options: WalletOption[],
  seenProviders: Set<EvmProvider | SolanaProvider>,
  provider: EvmProvider | undefined,
  name?: string,
) {
  if (!provider || seenProviders.has(provider)) return

  seenProviders.add(provider)
  options.push({
    id: `evm-${options.length}-${name ?? describeEvmProvider(provider, options.length)}`,
    kind: 'evm',
    name: name ?? describeEvmProvider(provider, options.length),
    provider,
  })
}

function addSolanaOption(
  options: WalletOption[],
  seenProviders: Set<EvmProvider | SolanaProvider>,
  provider: SolanaProvider | undefined,
) {
  if (!provider || seenProviders.has(provider)) return

  seenProviders.add(provider)
  options.push({
    id: 'solana-phantom',
    kind: 'solana',
    name: provider.isPhantom ? 'Phantom Solana' : 'Solana Wallet',
    provider,
  })
}

export async function discoverWallets() {
  const options: WalletOption[] = []
  const seenProviders = new Set<EvmProvider | SolanaProvider>()
  const announced = new Map<string, Eip6963ProviderDetail>()

  const handleProviderAnnouncement = (event: WindowEventMap['eip6963:announceProvider']) => {
    announced.set(event.detail.info.uuid, event.detail)
  }

  window.addEventListener('eip6963:announceProvider', handleProviderAnnouncement)
  window.dispatchEvent(new Event('eip6963:requestProvider'))

  await new Promise((resolve) => window.setTimeout(resolve, 240))

  window.removeEventListener('eip6963:announceProvider', handleProviderAnnouncement)

  for (const detail of announced.values()) {
    addEvmOption(options, seenProviders, detail.provider, detail.info.name)
  }

  if (window.ethereum?.providers?.length) {
    window.ethereum.providers.forEach((provider) => addEvmOption(options, seenProviders, provider))
  }

  addEvmOption(options, seenProviders, window.phantom?.ethereum)
  addEvmOption(options, seenProviders, window.ethereum)
  addSolanaOption(options, seenProviders, window.phantom?.solana ?? window.solana)

  return options
}
