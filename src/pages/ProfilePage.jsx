import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { HSE_GUIDELINES, formatUnits } from '../lib/units'
import { supabase } from '../lib/supabase'

export default function ProfilePage() {
  const { user, profile, updateProfile, uploadAvatar, signOut } = useAuth()
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [gender, setGender] = useState(profile?.gender || 'male')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [signingOut, setSigningOut] = useState(false)

  function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setAvatarPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  async function handleSave() {
    if (!fullName.trim()) return
    setLoading(true)
    setError(null)

    try {
      let avatarUrl = profile?.avatar_url

      if (avatarFile) {
        avatarUrl = await uploadAvatar(avatarFile)
      }

      await updateProfile({
        full_name: fullName.trim(),
        gender,
        avatar_url: avatarUrl,
      })

      setEditing(false)
      setAvatarFile(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut()
    } catch (err) {
      console.error(err)
      setSigningOut(false)
    }
  }

  const weeklyLimit = HSE_GUIDELINES[profile?.gender || 'male']

  return (
    <div className="py-4 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-stone-100">Profile</h2>
        <p className="text-stone-500 text-sm">{user?.email}</p>
      </div>

      {/* Avatar + Name Card */}
      <div className="card flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-stone-800 border-2 border-amber-500/50">
            {(editing ? avatarPreview : profile?.avatar_url) ? (
              <img
                src={editing ? avatarPreview : profile.avatar_url}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-stone-400">
                {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          {editing && (
            <label className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-1 cursor-pointer">
              <svg className="w-3 h-3 text-stone-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
              </svg>
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="input-field text-base"
              placeholder="Your name"
            />
          ) : (
            <>
              <div className="text-stone-100 font-semibold text-lg truncate">{profile?.full_name}</div>
              <div className="text-stone-500 text-xs capitalize">{profile?.gender || 'male'} · {weeklyLimit} units/week limit</div>
            </>
          )}
        </div>

        {!editing && (
          <button
            onClick={() => {
              setFullName(profile?.full_name || '')
              setGender(profile?.gender || 'male')
              setAvatarPreview(profile?.avatar_url || null)
              setEditing(true)
            }}
            className="text-amber-400 hover:text-amber-300 transition-colors p-2 touch-manipulation flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
          </button>
        )}
      </div>

      {/* Gender selector when editing */}
      {editing && (
        <div>
          <label className="block text-stone-400 text-sm font-medium mb-2">
            Gender <span className="text-stone-600">(for HSE unit guidelines)</span>
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
      )}

      {editing && (
        <>
          {error && (
            <div className="bg-red-900/50 border border-red-700 rounded-xl p-3 text-red-300 text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => { setEditing(false); setAvatarFile(null) }}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || !fullName.trim()}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </>
      )}

      {/* Account Info */}
      <div className="card space-y-2">
        <h3 className="text-stone-400 font-semibold text-sm uppercase tracking-wider">Account</h3>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-stone-700 flex-shrink-0">
            <img
              src={`https://www.google.com/s2/favicons?sz=32&domain=google.com`}
              alt="Google"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-stone-300 text-sm font-medium">Google Account</div>
            <div className="text-stone-500 text-xs truncate">{user?.email}</div>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="card space-y-2 text-xs text-stone-500">
        <h3 className="text-stone-400 font-semibold text-sm uppercase tracking-wider mb-2">About</h3>
        <p>BeerTracker helps you log and track your alcohol consumption.</p>
        <p>Units calculated as: <span className="font-mono text-stone-400">(ml × ABV%) ÷ 1000</span></p>
        <p>Guidelines based on Irish HSE recommendations: 17 units/week for men, 11 for women.</p>
        <p className="text-stone-600">Drink responsibly. Know your limits. 🍺</p>
      </div>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        disabled={signingOut}
        className="w-full bg-stone-900 hover:bg-stone-800 border border-stone-700 hover:border-red-800/50 text-stone-400 hover:text-red-400 font-medium rounded-xl py-3 transition-colors touch-manipulation disabled:opacity-50"
      >
        {signingOut ? 'Signing out...' : 'Sign Out'}
      </button>

      <div className="pb-4" />
    </div>
  )
}
