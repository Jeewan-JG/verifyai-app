import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CandidatesPage from './pages/CandidatesPage'
import UploadPage from './pages/UploadPage'
import AnalysisPage from './pages/AnalysisPage'
import ReportsPage from './pages/ReportsPage'
import ActivityPage from './pages/ActivityPage'
import AlertsPage from './pages/AlertsPage'
import SettingsPage from './pages/SettingsPage'
import ReportPrintPage from './pages/ReportPrintPage'
import ComplianceCenterPage from './pages/ComplianceCenterPage'
import PlatformPage from './pages/PlatformPage'
import PricingPage from './pages/PricingPage'

// Protect routes — redirect to login if not signed in; redirect to pricing if trial expired
const PrivateRoute = ({ children }) => {
  const { user, loading, isTrialExpired, isPaidUser } = useAuth()
  if (loading) return <div className="app-loading">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (isTrialExpired && !isPaidUser) return <Navigate to="/pricing" replace />
  return children
}

export default function App() {
  const { user } = useAuth()

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/pricing" element={<PricingPage />} />

      {/* Protected — all inside the Layout (sidebar + topbar) */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="candidates" element={<CandidatesPage />} />
        <Route path="upload" element={<UploadPage />} />
        <Route path="analysis/:candidateId" element={<AnalysisPage />} />
        <Route path="analysis" element={<AnalysisPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="compliance" element={<ComplianceCenterPage />} />
        <Route path="platform" element={<PlatformPage />} />
      </Route>

      {/* Print report — no sidebar/topbar */}
      <Route path="/report/:candidateId" element={<PrivateRoute><ReportPrintPage /></PrivateRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
