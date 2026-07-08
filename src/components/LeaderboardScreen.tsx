import { useEffect, useState, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, AtSign, Swords, Zap } from 'lucide-react'
import remoteViewerFace from '../assets/portraits/remote-viewer-face.png'
import bgIntro from '../assets/ui/bg_intro.jpg'
import { listLeaderboardEntries } from '../supabase/leaderboard'
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
  xHandle: string | null
}

function formatScore(score: number) {
  return new Intl.NumberFormat('en-US').format(score)
}

export function LeaderboardScreen({ onBack, walletAddress }: LeaderboardScreenProps) {
  const [rows, setRows] = useState<LeaderboardEntry[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let isMounted = true
    const currentWalletAddress = walletAddress?.toLowerCase()

    void listLeaderboardEntries()
      .then((entries) => {
        if (!isMounted) return

        setRows(
          entries.map((entry, index) => ({
            position: index + 1,
            address: entry.wallet_address,
            xHandle: entry.x_handle,
            character: entry.character,
            score: entry.score,
            stage: entry.stage,
            avatar: entry.x_avatar_url || remoteViewerFace,
            isCurrent:
              Boolean(currentWalletAddress) &&
              entry.wallet_address.toLowerCase() === currentWalletAddress,
          })),
        )
        setStatus('ready')
      })
      .catch(() => {
        if (!isMounted) return

        setRows([])
        setStatus('error')
      })

    return () => {
      isMounted = false
    }
  }, [walletAddress])

  return (
    <main
      className="leaderboard-screen"
      style={{ '--intro-bg': `url(${bgIntro})` } as CSSProperties}
    >
      <header className="leaderboard-header">
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
          <span>FINAL SCORE</span>
          <span>STAGE</span>
        </div>

        {status === 'loading' ? (
          <div className="leaderboard-state">SYNCING SUPABASE RANKINGS...</div>
        ) : status === 'error' ? (
          <div className="leaderboard-state" data-error="true">
            LEADERBOARD SIGNAL LOST. CHECK SUPABASE CONFIGURATION.
          </div>
        ) : rows.length === 0 ? (
          <div className="leaderboard-state">NO SUBMITTED RUNS YET. CLAIM THE FIRST SIGNAL.</div>
        ) : (
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
                  <span>{entry.xHandle || 'WALLET ONLY'}</span>
                </div>

                <div className="leaderboard-row__metric">
                  <Swords size={15} strokeWidth={1.8} />
                  <span>{entry.character}</span>
                </div>

                <div
                  className="leaderboard-row__score"
                  aria-label={`FINAL SCORE ${formatScore(entry.score)}`}
                >
                  <span className="leaderboard-row__score-label">FINAL SCORE</span>
                  <span className="leaderboard-row__score-value">
                    <Zap size={15} strokeWidth={1.8} />
                    <strong>{formatScore(entry.score)}</strong>
                  </span>
                </div>

                <div className="leaderboard-row__stage">
                  <span>STAGE</span>
                  <strong>{entry.stage}</strong>
                </div>
              </motion.article>
            ))}
          </div>
        )}
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
