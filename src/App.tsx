import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppShell from './components/AppShell'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import AttendancePage from './pages/AttendancePage'
import TasksPage from './pages/TasksPage'
import GoalsPage from './pages/GoalsPage'
import TeamPage from './pages/TeamPage'
import LeavePage from './pages/LeavePage'
import NotificationsPage from './pages/NotificationsPage'
import ProjectsPage from './pages/ProjectsPage'
import PerformancePage from './pages/PerformancePage'
import ReportsPage from './pages/ReportsPage'
import InsightsPage from './pages/InsightsPage'
import InvitePage from './pages/InvitePage'
import InviteSignupPage from './pages/InviteSignupPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/invite/:code" element={<InviteSignupPage />} />
          <Route path="/app" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="goals" element={<GoalsPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="leave" element={<LeavePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="performance" element={<PerformancePage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="insights" element={<InsightsPage />} />
            <Route path="invite" element={<InvitePage />} />
          </Route>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
