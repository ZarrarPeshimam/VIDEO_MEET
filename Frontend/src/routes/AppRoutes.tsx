import StartPage from '@/pages/StartPage'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import RegisterPage from '@/pages/RegisterPage'
import LoginPage from '@/pages/LoginPage'
import HomePage from '@/pages/HomePage'
import VideoMeetingPage from '@/pages/VideoMeetingPage'
import FeedbackPage from '@/pages/FeedbackPage'
import HistoryPage from '@/pages/HistoryPage'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/meeting/:meetingId" element={
          <ProtectedRoute>
            <VideoMeetingPage />
          </ProtectedRoute>
        } />
        <Route path="/home" element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/history" element={
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        } />
        {/* Update the generic route to also be protected */}
        <Route path="/:url" element={
          <ProtectedRoute>
            <VideoMeetingPage />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  )
}
