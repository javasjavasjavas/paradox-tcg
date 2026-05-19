interface GlitchTextProps {
  children: string
  active?: boolean
}

export function GlitchText({ children, active = false }: GlitchTextProps) {
  return (
    <span className="glitch-text" data-active={active} data-text={children}>
      {children}
    </span>
  )
}
