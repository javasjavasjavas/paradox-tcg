import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle2,
  Image,
  Layers,
  Loader2,
  Play,
  Settings,
  Trophy,
  UserRound,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import bgIntro from '../assets/ui/bg_intro.jpg'
import paradoxLogo from '../assets/ui/paradox-lex-machina-logo.png'
import { formatAddress } from '../wallet/useWalletCollection'
import type { WalletCollectionController } from '../wallet/useWalletCollection'
import { WalletLinkButton } from './WalletLinkButton'

interface IntroScreenProps {
  gateMessage?: string | null
  onOpenLeaderboard: () => void
  onStartGame: () => void
  onOpenCollection: () => void
  onSelectPfpToken: (tokenId: string) => void
  selectedPfpTokenId: string
  startGameDetail: string
  wallet: WalletCollectionController
}

interface IntroMenuOption {
  label: string
  detail: string
  Icon: LucideIcon
}

const secondaryOptions: IntroMenuOption[] = [
  {
    label: 'LEADERBOARD',
    detail: 'GLOBAL RANKINGS',
    Icon: Trophy,
  },
  {
    label: 'OPTIONS',
    detail: 'PROTOCOL STABLE',
    Icon: Settings,
  },
]

function getCollectionDetail(wallet: WalletCollectionController) {
  if (wallet.walletStatus === 'loading_nfts') return 'SCANNING CARDS'
  if (wallet.connectedWallet) return `${wallet.tradingCardNfts.length} CARDS`
  return 'WALLET REQUIRED'
}

export function IntroScreen({
  gateMessage = null,
  onOpenLeaderboard,
  onOpenCollection,
  onSelectPfpToken,
  onStartGame,
  selectedPfpTokenId,
  startGameDetail,
  wallet,
}: IntroScreenProps) {
  const [walletPanelOpen, setWalletPanelOpen] = useState(false)
  const walletButtonLabel =
    wallet.walletStatus === 'connecting'
      ? 'CONNECTING'
      : wallet.connectedWallet
        ? formatAddress(wallet.connectedWallet.address)
        : 'CONNECT WALLET'

  function handleWalletButtonClick() {
    if (!wallet.connectedWallet && wallet.walletOptions.length === 1) {
      setWalletPanelOpen(true)
      void wallet.connectWallet(wallet.walletOptions[0])
      return
    }

    setWalletPanelOpen((current) => !current)
  }

  return (
    <main
      className="intro-screen"
      style={{ '--intro-bg': `url(${bgIntro})` } as CSSProperties}
    >
      <span className="intro-font-preload" aria-hidden="true">
        STAGE 1
      </span>
      <div className="intro-screen__particles" aria-hidden="true">
        {Array.from({ length: 42 }, (_, index) => (
          <i key={index} />
        ))}
      </div>

      <section className="intro-screen__content" aria-label="Main menu">
        <div className="intro-brand">
          <img className="intro-brand__logo" src={paradoxLogo} alt="Paradox" />
        </div>

        <nav className="intro-menu" aria-label="Game menu">
          <button
            type="button"
            aria-label="START GAME"
            className="intro-menu__item intro-menu__item--primary"
            onClick={onStartGame}
          >
            <Play size={24} strokeWidth={1.8} />
            <span>START GAME</span>
            <small>{startGameDetail}</small>
          </button>

          <button type="button" className="intro-menu__item" onClick={onOpenCollection}>
            <Layers size={24} strokeWidth={1.6} />
            <span>MY COLLECTION</span>
            <small>{getCollectionDetail(wallet)}</small>
          </button>

          {secondaryOptions.map(({ label, detail, Icon }) => (
            <button
              type="button"
              className="intro-menu__item"
              key={label}
              onClick={label === 'LEADERBOARD' ? onOpenLeaderboard : undefined}
            >
              <Icon size={24} strokeWidth={1.6} />
              <span>{label}</span>
              <small>{detail}</small>
            </button>
          ))}
        </nav>

        <AnimatePresence>
          {gateMessage ? (
            <motion.div
              className="intro-gate-message"
              initial={{ opacity: 0, y: -8, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(6px)' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              role="status"
            >
              <AlertTriangle size={16} strokeWidth={1.8} />
              <span>{gateMessage}</span>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </section>

      <AnimatePresence>
        {walletPanelOpen && (
          <motion.aside
            className="intro-wallet-panel"
            initial={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 18, filter: 'blur(8px)' }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            aria-label="Wallet panel"
          >
            <header className="wallet-panel__header">
              <div>
                <span>WALLET LINK</span>
                <strong>{wallet.connectedWallet ? wallet.connectedWallet.name.toUpperCase() : 'SELECT SIGNAL'}</strong>
              </div>
              <button type="button" aria-label="CLOSE WALLET PANEL" onClick={() => setWalletPanelOpen(false)}>
                <X size={18} strokeWidth={1.8} />
              </button>
            </header>

            <div className="wallet-panel__status" data-status={wallet.walletStatus}>
              {wallet.walletStatus === 'connecting' || wallet.walletStatus === 'loading_nfts' ? (
                <Loader2 size={18} strokeWidth={1.8} />
              ) : wallet.walletStatus === 'error' ? (
                <AlertTriangle size={18} strokeWidth={1.8} />
              ) : (
                <CheckCircle2 size={18} strokeWidth={1.8} />
              )}
              <span>{wallet.walletMessage.toUpperCase()}</span>
            </div>

            {!wallet.connectedWallet ? (
              <div className="wallet-options">
                {wallet.walletOptions.length ? (
                  wallet.walletOptions.map((option) => (
                    <button type="button" className="wallet-option" key={option.id} onClick={() => void wallet.connectWallet(option)}>
                      <Wallet size={18} strokeWidth={1.8} />
                      <span>{option.name.toUpperCase()}</span>
                      <small>{option.kind === 'evm' ? 'EVM' : 'SOLANA'}</small>
                    </button>
                  ))
                ) : (
                  <p className="wallet-panel__empty">INSTALL METAMASK, PHANTOM, OR ANOTHER WALLET.</p>
                )}
              </div>
            ) : (
              <>
                <div className="wallet-panel__account">
                  <span>{wallet.connectedWallet.kind === 'evm' ? wallet.connectedWallet.chainId ?? 'EVM' : 'Solana'}</span>
                  <strong>{formatAddress(wallet.connectedWallet.address)}</strong>
                  <button type="button" onClick={wallet.refreshTradingCards} disabled={wallet.connectedWallet.kind !== 'evm'}>
                    REFRESH CARDS
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWalletPanelOpen(false)
                      onOpenCollection()
                    }}
                  >
                    VIEW COLLECTION
                  </button>
                </div>

                <div className="wallet-section-heading">
                  <span>TRADING CARDS</span>
                  <small>{wallet.tradingCardNfts.length} CARDS</small>
                </div>

                <div className="wallet-nfts" aria-label="TRADING CARD NFTS">
                  {wallet.walletStatus === 'loading_nfts' ? (
                    <p className="wallet-panel__empty">SCANNING TRADING CARDS...</p>
                  ) : wallet.tradingCardNfts.length ? (
                    wallet.tradingCardNfts.map((nft) => (
                      <article className="wallet-nft" key={`${nft.contractAddress ?? 'trading-card'}-${nft.tokenId}`}>
                        {nft.imageUrl ? (
                          <img src={nft.imageUrl} alt={nft.name} />
                        ) : (
                          <div className="wallet-nft__placeholder">
                            <Image size={24} strokeWidth={1.6} />
                          </div>
                        )}
                        <div>
                          <strong>{nft.name.toUpperCase()}</strong>
                          <span>#{nft.tokenId}</span>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="wallet-panel__empty">NO TRADING CARDS LOADED.</p>
                  )}
                </div>

                <div className="wallet-section-heading">
                  <span>PARADOX PFP</span>
                  <small>{wallet.paradoxPfpNfts.length} FOUND</small>
                </div>

                <div className="wallet-nfts wallet-nfts--pfp" aria-label="PARADOX PFP NFTS">
                  {wallet.walletStatus === 'loading_nfts' ? (
                    <p className="wallet-panel__empty">SCANNING PARADOX PFP...</p>
                  ) : wallet.paradoxPfpNfts.length ? (
                    wallet.paradoxPfpNfts.map((nft) => {
                      const isSelected = selectedPfpTokenId === nft.tokenId

                      return (
                        <article
                          className="wallet-nft wallet-nft--pfp"
                          data-selected={isSelected}
                          key={`${nft.contractAddress ?? 'paradox-pfp'}-${nft.tokenId}`}
                        >
                          {nft.imageUrl ? (
                            <img src={nft.imageUrl} alt={nft.name} />
                          ) : (
                            <div className="wallet-nft__placeholder">
                              <Image size={24} strokeWidth={1.6} />
                            </div>
                          )}
                          <div>
                            <strong>{nft.name.toUpperCase()}</strong>
                            <span>PFP #{nft.tokenId}</span>
                            <button
                              type="button"
                              className="wallet-nft__action"
                              data-selected={isSelected}
                              onClick={() => onSelectPfpToken(nft.tokenId)}
                            >
                              <UserRound size={14} strokeWidth={1.9} />
                              <span>{isSelected ? 'CHARACTER ACTIVE' : 'USE THIS CHARACTER'}</span>
                            </button>
                          </div>
                        </article>
                      )
                    })
                  ) : (
                    <p className="wallet-panel__empty">NO PARADOX PFP LOADED.</p>
                  )}
                </div>
              </>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      <WalletLinkButton
        label={walletButtonLabel}
        isExpanded={walletPanelOpen}
        isLoading={wallet.walletStatus === 'connecting'}
        onClick={handleWalletButtonClick}
        disabled={wallet.walletStatus === 'connecting'}
      />
    </main>
  )
}
