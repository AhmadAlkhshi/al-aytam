import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import SessionsPage from './pages/SessionsPage'
import StudentsPage from './pages/StudentsPage'
import ActivitiesPage from './pages/ActivitiesPage'
import PointsPage from './pages/PointsPage'
import AttendancePage from './pages/AttendancePage'
import DivisionPage from './pages/DivisionPage'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './layouts/MainLayout'
import { Typography, Container } from '@mui/material'

function NotFoundPage() {
  return (
    <Container>
      <Typography variant="h4">٤٠٤ - الصفحة غير موجودة</Typography>
    </Container>
  )
}

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Authenticated — all share the MainLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/sessions" replace />} />
        <Route path="sessions"   element={<SessionsPage />} />
        <Route path="students"   element={<StudentsPage />} />
        <Route path="activities" element={<ActivitiesPage />} />
        <Route path="points"     element={<PointsPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="division"   element={<DivisionPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
