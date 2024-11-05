'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LeadManagementDashboard from '@/components/LeadManagementDashboard'

export default function DashboardPage() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [userInfo, setUserInfo] = useState<{ phoneNumber: string; name: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if the user is already logged in
    const token = localStorage.getItem('token')
    const storedUserInfo = localStorage.getItem('user')
    if (token && storedUserInfo) {
      const parsedUserInfo = JSON.parse(storedUserInfo)
      setUserInfo(parsedUserInfo)
      setLoggedIn(true)
    } else {
      // If no token or user info, redirect to login
      router.push('/login')
    }
    setIsLoading(false)
  }, [router])

  const handleLogout = () => {
    setLoggedIn(false)
    setUserInfo(null)
    // Clear the stored user information and token
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    // Redirect to login page
    router.push('/login')
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!loggedIn) {
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