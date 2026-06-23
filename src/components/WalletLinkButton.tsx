import { Loader2, Wallet } from 'lucide-react'

interface WalletLinkButtonProps {
  className?: string
  disabled?: boolean
  isExpanded?: boolean
  isLoading?: boolean
  label: string
  onClick?: () => void
}

export function WalletLinkButton({
  className,
  disabled = false,
  isExpanded,
  isLoading = false,
  label,
  onClick,
}: WalletLinkButtonProps) {
  const classNames = ['intro-wallet', className].filter(Boolean).join(' ')

  return (
    <button
      type="button"
      className={classNames}
      aria-expanded={isExpanded}
      onClick={onClick}
      disabled={disabled}
    >
      {isLoading ? <Loader2 size={20} strokeWidth={1.8} /> : <Wallet size={20} strokeWidth={1.8} />}
      <span>{label}</span>
    </button>
  )
}
