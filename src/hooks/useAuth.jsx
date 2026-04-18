import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
        let cancelled = false

                async function init() {
                        try {
                                  const { data: { session } } = await supabase.auth.getSession()
                                  if (cancelled) return
                                  const currentUser = session?.user ?? null
                                  setUser(currentUser)
                                  if (currentUser) {
                                              await fetchProfile(currentUser, cancelled)
                                  }
                        } catch (err) {
                                  console.error('Auth init error:', err)
                        } finally {
                                  if (!cancelled) setLoading(false)
                        }
                }

                init()

                              const { data: { subscription } } = supabase.auth.onAu
