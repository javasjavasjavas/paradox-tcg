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

export async function signInWithX() {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const redirectTo = `${window.location.origin}${window.location.pathname}`
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'x',
    options: {
      redirectTo,
    },
  })

  if (error) throw error
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
