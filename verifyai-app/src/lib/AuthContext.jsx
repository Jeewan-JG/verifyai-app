import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Safety timeout — if Supabase doesn't respond in 8s, stop loading anyway
    const timeout = setTimeout(() => setLoading(false), 8000)

    // Get existing session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timeout)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (error) console.error('Google sign-in error:', error.message)
  }

  const signInWithEmail = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  // Trial helpers. trial_ends_at is read from app_metadata, which only the
  // server (service role) can write — users cannot extend their own trial.
  // user_metadata is a legacy fallback for accounts created before the
  // supabase-trial-migration.sql backfill ran; remove it once that's applied.
  const appMeta = user?.app_metadata ?? {}
  const isPaidUser = appMeta.plan === 'paid'
  const isAdmin = appMeta.role === 'admin'
  const trialEndsAt = appMeta.trial_ends_at ?? user?.user_metadata?.trial_ends_at ?? null
  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt) - Date.now()) / (1000 * 60 * 60 * 24)))
    : null
  // No trial date at all now means NO access (previously it meant unlimited
  // access, so deleting the key from the console granted a free account).
  const isTrialExpired = !!user && !isPaidUser && !isAdmin &&
    (!trialEndsAt || new Date(trialEndsAt) < new Date())
  const isOnTrial = !!trialEndsAt && !isTrialExpired && !isPaidUser && !isAdmin

  return (
    <AuthContext.Provider value={{
      user, loading,
      signInWithGoogle, signInWithEmail, signOut,
      trialDaysLeft, isTrialExpired, isOnTrial, isPaidUser, isAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
