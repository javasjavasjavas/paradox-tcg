export interface StageData {
  id: string
  number: number
  opponentName: string
  opponentLore: string
}

export const stages: StageData[] = [
  {
    id: 'stage-1',
    number: 1,
    opponentName: 'Remote Viewer',
    opponentLore:
      'Her mind travels beyond walls and distance, watching hidden truths no screen was meant to reveal.',
  },
]
