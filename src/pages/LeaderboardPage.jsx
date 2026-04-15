import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { formatUnits } from '../lib/units'
import { startOfWeek, startOfMonth, startOfYear } from 'date-fns'

const PERIODS = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
]

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [period, setPeriod] = useState('week')
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard(period)
  }, [period])

  async function loadLeaderboard(p) {
    setLoading(true)
    try {
      const now = new Date()
      let startDate

      if (p === 'week') startDate = startOfWeek(now, { weekStartsOn: 1 })
      else if (p === 'month') startDate = startOfMonth(now)
      else startDate = startOfYear(now)

      // Fetch aggregated beer logs with user profile info
      const { data, error } = await supabase
        .from('beer_logs')
        .select(`
          user_id,
          volume_ml,
          units,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .gte('logged_at', startDate.toISOString())
        .lte('logged_at', now.toISOString())

      if (error) throw error

      // Aggregate by user
      const userMap = {}
      for (const row of data || []) {
        if (!row.profiles) continue
        const uid = row.user_id
        if (!userMap[uid]) {
          userMap[uid] = {
            userId: uid,
            name: row.profiles.full_name || 'Unknown',
            avatar: row.profiles.avatar_url,
            beers: 0,
            totalMl: 0,
            totalUnits: 0,
          }
        }
        userMap[uid].beers += 1
        userMap[uid].totalMl += row.volume_ml
        userMap[uid].totalUnits += row.units
      }

      // Sort by beers desc
      const sorted = Object.values(userMap).sort((a, b) => b.beers - a.beers)
      setEntries(sorted)
    } catch (err) {
      console.error('Leaderboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  const rankEmoji = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  return (
    <div className="py-4 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-stone-100">Leaderboard</h2>
        <p className="text-stone-500 text-sm">Who's been at it the hardest?</p>
      </div>

      {/* Period Toggle */}
      <div className="flex bg-stone-900 rounded-xl p-1 gap-1">
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors touch-manipulation ${
              period === p.key
                ? 'bg-amber-500 text-stone-950'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="card">
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 bg-stone-800 rounded-full" />
                <div className="w-10 h-10 bg-stone-800 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-stone-800 rounded w-24" />
                  <div className="h-2.5 bg-stone-800 rounded w-16" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-3 bg-stone-800 rounded w-8" />
                  <div className="h-2.5 bg-stone-800 rounded w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : entries.length === 0 ? (
        <div className="card text-center py-8 text-stone-500">
          <div className="text-4xl mb-2">🍺</div>
          <p className="text-sm">No drinks logged this {period} yet.</p>
          <p className="text-xs mt-1">Be the first on the board!</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[2rem_3rem_1fr_3rem_4rem_4rem] gap-x-2 px-4 py-2 border-b border-stone-800 text-stone-500 text-xs font-medium uppercase tracking-wider">
            <span></span>
            <span></span>
            <span>Name</span>
            <span className="text-right">🍺</span>
            <span className="text-right">ml</span>
            <span className="text-right">Units</span>
          </div>

          <div className="divide-y divide-stone-800/50">
            {entries.map((entry, idx) => {
              const rank = idx + 1
              const isMe = entry.userId === user?.id

              return (
                <div
                  key={entry.userId}
                  className={`grid grid-cols-[2rem_3rem_1fr_3rem_4rem_4rem] gap-x-2 items-center px-4 py-3 ${
                    isMe ? 'bg-amber-500/10' : rank === 1 ? 'bg-stone-800/30' : ''
                  }`}
                >
                  {/* Rank */}
                  <span className={`text-center font-bold ${
                    rank === 1 ? 'text-xl' : rank === 2 ? 'text-lg' : rank === 3 ? 'text-base' : 'text-xs text-stone-500'
                  }`}>
                    {rankEmoji(rank)}
                  </span>

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-stone-800 border border-stone-700">
                    {entry.avatar ? (
                      <img src={entry.avatar} alt={entry.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-500 text-sm font-bold">
                        {entry.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <div className="min-w-0">
                    <div className={`font-semibold text-sm truncate ${isMe ? 'text-amber-400' : 'text-stone-200'}`}>
                      {entry.name}{isMe ? ' (you)' : ''}
                    </div>
                    {rank === 1 && (
                      <div className="text-stone-500 text-xs">Top drinker 🏆</div>
                    )}
                  </div>

                  {/* Beers */}
                  <div className={`text-right font-bold text-sm ${isMe ? 'text-amber-400' : 'text-stone-200'}`}>
                    {entry.beers}
                  </div>

                  {/* Volume */}
                  <div className="text-right text-stone-400 text-xs">
                    {entry.totalMl >= 1000
                      ? `${(entry.totalMl / 1000).toFixed(1)}L`
                      : `${entry.totalMl}ml`
                    }
                  </div>

                  {/* Units */}
                  <div className={`text-right text-sm font-medium ${
                    entry.totalUnits > 17 ? 'text-red-400' :
                    entry.totalUnits > 11 ? 'text-amber-400' : 'text-stone-400'
                  }`}>
                    {formatUnits(entry.totalUnits)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Units legend */}
      <div className="card bg-stone-900/50 text-xs text-stone-500 space-y-1">
        <div className="text-stone-400 font-medium text-xs uppercase tracking-wider mb-1">Units Guide (Irish HSE)</div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Men: 17 units/week recommended limit</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Women: 11 units/week recommended limit</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <span>Red = over male guideline</span>
        </div>
      </div>
    </div>
  )
}
