import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    // Hard fallback: never show the loading screen for more than 6 s.
    // Catches any network hang or unhandled edge-case.
    const fallbackTimer = setTimeout(() => {
      if (!cancelled) setLoading(false)
    }, 6000)

    async function init() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (cancelled) return
        if (error) throw error

        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          await fetchProfile(currentUser, cancelled)
        }
      } catch (err) {
        console.error('Auth init error:', err)
      } finally {
        if (!cancelled) {
          setLoading(false)
          clearTimeout(fallbackTimer)
        }
      }
    }

    init()

    // onAuthStateChange handles sign-in / sign-out AFTER the initial load.
    // We deliberately do NOT call setLoading(true) here — the loading screen
    // is only for the very first boot. Subsequent session changes update
    // user/profile silently in the background.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (cancelled) return
        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          try {
            await fetchProfile(currentUser, cancelled)
          } catch (err) {
            console.error('onAuthStateChange fetchProfile error:', err)
          }
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      cancelled = true
      clearTimeout(fallbackTimer)
      subscription.unsubscribe()
    }
  }, [])

  async function fetchProfile(currentUser, cancelled = false) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      if (cancelled) return

      if (!error) {
        setProfile(data)
        return
      }

      if (error.code === 'PGRST116') {
        const { data: created, error: upsertErr } = await supabase
          .from('profiles')
          .upsert({
            id: currentUser.id,
            full_name: currentUser.user_metadata?.full_name ?? null,
            avatar_url: currentUser.user_metadata?.avatar_url ?? null,
          })
          .select()
          .single()

        if (!cancelled) setProfile(upsertErr ? null : created)
        return
      }

      console.error('fetchProfile error:', error.code, error.message)
      if (!cancelled) setProfile(null)
    } catch (err) {
      console.error('fetchProfile threw:', err)
      if (!cancelled) setProfile(null)
    }
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) throw error
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  async function updateProfile(updates) {
    if (!user) throw new Error('Not authenticated')
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...updates, updated_at: new Date().toISOString() })
      .select()
      .single()
    if (error) throw error
    setProfile(data)
    return data
  }

  async function uploadAvatar(file) {
    if (!user) throw new Error('Not authenticated')
    const fileExt = file.name.split('.').pop()
    const filePath = `avatars/${user.id}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })
    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)
    return publicUrl
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signInWithGoogle,
      signOut,
      updateProfile,
      uploadAvatar,
      refreshProfile: () => user && fetchProfile(user),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
