import StartPage from '@/pages/StartPage'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import RegisterPage from '@/pages/RegisterPage'
import LoginPage from '@/pages/LoginPage'
import HomePage from '@/pages/HomePage'
import VideoMeetingPage from '@/pages/VideoMeetingPage'
import FeedbackPage from '@/pages/FeedbackPage'
import HistoryPage from '@/pages/HistoryPage'

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/meeting/:meetingId" element={<VideoMeetingPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
        <Route path="/history" element={<HistoryPage />} />
        {/* Keep this generic route as a fallback, but make it more specific than "/:url" */}
        <Route path="/:url" element={<VideoMeetingPage />} />
      </Routes>
    </Router>
  )
}
