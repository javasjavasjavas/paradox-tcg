import { AlertTriangle, Monitor, ShieldCheck, WalletCards } from 'lucide-react'
import { motion, type Variants } from 'framer-motion'
import type { CSSProperties } from 'react'
import bgIntro from '../assets/ui/bg_intro.jpg'
import paradoxLogo from '../assets/ui/paradox-lex-machina-logo.png'

interface EntryGateProps {
  isMobile: boolean
  onAccept: () => void
}

const particleCount = 42

const panelVariants: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.98, filter: 'blur(12px)' },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.34, ease: 'easeOut' },
  },
}

export function EntryGate({ isMobile, onAccept }: EntryGateProps) {
  return (
    <main
      className="entry-gate"
      data-mobile={isMobile}
      style={{ '--intro-bg': `url(${bgIntro})` } as CSSProperties}
    >
      <div className="intro-screen__particles" aria-hidden="true">
        {Array.from({ length: particleCount }, (_, index) => (
          <i key={index} />
        ))}
      </div>

      <motion.section
        className="entry-gate__panel"
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        aria-label={isMobile ? 'Desktop required' : 'Wallet safety notice'}
      >
        <img className="entry-gate__logo" src={paradoxLogo} alt="Paradox Lex Machina" />

        {isMobile ? (
          <>
            <div className="entry-gate__kicker">
              <div className="entry-gate__icon" aria-hidden="true">
                <Monitor size={18} strokeWidth={1.7} />
              </div>
              <span>DESKTOP REQUIRED</span>
            </div>

            <header className="entry-gate__header">
              <h1>PLAY ON DESKTOP</h1>
            </header>

            <p className="entry-gate__copy">
              PARADOX TCG IS BUILT FOR DESKTOP PLAY. MOBILE BROWSERS ARE NOT SUPPORTED FOR
              MATCHES, WALLET REVIEW, OR COLLECTION MANAGEMENT.
            </p>

            <div className="entry-gate__locked" role="status">
              <AlertTriangle size={16} strokeWidth={1.8} />
              <span>RETURN FROM A DESKTOP BROWSER TO CONTINUE.</span>
            </div>
          </>
        ) : (
          <>
            <div className="entry-gate__kicker">
              <div className="entry-gate__icon" aria-hidden="true">
                <ShieldCheck size={18} strokeWidth={1.7} />
              </div>
              <span>READ-ONLY WALLET ACCESS</span>
            </div>

            <header className="entry-gate__header">
              <h1>SAFETY CHECK</h1>
            </header>

            <p className="entry-gate__copy">
              THIS SITE REQUIRES A WALLET CONNECTION TO READ YOUR PARADOX TCG CARDS AND BUILD
              YOUR PLAYABLE COLLECTION. ACCESS IS READ-ONLY.
            </p>

            <ul className="entry-gate__warnings" aria-label="Wallet safety warnings">
              <li>
                <WalletCards size={15} strokeWidth={1.8} />
                <span>DO NOT SIGN ANY MESSAGE.</span>
              </li>
              <li>
                <ShieldCheck size={15} strokeWidth={1.8} />
                <span>DO NOT APPROVE SPENDING OR TOKEN PERMISSIONS.</span>
              </li>
              <li>
                <AlertTriangle size={15} strokeWidth={1.8} />
                <span>DO NOT EXECUTE ANY TRANSACTION. IF YOUR WALLET ASKS, REJECT IT.</span>
              </li>
              <li>
                <Monitor size={15} strokeWidth={1.8} />
                <span>THIS GAME IS DESIGNED TO BE PLAYED ON DESKTOP.</span>
              </li>
            </ul>

            <button
              type="button"
              className="entry-gate__accept"
              onClick={onAccept}
            >
              <span>Accept and continue</span>
            </button>
          </>
        )}
      </motion.section>
    </main>
  )
}
