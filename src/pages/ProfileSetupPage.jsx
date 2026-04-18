import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function ProfileSetupPage() {
  const { user, updateProfile, uploadAvatar } = useAuth()
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '')
  const [gender, setGender] = useState('male')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(
    user?.user_metadata?.avatar_url || null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setAvatarPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!fullName.trim()) {
      setError('Please enter your name')
      return
    }

    setLoading(true)
    setError(null)

    try {
      let avatarUrl = user?.user_metadata?.avatar_url || null

      if (avatarFile) {
        avatarUrl = await uploadAvatar(avatarFile)
      }

      await updateProfile({
        full_name: fullName.trim(),
        gender,
        avatar_url: avatarUrl,
      })
      // Success — App.jsx will navigate away once profile is set.
      // setLoading(false) is handled in finally so the button never stays frozen.
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center px-6 max-w-[430px] mx-auto py-8">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">👋</div>
        <h1 className="text-2xl font-bold text-stone-100 mb-2">Welcome to BeerTracker!</h1>
        <p className="text-stone-400 text-sm">Let's set up your profile before we crack one open.</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-5">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-stone-800 border-2 border-amber-500">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  👤
                </div>
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-1.5 cursor-pointer hover:bg-amber-400 transition-colors">
              <svg className="w-4 h-4 text-stone-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
              </svg>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-stone-500 text-xs">Using your Google photo • tap to change</p>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-stone-400 text-sm font-medium mb-2">
            Your name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="What do your mates call you?"
            className="input-field"
            autoFocus
          />
        </div>

        {/* Gender (for HSE guideline calculation) */}
        <div>
          <label className="block text-stone-400 text-sm font-medium mb-2">
            Gender <span className="text-stone-600 font-normal">(for HSE unit guidelines)</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'male', label: '♂ Male', limit: '17 units/week' },
              { value: 'female', label: '♀ Female', limit: '11 units/week' },
            ].map(({ value, label, limit }) => (
              <button
                key={value}
                type="button"
                onClick={() => setGender(value)}
                className={`p-3 rounded-xl border transition-colors text-sm font-medium ${
                  gender === value
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                    : 'bg-stone-800 border-stone-700 text-stone-400'
                }`}
              >
                <div>{label}</div>
                <div className={`text-xs mt-0.5 ${gender === value ? 'text-amber-500/70' : 'text-stone-600'}`}>{limit}</div>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-xl p-3 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !fullName.trim()}
          className="btn-primary w-full text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Setting up...' : "Let's Go! 🍺"}
        </button>
      </form>
    </div>
  )
}
