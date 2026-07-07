export const SCORE_RULES = {
  cardLostPenalty: 75,
  minimumStageClearScore: 100,
  stageCompletionPoints: 500,
  threeRoundWinBonus: 250,
}

interface StageScoreInput {
  cardsLost: number
  stageNumber: number
  threeRoundWinBonusCount: number
}

export function calculateCompletedStageScore({
  cardsLost,
  stageNumber,
  threeRoundWinBonusCount,
}: StageScoreInput) {
  const stageScore = Math.max(1, stageNumber) * SCORE_RULES.stageCompletionPoints
  const lostCardPenalty = Math.max(0, cardsLost) * SCORE_RULES.cardLostPenalty
  const streakBonus =
    Math.max(0, threeRoundWinBonusCount) * SCORE_RULES.threeRoundWinBonus

  return Math.max(
    SCORE_RULES.minimumStageClearScore,
    stageScore + streakBonus - lostCardPenalty,
  )
}
