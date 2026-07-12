import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { useAuth } from './context/AuthContext'
import { AuthCallbackPage, LoginPage } from './pages/AuthPages'
import {
  CollaboratePage, CreatorProfilePage, DashboardPage, DiscoverPage, EventsPage, FeedPage, MyProjectsPage,
  NotificationsPage, ProfilePage, ProjectDetailPage, SettingsPage,
} from './pages/AppPages'
import { OnboardingPage } from './pages/OnboardingPage'
import { AccountSecurityPage, AdminPage, BillingPage, IntegrationsPage, MessagesPage, PublishingPage } from './pages/ReleasePages'
import { LandingPage, LegalPage } from './pages/PublicPages'

function ProtectedApp() {
  const { authenticated, loading, profile } = useAuth()
  if (loading) return <div className="center-screen"><div className="loading-mark">C</div><p>Loading CreatorOS…</p></div>
  if (!authenticated) return <Navigate to="/login" replace />
  if (profile && profile.onboarding_complete === false) return <Navigate to="/onboarding" replace />
  return <AppShell />
}

export default function App() {
  return <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/auth/callback" element={<AuthCallbackPage />} />
    <Route path="/onboarding" element={<OnboardingPage />} />
    <Route path="/privacy" element={<LegalPage type="privacy" />} />
    <Route path="/terms" element={<LegalPage type="terms" />} />
    <Route path="/community-guidelines" element={<LegalPage type="guidelines" />} />
    <Route path="/app" element={<ProtectedApp />}>
      <Route index element={<DashboardPage />} />
      <Route path="feed" element={<FeedPage />} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="projects" element={<MyProjectsPage />} />
      <Route path="projects/explore" element={<MyProjectsPage explore />} />
      <Route path="project/:id" element={<ProjectDetailPage />} />
      <Route path="discover" element={<DiscoverPage />} />
      <Route path="collaborate" element={<CollaboratePage />} />
      <Route path="events" element={<EventsPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="creator/:username" element={<CreatorProfilePage />} />
      <Route path="messages" element={<MessagesPage />} />
      <Route path="publishing" element={<PublishingPage />} />
      <Route path="integrations" element={<IntegrationsPage />} />
      <Route path="billing" element={<BillingPage />} />
      <Route path="security" element={<AccountSecurityPage />} />
      <Route path="admin" element={<AdminPage />} />
      <Route path="settings" element={<SettingsPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}
