import { supabase } from './client'

export type LeaderboardRunResult = 'victory' | 'game_over'

export interface LeaderboardEntryRecord {
  character: string
  completed_at: string
  defeated_count: number
  run_result: LeaderboardRunResult
  score: number
  stage: number
  user_id: string | null
  wallet_address: string
  x_avatar_url: string | null
  x_handle: string | null
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

function normalizeXHandle(xHandle?: string | null) {
  const cleanHandle = xHandle?.trim().replace(/^@+/, '')
  if (!cleanHandle) return null

  return `@${cleanHandle}`
}

export async function submitLeaderboardRun(run: PendingLeaderboardRun, xHandle?: string | null) {
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
    p_x_handle: normalizeXHandle(xHandle),
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
