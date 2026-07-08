import { motion } from 'framer-motion'
import { AlertTriangle, ArrowLeft, CheckCircle2, Image, Loader2, UserRound, Wallet } from 'lucide-react'
import type { CSSProperties } from 'react'
import bgIntro from '../assets/ui/bg_intro.jpg'
import { formatAddress } from '../wallet/useWalletCollection'
import type { WalletCollectionController } from '../wallet/useWalletCollection'
import { WalletLinkButton } from './WalletLinkButton'

interface CollectionScreenProps {
  deckLimit: number
  deckTokenIds: string[]
  selectedPfpTokenId: string
  onBack: () => void
  onSelectPfpToken: (tokenId: string) => void
  onToggleDeckToken: (tokenId: string) => void
  wallet: WalletCollectionController
}

export function CollectionScreen({
  deckLimit,
  deckTokenIds,
  selectedPfpTokenId,
  onBack,
  onSelectPfpToken,
  onToggleDeckToken,
  wallet,
}: CollectionScreenProps) {
  const selectedTokenIds = new Set(deckTokenIds)
  const isDeckFull = deckTokenIds.length >= deckLimit

  return (
    <main
      className="collection-screen"
      style={{ '--intro-bg': `url(${bgIntro})` } as CSSProperties}
    >
      <header className="collection-header">
        <div className="collection-title">
          <h1>MY COLLECTION</h1>
        </div>

        {wallet.connectedWallet ? (
          <WalletLinkButton
            className="intro-wallet--inline collection-wallet-button"
            label={formatAddress(wallet.connectedWallet.address)}
            onClick={wallet.refreshTradingCards}
          />
        ) : null}
      </header>

      <section className="collection-status" data-status={wallet.walletStatus}>
        {wallet.walletStatus === 'connecting' || wallet.walletStatus === 'loading_nfts' ? (
          <Loader2 size={20} strokeWidth={1.8} />
        ) : wallet.walletStatus === 'error' ? (
          <AlertTriangle size={20} strokeWidth={1.8} />
        ) : (
          <CheckCircle2 size={20} strokeWidth={1.8} />
        )}
        <span>{wallet.walletMessage.toUpperCase()}</span>
      </section>

      {!wallet.connectedWallet ? (
        <>
          <section className="collection-connect" aria-label="CONNECT A WALLET">
            <h2>CONNECT WALLET</h2>
            <p>LINK METAMASK, PHANTOM, OR ANOTHER INSTALLED WALLET TO LOAD THE TRADING CARDS TIED TO THIS ADDRESS.</p>
            <div className="collection-wallet-options">
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
          </section>

          <footer className="collection-footer">
            <button type="button" className="collection-back" onClick={onBack}>
              <ArrowLeft size={18} strokeWidth={1.8} />
              <span>GO BACK</span>
            </button>
          </footer>
        </>
      ) : (
        <section className="collection-inventory" aria-label="WALLET COLLECTION">
          <section className="collection-section" aria-label="WALLET TRADING CARDS">
            <header className="collection-section__header">
              <span>TRADING CARDS</span>
              <small>{wallet.tradingCardNfts.length} CARDS</small>
            </header>

            <div className="collection-grid">
              {wallet.walletStatus === 'loading_nfts' ? (
                <p className="collection-empty">SCANNING TRADING CARDS...</p>
              ) : wallet.tradingCardNfts.length ? (
                wallet.tradingCardNfts.map((nft, index) => {
                  const isSelected = selectedTokenIds.has(nft.tokenId)
                  const isAddDisabled = !isSelected && isDeckFull
                  const deckActionLabel = isSelected ? 'IN DECK' : isAddDisabled ? 'DECK FULL' : 'ADD TO DECK'

                  return (
                    <motion.article
                      className="collection-card"
                      data-in-deck={isSelected}
                      key={`${nft.contractAddress ?? 'trading-card'}-${nft.tokenId}`}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, ease: 'easeOut', delay: index * 0.04 }}
                    >
                      {nft.imageUrl ? (
                        <img src={nft.imageUrl} alt={nft.name} />
                      ) : (
                        <div className="collection-card__placeholder">
                          <Image size={34} strokeWidth={1.5} />
                        </div>
                      )}
                      <div className="collection-card__meta">
                        <strong>{nft.name.toUpperCase()}</strong>
                        <span>#{nft.tokenId}</span>
                        <button
                          type="button"
                          className="collection-card__deck-toggle"
                          data-selected={isSelected}
                          disabled={isAddDisabled}
                          aria-pressed={isSelected}
                          onClick={() => onToggleDeckToken(nft.tokenId)}
                          title={isAddDisabled ? 'INITIAL HAND IS FULL' : undefined}
                        >
                          <CheckCircle2 size={16} strokeWidth={1.9} />
                          <span>{deckActionLabel}</span>
                        </button>
                      </div>
                    </motion.article>
                  )
                })
              ) : (
                <p className="collection-empty">NO TRADING CARDS LOADED.</p>
              )}
            </div>
          </section>

          <section className="collection-section collection-section--pfp" aria-label="PARADOX PFP">
            <header className="collection-section__header">
              <span>PARADOX PFP</span>
              <small>{wallet.paradoxPfpNfts.length} FOUND</small>
            </header>

            <div className="collection-grid collection-grid--pfp" role="radiogroup" aria-label="ACTIVE PARADOX PFP">
              {wallet.walletStatus === 'loading_nfts' ? (
                <p className="collection-empty">SCANNING PARADOX PFP...</p>
              ) : wallet.paradoxPfpNfts.length ? (
                wallet.paradoxPfpNfts.map((nft, index) => {
                  const isSelected = selectedPfpTokenId === nft.tokenId

                  return (
                    <motion.article
                      className="collection-card collection-card--pfp"
                      data-in-deck={isSelected}
                      key={`${nft.contractAddress ?? 'paradox-pfp'}-${nft.tokenId}`}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, ease: 'easeOut', delay: index * 0.04 }}
                    >
                      {nft.imageUrl ? (
                        <img src={nft.imageUrl} alt={nft.name} />
                      ) : (
                        <div className="collection-card__placeholder">
                          <Image size={34} strokeWidth={1.5} />
                        </div>
                      )}
                      <div className="collection-card__meta">
                        <strong>{nft.name.toUpperCase()}</strong>
                        <span>PFP #{nft.tokenId}</span>
                        <button
                          type="button"
                          className="collection-card__deck-toggle collection-card__character-toggle"
                          data-selected={isSelected}
                          aria-pressed={isSelected}
                          onClick={() => onSelectPfpToken(nft.tokenId)}
                        >
                          <UserRound size={16} strokeWidth={1.9} />
                          <span>{isSelected ? 'CHARACTER ACTIVE' : 'USE THIS CHARACTER'}</span>
                        </button>
                      </div>
                    </motion.article>
                  )
                })
              ) : (
                <p className="collection-empty">NO PARADOX PFP LOADED.</p>
              )}
            </div>
          </section>

          <footer className="collection-footer">
            <button type="button" className="collection-back" onClick={onBack}>
              <ArrowLeft size={18} strokeWidth={1.8} />
              <span>GO BACK</span>
            </button>
          </footer>
        </section>
      )}
    </main>
  )
}
