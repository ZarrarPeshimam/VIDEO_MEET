import React from 'react'
import AppRoutes from './routes/AppRoutes'
import { UserProvider } from './contexts/userContext'
import { MeetingProvider } from './contexts/meetingContext'

export default function App() {
  return (
    <UserProvider>
      <MeetingProvider>
        <AppRoutes />
      </MeetingProvider>
    </UserProvider>
  )
}
