import type { Session } from '@supabase/supabase-js'
import { supabase } from './client'

export type LeaderboardRunResult = 'victory' | 'game_over'

export interface LeaderboardEntryRecord {
  character: string
  completed_at: string
  defeated_count: number
  run_result: LeaderboardRunResult
  score: number
  stage: number
  user_id: string
  wallet_address: string
  x_avatar_url: string | null
  x_handle: string
  x_name: string | null
}

export interface PendingLeaderboardRun {
  avatarUrl?: string | null
  character: string
  defeatedCount: number
  runResult: LeaderboardRunResult
  score: number
  stage: number
  walletAddress: string
}

const pendingRunStorageKey = 'paradox-tcg.pending-leaderboard-run'
const xAuthPopupParam = 'x-auth-popup'
const xAuthPopupWindowName = 'paradox-tcg-x-auth'
const xAuthPopupCompleteMessage = 'paradox-tcg:x-auth-complete'
const xAuthPopupErrorMessage = 'paradox-tcg:x-auth-error'

type XAuthPopupMessage =
  | {
      type: typeof xAuthPopupCompleteMessage
    }
  | {
      message: string
      type: typeof xAuthPopupErrorMessage
    }

export function getXHandleFromSession(session: Session | null) {
  const metadata = session?.user.user_metadata
  const handle =
    metadata?.user_name ?? metadata?.preferred_username ?? metadata?.nickname ?? metadata?.name

  if (typeof handle !== 'string' || !handle.trim()) return null

  return handle.startsWith('@') ? handle : `@${handle}`
}

export function readPendingLeaderboardRun() {
  try {
    const stored = window.localStorage.getItem(pendingRunStorageKey)
    if (!stored) return null

    const parsed = JSON.parse(stored) as Partial<PendingLeaderboardRun>
    if (
      typeof parsed.walletAddress !== 'string' ||
      typeof parsed.score !== 'number' ||
      typeof parsed.stage !== 'number' ||
      typeof parsed.defeatedCount !== 'number' ||
      typeof parsed.character !== 'string' ||
      (parsed.runResult !== 'victory' && parsed.runResult !== 'game_over')
    ) {
      return null
    }

    return {
      avatarUrl: typeof parsed.avatarUrl === 'string' ? parsed.avatarUrl : null,
      character: parsed.character,
      defeatedCount: parsed.defeatedCount,
      runResult: parsed.runResult,
      score: parsed.score,
      stage: parsed.stage,
      walletAddress: parsed.walletAddress,
    }
  } catch {
    return null
  }
}

export function writePendingLeaderboardRun(run: PendingLeaderboardRun) {
  window.localStorage.setItem(pendingRunStorageKey, JSON.stringify(run))
}

export function clearPendingLeaderboardRun() {
  window.localStorage.removeItem(pendingRunStorageKey)
}

function isXAuthPopupCallback() {
  return (
    window.name === xAuthPopupWindowName ||
    new URLSearchParams(window.location.search).get(xAuthPopupParam) === '1'
  )
}

function getPopupAuthError() {
  const searchParams = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const description =
    searchParams.get('error_description') ??
    hashParams.get('error_description') ??
    searchParams.get('error') ??
    hashParams.get('error')

  return description?.replace(/\+/g, ' ') ?? null
}

function openCenteredPopup(url: string) {
  const width = 520
  const height = 720
  const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2)
  const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2)
  const features = [
    'popup=yes',
    'resizable=yes',
    'scrollbars=yes',
    `width=${width}`,
    `height=${height}`,
    `left=${Math.round(left)}`,
    `top=${Math.round(top)}`,
  ].join(',')

  return window.open(url, xAuthPopupWindowName, features)
}

function renderPopupLoadingState(popup: Window) {
  try {
    popup.document.title = 'Connecting X'
    popup.document.body.innerHTML =
      '<main style="display:grid;min-height:100vh;place-items:center;margin:0;background:#030711;color:#ffe9f7;font-family:monospace;letter-spacing:.18em;text-align:center;text-transform:uppercase">Opening X...</main>'
  } catch {
    // Some browsers restrict writing to the popup immediately. The auth redirect still works.
  }
}

function waitForXAuthPopup(popup: Window) {
  if (!supabase) {
    return Promise.reject(new Error('Supabase is not configured.'))
  }

  const supabaseClient = supabase

  return new Promise<Session>((resolve, reject) => {
    let settled = false
    let intervalId = 0
    let timeoutId = 0

    const cleanup = () => {
      window.removeEventListener('message', handleMessage)
      window.clearInterval(intervalId)
      window.clearTimeout(timeoutId)
    }

    const settle = (session: Session) => {
      if (settled) return

      settled = true
      cleanup()
      resolve(session)
    }

    const fail = (error: Error) => {
      if (settled) return

      settled = true
      cleanup()
      reject(error)
    }

    const checkSession = () => {
      void supabaseClient.auth.getSession().then(({ data, error }) => {
        if (settled) return

        if (error) {
          fail(error)
          return
        }

        if (data.session) {
          settle(data.session)
          return
        }

        if (popup.closed) {
          fail(new Error('X SIGN-IN POPUP CLOSED BEFORE THE ACCOUNT WAS CONNECTED.'))
        }
      })
    }

    function handleMessage(event: MessageEvent<XAuthPopupMessage>) {
      if (event.origin !== window.location.origin) return

      if (event.data?.type === xAuthPopupCompleteMessage) {
        checkSession()
        return
      }

      if (event.data?.type === xAuthPopupErrorMessage) {
        fail(new Error(event.data.message))
      }
    }

    window.addEventListener('message', handleMessage)
    intervalId = window.setInterval(checkSession, 500)
    timeoutId = window.setTimeout(
      () => fail(new Error('X SIGN-IN TIMED OUT. TRY CONNECTING AGAIN.')),
      120000,
    )
    checkSession()
  })
}

export function notifyXAuthPopupCallback(session: Session | null) {
  if (!isXAuthPopupCallback() || !window.opener) return false

  const authError = getPopupAuthError()
  const message: XAuthPopupMessage | null = session
    ? { type: xAuthPopupCompleteMessage }
    : authError
      ? { message: authError, type: xAuthPopupErrorMessage }
      : null

  if (!message) return false

  window.opener.postMessage(message, window.location.origin)
  window.setTimeout(() => window.close(), 160)

  return true
}

export async function signInWithXPopup() {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const popup = openCenteredPopup('about:blank')
  if (!popup) {
    throw new Error('X SIGN-IN POPUP WAS BLOCKED. ALLOW POPUPS FOR THIS SITE AND TRY AGAIN.')
  }

  renderPopupLoadingState(popup)

  const redirectTo = `${window.location.origin}${window.location.pathname}`
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'x',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  })

  if (error) {
    popup.close()
    throw error
  }

  if (!data.url) {
    popup.close()
    throw new Error('X AUTHORIZATION URL WAS NOT RETURNED BY SUPABASE.')
  }

  popup.location.href = data.url

  return waitForXAuthPopup(popup)
}

export async function submitLeaderboardRun(run: PendingLeaderboardRun) {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase.rpc('submit_leaderboard_run', {
    p_avatar_url: run.avatarUrl ?? null,
    p_character: run.character,
    p_defeated_count: run.defeatedCount,
    p_run_result: run.runResult,
    p_score: run.score,
    p_stage: run.stage,
    p_wallet_address: run.walletAddress,
  })

  if (error) throw error

  return data as LeaderboardEntryRecord
}

export async function listLeaderboardEntries(limit = 50) {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('leaderboard_entries')
    .select(
      'user_id,wallet_address,x_handle,x_name,x_avatar_url,character,score,stage,defeated_count,run_result,completed_at',
    )
    .order('score', { ascending: false })
    .order('stage', { ascending: false })
    .order('defeated_count', { ascending: false })
    .order('completed_at', { ascending: true })
    .limit(limit)

  if (error) throw error

  return data as LeaderboardEntryRecord[]
}
