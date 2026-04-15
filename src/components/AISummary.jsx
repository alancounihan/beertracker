import { useState } from 'react'
import { useBeerLog } from '../hooks/useBeerLog'

const PERIOD_OPTIONS = ['week', 'month', 'year']

export default function AISummary({ userId, profile }) {
  const { getLogsByPeriod } = useBeerLog(userId)
  const [period, setPeriod] = useState('week')
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    setSummary(null)

    try {
      const logs = await getLogsByPeriod(period)

      const response = await fetch('/api/summarise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logs,
          period,
          profile: {
            name: profile?.full_name,
            gender: profile?.gender || 'male',
          },
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to generate summary')
      }

      const data = await response.json()
      setSummary(data.summary)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card space-y-4 border-amber-700/30">
      {/* Period selector */}
      <div className="flex gap-2">
        {PERIOD_OPTIONS.map(p => (
          <button
            key={p}
            onClick={() => { setPeriod(p); setSummary(null) }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              period === p
                ? 'bg-amber-500 text-stone-950'
                : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Generate button */}
      {!summary && !loading && (
        <button
          onClick={handleGenerate}
          className="w-full bg-stone-800 hover:bg-stone-700 active:bg-stone-900 text-amber-400 font-semibold rounded-xl py-3 text-sm transition-colors flex items-center justify-center gap-2 touch-manipulation"
        >
          <span>✨</span>
          <span>Generate {period.charAt(0).toUpperCase() + period.slice(1)} Summary</span>
        </button>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-4">
          <div className="text-2xl mb-2 animate-spin inline-block">⚙️</div>
          <p className="text-stone-400 text-sm">Claude is reviewing your drinking habits...</p>
          <p className="text-stone-600 text-xs mt-1">This may take a moment</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <span className="text-amber-400 font-semibold text-sm">Claude's Verdict</span>
          </div>
          <div className="bg-stone-800 rounded-xl p-4 text-stone-200 text-sm leading-relaxed whitespace-pre-wrap">
            {summary}
          </div>
          <button
            onClick={handleGenerate}
            className="text-stone-500 text-xs hover:text-stone-400 transition-colors"
          >
            🔄 Regenerate
          </button>
        </div>
      )}
    </div>
  )
}
