'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LeadManagementDashboard from '../components/LeadManagementDashboard'

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [userInfo, setUserInfo] = useState<{ phoneNumber: string; name: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if the user is already logged in
    const storedUserInfo = localStorage.getItem('loggedInUser')
    if (storedUserInfo) {
      const parsedUserInfo = JSON.parse(storedUserInfo)
      setUserInfo(parsedUserInfo)
      setLoggedIn(true)
    }
    setIsLoading(false)
  }, [])

  const handleLogout = () => {
    setLoggedIn(false)
    setUserInfo(null)
    // Clear the stored user information
    localStorage.removeItem('loggedInUser')
    // Redirect to login page
    router.push('/login')
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!loggedIn) {
    router.push('/login')
    return null
  }

  return (
    <LeadManagementDashboard 
      userPhoneNumber={userInfo?.phoneNumber || ''} 
      userName={userInfo?.name || ''}
      onLogout={handleLogout} 
    />
  )
}