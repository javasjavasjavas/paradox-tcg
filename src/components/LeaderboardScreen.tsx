import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, AtSign, Swords, Zap } from 'lucide-react'
import opponentFace from '../assets/portraits/opponent-face.png'
import playerFace from '../assets/portraits/player-face.png'
import remoteViewerFace from '../assets/portraits/remote-viewer-face.png'
import bgIntro from '../assets/ui/bg_intro.jpg'
import { formatAddress } from '../wallet/useWalletCollection'

interface LeaderboardScreenProps {
  onBack: () => void
  walletAddress?: string | null
}

interface LeaderboardEntry {
  address: string
  avatar: string
  character: string
  isCurrent?: boolean
  position: number
  score: number
  stage: number
  xHandle: string
}

const leaderboardEntries: LeaderboardEntry[] = [
  {
    position: 1,
    address: '0x8F21A9B0E1A14517CC91B20675B88C5A8F7D6011',
    xHandle: '@NEON_ORACLE',
    character: 'REMOTE VIEWER',
    score: 98240,
    stage: 9,
    avatar: remoteViewerFace,
  },
  {
    position: 2,
    address: '0x4B77E3C9A04277D45C0B80611F5A68D9B92013D4',
    xHandle: '@VOID_PILOT',
    character: 'THE EXECUTOR',
    score: 91480,
    stage: 8,
    avatar: opponentFace,
  },
  {
    position: 3,
    address: '0xA91C0669B8B11D91F83BD0A4D720D0901BA7CA0F',
    xHandle: '@ARC_LIGHT',
    character: 'GIFTED',
    score: 88710,
    stage: 8,
    avatar: playerFace,
  },
  {
    position: 4,
    address: '0x725B955A37F780786A2193D78487772A9C3F08E4',
    xHandle: '@BLACK_SIGNAL',
    character: 'MECHANIC LIZARD',
    score: 84290,
    stage: 7,
    avatar: opponentFace,
  },
  {
    position: 5,
    address: '0xF42E9B2B1E95B69725F76A4D1627B8A77F401A69',
    xHandle: '@STATIC_MIND',
    character: 'LIL TIMMY',
    score: 80150,
    stage: 7,
    avatar: remoteViewerFace,
  },
]

function formatScore(score: number) {
  return new Intl.NumberFormat('en-US').format(score)
}

export function LeaderboardScreen({ onBack, walletAddress }: LeaderboardScreenProps) {
  const currentWalletEntry: LeaderboardEntry | null = walletAddress
    ? {
        position: 18,
        address: walletAddress,
        xHandle: '@X_LINK_PENDING',
        character: 'REMOTE VIEWER',
        score: 12600,
        stage: 1,
        avatar: remoteViewerFace,
        isCurrent: true,
      }
    : null
  const rows = currentWalletEntry ? [...leaderboardEntries, currentWalletEntry] : leaderboardEntries

  return (
    <main
      className="leaderboard-screen"
      style={{ '--intro-bg': `url(${bgIntro})` } as CSSProperties}
    >
      <header className="leaderboard-header">
        <span>SEASON RANKINGS</span>
        <h1>LEADERBOARD</h1>
        <p>TOP WALLETS, FINAL SCORES, ACTIVE CHARACTERS, AND HIGHEST STAGE REACHED.</p>
      </header>

      <section className="leaderboard-panel" aria-label="LEADERBOARD">
        <div className="leaderboard-grid-header" aria-hidden="true">
          <span>POS</span>
          <span>AVATAR</span>
          <span>WALLET ADDRESS</span>
          <span>X HANDLE</span>
          <span>CHARACTER</span>
          <span>SCORE FINAL</span>
          <span>STAGE</span>
        </div>

        <div className="leaderboard-rows">
          {rows.map((entry, index) => (
            <motion.article
              className="leaderboard-row"
              data-current={entry.isCurrent}
              key={`${entry.position}-${entry.address}`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, ease: 'easeOut', delay: index * 0.035 }}
            >
              <div className="leaderboard-row__rank">
                <strong>#{entry.position}</strong>
              </div>

              <img className="leaderboard-row__avatar" src={entry.avatar} alt="" />

              <div className="leaderboard-row__identity">
                <span>{entry.isCurrent ? 'YOUR WALLET' : 'WALLET ADDRESS'}</span>
                <strong>{formatAddress(entry.address)}</strong>
              </div>

              <div className="leaderboard-row__metric">
                <AtSign size={15} strokeWidth={1.8} />
                <span>{entry.xHandle}</span>
              </div>

              <div className="leaderboard-row__metric">
                <Swords size={15} strokeWidth={1.8} />
                <span>{entry.character}</span>
              </div>

              <div className="leaderboard-row__score">
                <Zap size={15} strokeWidth={1.8} />
                <strong>{formatScore(entry.score)}</strong>
              </div>

              <div className="leaderboard-row__stage">
                <span>STAGE</span>
                <strong>{entry.stage}</strong>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <footer className="leaderboard-footer">
        <button type="button" className="leaderboard-back" onClick={onBack}>
          <ArrowLeft size={18} strokeWidth={1.8} />
          <span>GO BACK</span>
        </button>
      </footer>
    </main>
  )
}
