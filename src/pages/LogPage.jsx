import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useBeerLog } from '../hooks/useBeerLog'
import { VOLUME_PRESETS, calculateUnits, formatUnits } from '../lib/units'
import { format } from 'date-fns'

export default function LogPage() {
  const { user } = useAuth()
  const { addBeer, loading } = useBeerLog(user?.id)
  const navigate = useNavigate()

  const [beerName, setBeerName] = useState('')
  const [volumeMl, setVolumeMl] = useState(500)
  const [customVolume, setCustomVolume] = useState('')
  const [useCustomVolume, setUseCustomVolume] = useState(false)
  const [abv, setAbv] = useState('')
  const [timestamp, setTimestamp] = useState(
    format(new Date(), "yyyy-MM-dd'T'HH:mm")
  )
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const effectiveVolume = useCustomVolume
    ? (parseFloat(customVolume) || 0)
    : volumeMl

  const previewUnits = abv && effectiveVolume
    ? calculateUnits(effectiveVolume, parseFloat(abv))
    : 0

  async function handleSubmit(e) {
    e.preventDefault()
    if (!abv || parseFloat(abv) <= 0) {
      setError('Please enter an ABV %')
      return
    }
    if (!effectiveVolume || effectiveVolume <= 0) {
      setError('Please enter a volume')
      return
    }

    setError(null)

    try {
      await addBeer({
        beerName: beerName.trim() || null,
        volumeMl: effectiveVolume,
        abv: parseFloat(abv),
        timestamp: new Date(timestamp).toISOString(),
      })

      setSuccess(true)
      // Brief success flash, then reset
      setTimeout(() => {
        setSuccess(false)
        setBeerName('')
        setAbv('')
        setTimestamp(format(new Date(), "yyyy-MM-dd'T'HH:mm"))
      }, 1200)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="py-4 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-stone-100">Log a Beer</h2>
        <p className="text-stone-500 text-sm">Fill in what you know, skip what you don't.</p>
      </div>

      {success && (
        <div className="bg-green-900/50 border border-green-700 rounded-xl p-4 text-center">
          <div className="text-3xl mb-1">🍺</div>
          <p className="text-green-300 font-semibold">Beer logged!</p>
          <p className="text-green-500 text-xs mt-0.5">{formatUnits(previewUnits)} units added</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Beer Name */}
        <div>
          <label className="block text-stone-400 text-sm font-medium mb-2">
            Beer name <span className="text-stone-600">(optional)</span>
          </label>
          <input
            type="text"
            value={beerName}
            onChange={e => setBeerName(e.target.value)}
            placeholder="e.g. Guinness, Heineken..."
            className="input-field"
          />
        </div>

        {/* Volume */}
        <div>
          <label className="block text-stone-400 text-sm font-medium mb-2">Volume</label>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {VOLUME_PRESETS.map(preset => (
              <button
                key={preset.value}
                type="button"
                onClick={() => {
                  setVolumeMl(preset.value)
                  setUseCustomVolume(false)
                  setCustomVolume('')
                }}
                className={`py-3 rounded-xl text-sm font-medium transition-colors touch-manipulation ${
                  !useCustomVolume && volumeMl === preset.value
                    ? 'bg-amber-500 text-stone-950'
                    : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setUseCustomVolume(true)
                setCustomVolume('')
              }}
              className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-colors touch-manipulation whitespace-nowrap ${
                useCustomVolume
                  ? 'bg-amber-500/20 border border-amber-500 text-amber-400'
                  : 'bg-stone-800 text-stone-500 hover:bg-stone-700'
              }`}
            >
              Custom
            </button>
            {useCustomVolume && (
              <input
                type="number"
                value={customVolume}
                onChange={e => setCustomVolume(e.target.value)}
                placeholder="ml"
                min="1"
                max="5000"
                className="input-field flex-1"
                autoFocus
              />
            )}
            {!useCustomVolume && (
              <div className="flex-1 bg-stone-800/50 rounded-xl px-4 py-2.5 text-stone-500 text-sm">
                {volumeMl}ml selected
              </div>
            )}
          </div>
        </div>

        {/* ABV */}
        <div>
          <label className="block text-stone-400 text-sm font-medium mb-2">
            ABV % <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={abv}
              onChange={e => setAbv(e.target.value)}
              placeholder="e.g. 4.3"
              step="0.1"
              min="0.1"
              max="100"
              className="input-field"
            />
            {previewUnits > 0 && (
              <div className="bg-amber-500/10 border border-amber-700/50 rounded-xl px-4 py-3 text-center whitespace-nowrap">
                <div className="text-amber-400 font-bold text-lg">{formatUnits(previewUnits)}</div>
                <div className="text-stone-500 text-xs">units</div>
              </div>
            )}
          </div>
          {/* Quick ABV presets */}
          <div className="flex flex-wrap gap-2 mt-2">
            {[3.5, 4.0, 4.3, 4.5, 5.0, 5.5, 6.0].map(v => (
              <button
                key={v}
                type="button"
                onClick={() => setAbv(String(v))}
                className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-colors touch-manipulation ${
                  abv === String(v)
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-600'
                    : 'bg-stone-800 text-stone-500 hover:bg-stone-700'
                }`}
              >
                {v}%
              </button>
            ))}
          </div>
        </div>

        {/* Timestamp */}
        <div>
          <label className="block text-stone-400 text-sm font-medium mb-2">
            When <span className="text-stone-600">(defaults to now)</span>
          </label>
          <input
            type="datetime-local"
            value={timestamp}
            onChange={e => setTimestamp(e.target.value)}
            className="input-field"
            style={{ colorScheme: 'dark' }}
          />
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-xl p-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !abv}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : '🍺 Log Beer'}
          </button>
        </div>
      </form>
    </div>
  )
}
