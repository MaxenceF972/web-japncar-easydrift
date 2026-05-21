import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServiceClient() as any
  const { data } = await supabase
    .from('lap_times')
    .select('*')
    .order('time_ms', { ascending: true })

  const bestTimes: Record<string, any> = {}
  for (const lap of data || []) {
    const key = lap.participant_name.trim().toLowerCase()
    if (!bestTimes[key] || lap.time_ms < bestTimes[key].time_ms) {
      bestTimes[key] = lap
    }
  }

  const leaderboard = Object.values(bestTimes).sort((a: any, b: any) => a.time_ms - b.time_ms)
  return NextResponse.json({ leaderboard })
}
