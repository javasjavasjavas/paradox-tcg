export type WalletKind = 'evm' | 'solana'
export type WalletStatus = 'idle' | 'connecting' | 'loading_nfts' | 'ready' | 'error'

export interface EvmProvider {
  isBraveWallet?: boolean
  isCoinbaseWallet?: boolean
  isMetaMask?: boolean
  isPhantom?: boolean
  providers?: EvmProvider[]
  request<T = unknown>(args: {
    method: string
    params?: unknown[] | Record<string, unknown>
  }): Promise<T>
}

export interface SolanaProvider {
  isPhantom?: boolean
  publicKey?: {
    toString(): string
  }
  connect(): Promise<{
    publicKey: {
      toString(): string
    }
  }>
  disconnect?(): Promise<void>
}

export interface WalletOption {
  id: string
  name: string
  kind: WalletKind
  provider: EvmProvider | SolanaProvider
}

export interface ConnectedWallet {
  address: string
  chainId?: string
  kind: WalletKind
  name: string
  provider: EvmProvider | SolanaProvider
}

export interface WalletNft {
  collection: 'trading-card' | 'paradox-pfp'
  contractAddress?: string
  description?: string
  imageUrl?: string
  name: string
  tokenId: string
  tokenUri?: string
}

export interface Eip6963ProviderDetail {
  info: {
    icon?: string
    name: string
    rdns?: string
    uuid: string
  }
  provider: EvmProvider
}

declare global {
  interface Window {
    ethereum?: EvmProvider
    phantom?: {
      ethereum?: EvmProvider
      solana?: SolanaProvider
    }
    solana?: SolanaProvider
  }

  interface WindowEventMap {
    'eip6963:announceProvider': CustomEvent<Eip6963ProviderDetail>
  }
}
