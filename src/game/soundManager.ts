export type SoundCue =
  | 'welcome'
  | 'ui_hover'
  | 'ui_click'
  | 'card_hover'
  | 'card_select'
  | 'card_move'
  | 'stat_select'
  | 'battle_compare'
  | 'draw'
  | 'round_win'
  | 'round_lose'
  | 'win'
  | 'capture'
  | 'stage_one'
  | 'stage_two'
  | 'stage_three'
  | 'stage_four'
  | 'stage_five'
  | 'stage_six'
  | 'stage_clear'
  | 'turn_change'
  | 'victory'
  | 'defeat'
  | 'warning'

type BrowserWindow = Window & {
  webkitAudioContext?: typeof AudioContext
}

interface ToneOptions {
  attack?: number
  detune?: number
  duration: number
  endFrequency?: number
  frequency: number
  start?: number
  type?: OscillatorType
  volume?: number
}

interface NoiseOptions {
  attack?: number
  duration: number
  filterFrequency?: number
  filterType?: BiquadFilterType
  start?: number
  volume?: number
}

let audioContext: AudioContext | null = null
let masterGain: GainNode | null = null
let introMusic: HTMLAudioElement | null = null
let introMusicStartPending = false
let lastIntroMusicAttemptAt = 0
const lastPlayedAt = new Map<SoundCue, number>()
const introMusicDefaultVolume = 1
const introMusicPath = '/audio/paradox-lex-machina.mp3'
const volumeStorageKeys = {
  music: 'paradox-tcg.music-volume',
  sfx: 'paradox-tcg.sfx-volume',
  defaultsVersion: 'paradox-tcg.volume-defaults-version',
}
const volumeDefaultsVersion = 'max-volume-defaults-v2'

function clampVolume(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 1))
}

function readStoredVolume(key: string) {
  if (typeof window === 'undefined') return 1

  const stored = Number(window.localStorage.getItem(key))
  return Number.isFinite(stored) ? clampVolume(stored) : 1
}

function ensureMaxVolumeDefaults() {
  if (typeof window === 'undefined') return

  if (window.localStorage.getItem(volumeStorageKeys.defaultsVersion) === volumeDefaultsVersion) {
    return
  }

  window.localStorage.setItem(volumeStorageKeys.music, '1')
  window.localStorage.setItem(volumeStorageKeys.sfx, '1')
  window.localStorage.setItem(volumeStorageKeys.defaultsVersion, volumeDefaultsVersion)
}

ensureMaxVolumeDefaults()

let musicVolume = readStoredVolume(volumeStorageKeys.music)
let sfxVolume = readStoredVolume(volumeStorageKeys.sfx)

function getEffectiveIntroMusicVolume() {
  return introMusicDefaultVolume * musicVolume
}

function applyIntroMusicVolume() {
  if (!introMusic) return

  introMusic.volume = getEffectiveIntroMusicVolume()
}

function persistVolume(key: string, volume: number) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(key, String(volume))
}

function applySfxVolume() {
  if (masterGain) {
    masterGain.gain.value = 0.38 * sfxVolume
  }

  samplePools.forEach((pool, cue) => {
    const config = sampleConfigs[cue]
    if (!config) return

    pool.forEach((audio) => {
      audio.volume = config.volume * sfxVolume
    })
  })
}

const sampleConfigs: Partial<Record<SoundCue, { path: string; poolSize: number; volume: number }>> = {
  welcome: {
    path: '/audio/welcome.mp3',
    poolSize: 1,
    volume: 1,
  },
  card_hover: {
    path: '/audio/card1.mp3',
    poolSize: 4,
    volume: 0.42,
  },
  card_move: {
    path: '/audio/card2.mp3',
    poolSize: 4,
    volume: 0.58,
  },
  round_win: {
    path: '/audio/you-win.mp3',
    poolSize: 2,
    volume: 1,
  },
  round_lose: {
    path: '/audio/you-lose.mp3',
    poolSize: 2,
    volume: 0.96,
  },
  stage_one: {
    path: '/audio/stage-one.mp3',
    poolSize: 1,
    volume: 0.72,
  },
  stage_two: {
    path: '/audio/stage-two.mp3',
    poolSize: 1,
    volume: 0.72,
  },
  stage_three: {
    path: '/audio/stage-three.mp3',
    poolSize: 1,
    volume: 0.72,
  },
  stage_four: {
    path: '/audio/stage-four.mp3',
    poolSize: 1,
    volume: 0.72,
  },
  stage_five: {
    path: '/audio/stage-five.mp3',
    poolSize: 1,
    volume: 0.72,
  },
  stage_six: {
    path: '/audio/stage-six.mp3',
    poolSize: 1,
    volume: 0.72,
  },
  stage_clear: {
    path: '/audio/stage-clear.mp3',
    poolSize: 1,
    volume: 0.76,
  },
  draw: {
    path: '/audio/draw.mp3',
    poolSize: 2,
    volume: 0.92,
  },
  victory: {
    path: '/audio/Victory.mp3',
    poolSize: 1,
    volume: 1,
  },
  defeat: {
    path: '/audio/game-over.mp3',
    poolSize: 1,
    volume: 1,
  },
}
const sampleBuffers = new Map<SoundCue, AudioBuffer>()
const sampleBufferPromises = new Map<SoundCue, Promise<AudioBuffer | null>>()
const samplePools = new Map<SoundCue, HTMLAudioElement[]>()
const samplePoolIndexes = new Map<SoundCue, number>()

function createAudioContext() {
  if (typeof window === 'undefined') return null

  const AudioContextConstructor =
    window.AudioContext ?? (window as BrowserWindow).webkitAudioContext

  if (!AudioContextConstructor) return null

  audioContext = new AudioContextConstructor()
  masterGain = audioContext.createGain()
  masterGain.gain.value = 0.38 * sfxVolume

  const compressor = audioContext.createDynamicsCompressor()
  compressor.threshold.value = -18
  compressor.knee.value = 22
  compressor.ratio.value = 8
  compressor.attack.value = 0.004
  compressor.release.value = 0.18

  masterGain.connect(compressor)
  compressor.connect(audioContext.destination)

  return audioContext
}

function getAudioContext() {
  const context = audioContext ?? createAudioContext()

  if (context?.state === 'suspended') {
    void context.resume().catch(() => undefined)
  }

  return context
}

function connectToMaster(node: AudioNode) {
  if (!masterGain) return false

  node.connect(masterGain)
  return true
}

function playTone({
  attack = 0.006,
  detune = 0,
  duration,
  endFrequency,
  frequency,
  start = 0,
  type = 'sine',
  volume = 0.22,
}: ToneOptions) {
  const context = getAudioContext()
  if (!context) return

  const startAt = context.currentTime + start
  const stopAt = startAt + duration
  const oscillator = context.createOscillator()
  const gain = context.createGain()

  oscillator.type = type
  oscillator.detune.value = detune
  oscillator.frequency.setValueAtTime(frequency, startAt)
  if (endFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), stopAt)
  }

  gain.gain.setValueAtTime(0.0001, startAt)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), startAt + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, stopAt)

  oscillator.connect(gain)
  if (!connectToMaster(gain)) return

  oscillator.start(startAt)
  oscillator.stop(stopAt + 0.04)
}

function playNoise({
  attack = 0.003,
  duration,
  filterFrequency = 900,
  filterType = 'bandpass',
  start = 0,
  volume = 0.16,
}: NoiseOptions) {
  const context = getAudioContext()
  if (!context) return

  const frameCount = Math.max(1, Math.floor(context.sampleRate * duration))
  const buffer = context.createBuffer(1, frameCount, context.sampleRate)
  const channel = buffer.getChannelData(0)

  for (let index = 0; index < frameCount; index += 1) {
    const fade = 1 - index / frameCount
    channel[index] = (Math.random() * 2 - 1) * fade
  }

  const startAt = context.currentTime + start
  const stopAt = startAt + duration
  const source = context.createBufferSource()
  const filter = context.createBiquadFilter()
  const gain = context.createGain()

  source.buffer = buffer
  filter.type = filterType
  filter.frequency.setValueAtTime(filterFrequency, startAt)
  filter.Q.value = 2.4

  gain.gain.setValueAtTime(0.0001, startAt)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, volume), startAt + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, stopAt)

  source.connect(filter)
  filter.connect(gain)
  if (!connectToMaster(gain)) return

  source.start(startAt)
  source.stop(stopAt + 0.04)
}

function playChord(frequencies: number[], start: number, duration: number, volume: number) {
  frequencies.forEach((frequency, index) => {
    playTone({
      duration,
      frequency,
      start: start + index * 0.018,
      type: 'triangle',
      volume: volume / frequencies.length,
    })
  })
}

function getIntroMusic() {
  if (typeof window === 'undefined') return null

  if (!introMusic) {
    introMusic = new Audio(introMusicPath)
    introMusic.loop = true
    introMusic.preload = 'auto'
    applyIntroMusicVolume()
  }

  return introMusic
}

function loadSampleBuffer(cue: SoundCue) {
  const config = sampleConfigs[cue]
  const context = getAudioContext()

  if (!config || !context || typeof fetch === 'undefined') return Promise.resolve(null)

  const existingBuffer = sampleBuffers.get(cue)
  if (existingBuffer) return Promise.resolve(existingBuffer)

  const existingPromise = sampleBufferPromises.get(cue)
  if (existingPromise) return existingPromise

  const bufferPromise = fetch(config.path)
    .then((response) => {
      if (!response.ok) throw new Error(`Unable to load sound sample: ${config.path}`)
      return response.arrayBuffer()
    })
    .then((arrayBuffer) => context.decodeAudioData(arrayBuffer.slice(0)))
    .then((buffer) => {
      sampleBuffers.set(cue, buffer)
      return buffer
    })
    .catch(() => null)

  sampleBufferPromises.set(cue, bufferPromise)
  return bufferPromise
}

function preloadConfiguredSamples() {
  ;(Object.keys(sampleConfigs) as SoundCue[]).forEach((cue) => {
    void loadSampleBuffer(cue)
  })
}

function getSamplePool(cue: SoundCue) {
  if (typeof window === 'undefined') return null

  const config = sampleConfigs[cue]
  if (!config) return null

  const existingPool = samplePools.get(cue)
  if (existingPool) return existingPool

  const pool = Array.from({ length: config.poolSize }, () => {
    const audio = new Audio(config.path)
    audio.preload = 'auto'
    audio.volume = config.volume * sfxVolume
    return audio
  })

  samplePools.set(cue, pool)
  samplePoolIndexes.set(cue, 0)

  return pool
}

function playSampleBuffer(cue: SoundCue, buffer: AudioBuffer) {
  const context = getAudioContext()
  const config = sampleConfigs[cue]

  if (!context || !config) return false

  const source = context.createBufferSource()
  const gain = context.createGain()

  source.buffer = buffer
  gain.gain.setValueAtTime(config.volume * sfxVolume, context.currentTime)

  source.connect(gain)
  gain.connect(context.destination)
  source.start(context.currentTime)

  return true
}

function playHtmlSample(cue: SoundCue) {
  const pool = getSamplePool(cue)
  if (!pool?.length) return false

  const poolIndex = samplePoolIndexes.get(cue) ?? 0
  const sample = pool.find((audio) => audio.paused) ?? pool[poolIndex]
  samplePoolIndexes.set(cue, (poolIndex + 1) % pool.length)

  sample.pause()
  sample.currentTime = 0
  void sample.play().catch(() => undefined)

  return true
}

function playSample(cue: SoundCue) {
  const config = sampleConfigs[cue]
  if (!config) return false

  const existingBuffer = sampleBuffers.get(cue)
  if (existingBuffer) return playSampleBuffer(cue, existingBuffer)

  void loadSampleBuffer(cue).then((buffer) => {
    if (buffer) {
      playSampleBuffer(cue, buffer)
      return
    }

    playHtmlSample(cue)
  })

  return true
}

const cueCooldowns: Partial<Record<SoundCue, number>> = {
  welcome: 900,
  ui_hover: 42,
  ui_click: 38,
  card_hover: 130,
  card_select: 36,
  draw: 180,
  round_win: 180,
  round_lose: 180,
  stage_one: 600,
  stage_two: 600,
  stage_three: 600,
  stage_four: 600,
  stage_five: 600,
  stage_six: 600,
  stage_clear: 600,
  victory: 900,
  defeat: 900,
  stat_select: 44,
  turn_change: 70,
  warning: 120,
}

function shouldPlay(cue: SoundCue) {
  const cooldown = cueCooldowns[cue] ?? 0
  const now = performance.now()
  const last = lastPlayedAt.get(cue) ?? 0

  if (now - last < cooldown) return false

  lastPlayedAt.set(cue, now)
  return true
}

function playCue(cue: SoundCue) {
  if (playSample(cue)) return

  switch (cue) {
    case 'welcome':
      playChord([261.63, 329.63, 392], 0, 0.24, 0.18)
      playChord([392, 523.25, 659.25], 0.16, 0.32, 0.2)
      playNoise({ duration: 0.18, filterFrequency: 3600, start: 0.08, volume: 0.045 })
      break

    case 'ui_hover':
      playTone({ duration: 0.045, endFrequency: 860, frequency: 620, type: 'sine', volume: 0.045 })
      playTone({ duration: 0.035, frequency: 1240, start: 0.018, type: 'triangle', volume: 0.026 })
      break

    case 'ui_click':
      playTone({ duration: 0.05, endFrequency: 410, frequency: 760, type: 'triangle', volume: 0.105 })
      playNoise({ duration: 0.035, filterFrequency: 2100, filterType: 'bandpass', volume: 0.04 })
      break

    case 'card_hover':
      playNoise({ duration: 0.14, filterFrequency: 1700, filterType: 'highpass', volume: 0.085 })
      playTone({ duration: 0.12, endFrequency: 520, frequency: 290, start: 0.015, type: 'triangle', volume: 0.045 })
      break

    case 'card_select':
      playTone({ duration: 0.055, endFrequency: 620, frequency: 360, type: 'triangle', volume: 0.18 })
      playNoise({ duration: 0.045, filterFrequency: 1400, volume: 0.045 })
      break

    case 'card_move':
      playNoise({ duration: 0.16, filterFrequency: 720, filterType: 'highpass', volume: 0.12 })
      playTone({ duration: 0.12, endFrequency: 320, frequency: 150, start: 0.02, type: 'sine', volume: 0.08 })
      break

    case 'stat_select':
      playTone({ duration: 0.07, frequency: 620, type: 'square', volume: 0.07 })
      playTone({ duration: 0.075, frequency: 930, start: 0.038, type: 'triangle', volume: 0.11 })
      playTone({ duration: 0.09, frequency: 1240, start: 0.074, type: 'sine', volume: 0.08 })
      break

    case 'battle_compare':
      playNoise({ duration: 0.12, filterFrequency: 280, filterType: 'lowpass', volume: 0.22 })
      playTone({ duration: 0.28, endFrequency: 74, frequency: 150, type: 'sawtooth', volume: 0.12 })
      playTone({ duration: 0.18, frequency: 720, start: 0.04, type: 'square', volume: 0.05 })
      playTone({ duration: 0.2, frequency: 965, start: 0.052, type: 'triangle', volume: 0.045 })
      break

    case 'draw':
      playTone({ duration: 0.11, frequency: 360, type: 'triangle', volume: 0.1 })
      playTone({ duration: 0.11, frequency: 360, start: 0.09, type: 'triangle', volume: 0.1 })
      playNoise({ duration: 0.12, filterFrequency: 1900, filterType: 'bandpass', start: 0.04, volume: 0.045 })
      break

    case 'win':
      playTone({ duration: 0.13, frequency: 392, type: 'triangle', volume: 0.12 })
      playTone({ duration: 0.16, frequency: 523.25, start: 0.06, type: 'triangle', volume: 0.14 })
      playTone({ duration: 0.24, frequency: 783.99, start: 0.13, type: 'sine', volume: 0.11 })
      playNoise({ duration: 0.18, filterFrequency: 3200, start: 0.08, volume: 0.055 })
      break

    case 'capture':
      playTone({ duration: 0.18, endFrequency: 120, frequency: 260, type: 'sawtooth', volume: 0.13 })
      playNoise({ duration: 0.11, filterFrequency: 520, filterType: 'bandpass', start: 0.035, volume: 0.11 })
      break

    case 'turn_change':
      playTone({ duration: 0.09, frequency: 330, type: 'triangle', volume: 0.09 })
      playTone({ duration: 0.1, frequency: 495, start: 0.055, type: 'triangle', volume: 0.1 })
      break

    case 'victory':
      playChord([329.63, 415.3, 493.88], 0, 0.34, 0.22)
      playChord([493.88, 659.25, 830.61], 0.2, 0.42, 0.24)
      playNoise({ duration: 0.32, filterFrequency: 4300, start: 0.16, volume: 0.07 })
      break

    case 'defeat':
      playTone({ duration: 0.2, endFrequency: 210, frequency: 320, type: 'triangle', volume: 0.12 })
      playTone({ duration: 0.24, endFrequency: 118, frequency: 230, start: 0.14, type: 'sawtooth', volume: 0.1 })
      playNoise({ duration: 0.16, filterFrequency: 360, filterType: 'lowpass', start: 0.18, volume: 0.1 })
      break

    case 'warning':
      playTone({ duration: 0.09, frequency: 170, type: 'square', volume: 0.075 })
      playTone({ duration: 0.09, frequency: 184, type: 'square', volume: 0.055 })
      playNoise({ duration: 0.08, filterFrequency: 1200, start: 0.015, volume: 0.045 })
      break
  }
}

export const soundManager = {
  getMusicVolume() {
    return musicVolume
  },

  getSfxVolume() {
    return sfxVolume
  },

  setMusicVolume(volume: number) {
    musicVolume = clampVolume(volume)
    persistVolume(volumeStorageKeys.music, musicVolume)
    applyIntroMusicVolume()
  },

  setSfxVolume(volume: number) {
    sfxVolume = clampVolume(volume)
    persistVolume(volumeStorageKeys.sfx, sfxVolume)
    applySfxVolume()
  },

  play(cue: SoundCue) {
    if (!shouldPlay(cue)) return

    try {
      preloadConfiguredSamples()
      playCue(cue)
    } catch {
      // Audio should never block the game loop.
    }
  },

  playWelcome() {
    this.play('welcome')
  },

  playStageIntro(stageNumber: number) {
    const stageIntroCues: Partial<Record<number, SoundCue>> = {
      1: 'stage_one',
      2: 'stage_two',
      3: 'stage_three',
      4: 'stage_four',
      5: 'stage_five',
      6: 'stage_six',
    }
    const cue = stageIntroCues[stageNumber]

    if (cue) {
      this.play(cue)
    }
  },

  async startIntroMusic() {
    const music = getIntroMusic()
    if (!music || !music.paused) return true

    const now = performance.now()
    if (introMusicStartPending || now - lastIntroMusicAttemptAt < 450) return false

    lastIntroMusicAttemptAt = now
    introMusicStartPending = true

    try {
      await music.play()
      preloadConfiguredSamples()
      introMusicStartPending = false
      return true
    } catch {
      introMusicStartPending = false
      return false
    }
  },

  stopIntroMusic() {
    if (!introMusic || introMusic.paused) return

    introMusic.pause()
  },
}
