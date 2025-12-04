import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ResumeProvider } from './hooks/useResumeContext'
import { AuthProvider } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import LandingPageNew from './pages/LandingPageNew'
import RegisterPage from './pages/RegisterPage'
import UploadPage from './pages/UploadPage'
import DashboardPage from './pages/DashboardPage'
import JobRoleDetailsPage from './pages/JobRoleDetailsPage'
import JobsListingPage from './pages/JobsListingPage'
import SettingsPage from './pages/SettingsPage'
import ProfilePage from './pages/ProfilePage'
import ErrorBoundary from './components/ui/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider> 
        <ResumeProvider>
          <Router>
            <Routes>
              <Route path="/" element={<LandingPageNew />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/job-role/:roleId" element={<JobRoleDetailsPage />} />
              <Route path="/jobs" element={<JobsListingPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Routes>
          </Router>
        </ResumeProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
