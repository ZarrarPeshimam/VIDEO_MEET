import React from 'react'
import AppRoutes from './routes/AppRoutes'
import { UserProvider } from './contexts/userContext'

export default function App() {
  return (
    <UserProvider>
      <AppRoutes />
    </UserProvider>
  )
}
