'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LeadManagementDashboard from '../components/LeadManagementDashboard'

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [userInfo, setUserInfo] = useState<{ phoneNumber: string; name: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if the user is already logged in
    const storedUserInfo = localStorage.getItem('loggedInUser')
    if (storedUserInfo) {
      const parsedUserInfo = JSON.parse(storedUserInfo)
      setUserInfo(parsedUserInfo)
      setLoggedIn(true)
    }
    setLoading(false)
  }, [])

  const handleLogout = () => {
    setLoggedIn(false)
    setUserInfo(null)
    localStorage.removeItem('loggedInUser')
    router.push('/login')
  }

  // Show loading state
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  // Redirect to login if not logged in
  if (!loggedIn || !userInfo) {
    router.push('/login')
    return null
  }

  return (
    <LeadManagementDashboard 
      userPhoneNumber={userInfo.phoneNumber} 
      userName={userInfo.name}
      onLogout={handleLogout} 
    />
  )
}