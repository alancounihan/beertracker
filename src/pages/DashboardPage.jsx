import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { format, startOfWeek, addDays, parseISO, isSameDay } from 'date-fns'
import { useAuth } from '../hooks/useAuth'
import { useBeerLog } from '../hooks/useBeerLog'
import { formatUnits } from '../lib/units'
import AISummary from '../components/AISummary'

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const { getTodayLogs, getWeekLogs, deleteBeer } = useBeerLog(user?.id)
  const navigate = useNavigate()

  const [todayLogs, setTodayLogs] = useState([])
  const [weekLogs, setWeekLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAI, setShowAI] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const loadData = useCallback(async () => {
    try {
      const [today, week] = await Promise.all([getTodayLogs(), getWeekLogs()])
      setTodayLogs(today)
      setWeekLogs(week)
    } catch (err) {
      console.error('Error loading dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [getTodayLogs, getWeekLogs])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Today's stats
  const todayCount = todayLogs.length
  const todayMl = todayLogs.reduce((sum, log) => sum + log.volume_ml, 0)
  const todayUnits = todayLogs.reduce((sum, log) => sum + log.units, 0)

  // Weekly chart data (Mon–Sun)
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i)
    const dayLogs = weekLogs.filter(log => isSameDay(parseISO(log.logged_at), day))
    return {
      name: format(day, 'EEE'),
      beers: dayLogs.length,
      isToday: isSameDay(day, new Date()),
    }
  })

  async function handleDelete(id) {
    setDeleting(id)
    try {
      await deleteBeer(id)
      await loadData()
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeleting(null)
    }
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening'

  return (
    <div className="py-4 space-y-4">
      {/* Greeting */}
      <div>
        <h2 className="text-xl font-bold text-stone-100">
          {greeting}, {firstName} 👋
        </h2>
        <p className="text-stone-500 text-sm">
          {format(new Date(), 'EEEE, d MMMM yyyy')}
        </p>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Beers"
          value={loading ? '–' : todayCount}
          icon="🍺"
          highlight={todayCount > 0}
        />
        <StatCard
          label="Volume"
          value={loading ? '–' : todayMl > 0 ? `${(todayMl / 1000).toFixed(1)}L` : '0'}
          icon="💧"
          highlight={todayMl > 0}
        />
        <StatCard
          label="Units"
          value={loading ? '–' : formatUnits(todayUnits)}
          icon="📊"
          highlight={todayUnits > 0}
          danger={todayUnits > 5}
        />
      </div>

      {/* Add Beer Button */}
      <button
        onClick={() => navigate('/log')}
        className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-stone-950 font-bold rounded-2xl py-5 flex items-center justify-center gap-3 text-lg transition-colors touch-manipulation shadow-lg shadow-amber-500/20"
      >
        <span className="text-2xl">+</span>
        <span>Add Beer</span>
      </button>

      {/* Weekly Chart */}
      <div className="card">
        <h3 className="text-stone-300 font-semibold text-sm mb-3">Beers This Week</h3>
        {loading ? (
          <div className="h-28 flex items-center justify-center text-stone-600 text-sm">Loading...</div>
        ) : (
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: '#78716c', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: '#78716c', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: '#1c1917',
                  border: '1px solid #44403c',
                  borderRadius: '8px',
                  color: '#e7e5e4',
                  fontSize: '12px',
                }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                formatter={(value) => [value, 'beers']}
              />
              <Bar dataKey="beers" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.isToday ? '#f59e0b' : entry.beers > 0 ? '#92400e' : '#292524'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* AI Summary */}
      <button
        onClick={() => setShowAI(!showAI)}
        className="w-full card flex items-center justify-between hover:border-amber-600/50 transition-colors active:bg-stone-800 touch-manipulation"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <div className="text-left">
            <div className="text-stone-200 font-semibold text-sm">Summarise My Drinking</div>
            <div className="text-stone-500 text-xs">AI-powered weekly breakdown</div>
          </div>
        </div>
        <svg className={`w-5 h-5 text-stone-500 transition-transform ${showAI ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {showAI && <AISummary userId={user?.id} profile={profile} />}

      {/* Today's Log */}
      {todayLogs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-stone-400 font-semibold text-sm uppercase tracking-wider">Today's Log</h3>
          {todayLogs.map(log => (
            <BeerLogItem
              key={log.id}
              log={log}
              onDelete={handleDelete}
              deleting={deleting === log.id}
            />
          ))}
        </div>
      )}

      {!loading && todayLogs.length === 0 && (
        <div className="text-center py-8 text-stone-600">
          <div className="text-4xl mb-2">🫗</div>
          <p className="text-sm">No beers logged today</p>
          <p className="text-xs mt-1">Stay hydrated... with beer.</p>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, highlight, danger }) {
  return (
    <div className={`card flex flex-col items-center py-3 gap-1 ${danger ? 'border-red-800/50' : highlight ? 'border-amber-700/30' : ''}`}>
      <span className="text-xl">{icon}</span>
      <span className={`text-xl font-bold ${danger ? 'text-red-400' : highlight ? 'text-amber-400' : 'text-stone-500'}`}>
        {value}
      </span>
      <span className="text-stone-500 text-xs">{label}</span>
    </div>
  )
}

function BeerLogItem({ log, onDelete, deleting }) {
  return (
    <div className="card flex items-center gap-3">
      <span className="text-2xl">🍺</span>
      <div className="flex-1 min-w-0">
        <div className="text-stone-200 text-sm font-medium truncate">
          {log.beer_name || 'Beer'}
        </div>
        <div className="text-stone-500 text-xs">
          {log.volume_ml}ml • {log.abv_percent}% • {formatUnits(log.units)} units
        </div>
        <div className="text-stone-600 text-xs">
          {format(parseISO(log.logged_at), 'h:mm a')}
        </div>
      </div>
      <button
        onClick={() => onDelete(log.id)}
        disabled={deleting}
        className="text-stone-600 hover:text-red-400 transition-colors p-2 touch-manipulation disabled:opacity-50"
      >
        {deleting ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        )}
      </button>
    </div>
  )
}
