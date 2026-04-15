import { Component } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import { supabaseMissing } from './lib/supabase'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import ProfileSetupPage from './pages/ProfileSetupPage'
import DashboardPage from './pages/DashboardPage'
import LogPage from './pages/LogPage'
import LeaderboardPage from './pages/LeaderboardPage'
import ProfilePage from './pages/ProfilePage'

// ── Top-level error boundary ──────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center px-6 text-center max-w-[430px] mx-auto">
          <div className="text-5xl mb-4">💥</div>
          <h1 className="text-xl font-bold text-red-400 mb-2">Something went wrong</h1>
          <p className="text-stone-400 text-sm mb-4">{this.state.error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-stone-800 text-stone-200 rounded-xl px-6 py-3 text-sm hover:bg-stone-700 transition-colors"
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ── Missing env vars screen ───────────────────────────────
function MissingConfig() {
  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center px-6 text-center max-w-[430px] mx-auto">
      <div className="text-5xl mb-4">⚙️</div>
      <h1 className="text-xl font-bold text-amber-400 mb-2">Missing configuration</h1>
      <p className="text-stone-400 text-sm mb-6">
        Supabase environment variables are not set. Add these in Vercel → Project Settings → Environment Variables, then redeploy:
      </p>
      <div className="bg-stone-900 rounded-xl p-4 w-full text-left space-y-2 border border-stone-700">
        {['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'ANTHROPIC_API_KEY'].map(v => (
          <div key={v} className="font-mono text-xs text-amber-300">{v}</div>
        ))}
      </div>
      <p className="text-stone-600 text-xs mt-4">
        After adding them, trigger a new deployment.
      </p>
    </div>
  )
}

// ── Route guard ───────────────────────────────────────────
function AppRoutes() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🍺</div>
          <p className="text-stone-400 text-sm">Loading BeerTracker...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    )
  }

  if (!profile || !profile.full_name) {
    return (
      <Routes>
        <Route path="/setup" element={<ProfileSetupPage />} />
        <Route path="*" element={<Navigate to="/setup" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="log" element={<LogPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// ── Root ──────────────────────────────────────────────────
export default function App() {
  if (supabaseMissing) {
    return <MissingConfig />
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
