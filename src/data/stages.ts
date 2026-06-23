import rawOpponents from './opponents.json'
import remoteViewerPortraitUrl from '../assets/portraits/remote-viewer-face.png'
import mindReaderPortraitUrl from '../assets/portraits/mind-reader-face.png'
import lilJennyPortraitUrl from '../assets/portraits/lil-jenny-face.png'
import theDoctorPortraitUrl from '../assets/portraits/the-doctor-face.png'
import theGamblerPortraitUrl from '../assets/portraits/the-gambler-face.png'
import theMimePortraitUrl from '../assets/portraits/the-mime-face.png'
import stageOneBackgroundUrl from '../assets/ui/stage-1-bg.png'
import stageTwoBackgroundUrl from '../assets/ui/stage-2-bg.jpg'
import stageThreeBackgroundUrl from '../assets/ui/stage-3-bg.jpg'
import stageFourBackgroundUrl from '../assets/ui/stage-4-bg.jpg'
import stageFiveBackgroundUrl from '../assets/ui/stage-5-bg.jpg'
import stageSixBackgroundUrl from '../assets/ui/stage-6-bg.jpg'

const stageBackgrounds = {
  'stage-1-bg': stageOneBackgroundUrl,
  'stage-2-bg': stageTwoBackgroundUrl,
  'stage-3-bg': stageThreeBackgroundUrl,
  'stage-4-bg': stageFourBackgroundUrl,
  'stage-5-bg': stageFiveBackgroundUrl,
  'stage-6-bg': stageSixBackgroundUrl,
} as const

const stagePortraits = {
  'remote-viewer-face': remoteViewerPortraitUrl,
  'mind-reader-face': mindReaderPortraitUrl,
  'lil-jenny-face': lilJennyPortraitUrl,
  'the-doctor-face': theDoctorPortraitUrl,
  'the-gambler-face': theGamblerPortraitUrl,
  'the-mime-face': theMimePortraitUrl,
} as const

export interface OpponentRarityMix {
  common: number
  rare: number
  epic: number
  legendary: number
}

export interface OpponentDifficulty {
  score: number
  bestStatChance: number
  secondBestStatChance: number
  lowerStatChance: number
}

export interface StageData {
  id: string
  name: string
  stage: number
  lore: string
  backgroundUrl: string
  portraitUrl: string
  deckRarityMix: OpponentRarityMix
  difficulty: OpponentDifficulty
}

type StageBackgroundKey = keyof typeof stageBackgrounds
type StagePortraitKey = keyof typeof stagePortraits

interface RawStageData extends Omit<StageData, 'backgroundUrl' | 'portraitUrl'> {
  backgroundAsset: StageBackgroundKey
  portraitAsset: StagePortraitKey
}

export const stages = (rawOpponents as RawStageData[]).map((stage) => ({
  ...stage,
  backgroundUrl: stageBackgrounds[stage.backgroundAsset] ?? stageOneBackgroundUrl,
  portraitUrl: stagePortraits[stage.portraitAsset] ?? remoteViewerPortraitUrl,
}))

export function getStageById(stageId: string | undefined) {
  return stages.find((stage) => stage.id === stageId) ?? stages[0]
}
