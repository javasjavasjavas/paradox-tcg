import { Brain, Shield, Sparkles, Sword } from 'lucide-react'
import type { StatKey } from '../game/gameTypes'

interface StatIconProps {
  stat: StatKey
  size?: number
}

export function StatIcon({ stat, size = 18 }: StatIconProps) {
  const icons = {
    attack: Sword,
    defense: Shield,
    wisdom: Brain,
    charisma: Sparkles,
  }
  const Icon = icons[stat]

  return <Icon size={size} strokeWidth={1.8} />
}
