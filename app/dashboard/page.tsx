'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LeadManagementDashboard from '@/components/LeadManagementDashboard'
import { apiService } from '@/lib/api-service'

export default function DashboardPage() {
  const [userInfo, setUserInfo] = useState<{ phoneNumber: string; name: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const storedUserInfo = localStorage.getItem('user')
    if (storedUserInfo) {
      try {
        const parsedUserInfo = JSON.parse(storedUserInfo)
        setUserInfo(parsedUserInfo)
      } catch {
        localStorage.removeItem('user')
        router.push('/login')
      }
    } else {
      router.push('/login')
    }
    setIsLoading(false)
  }, [router])

  const handleLogout = async () => {
    try {
      await apiService.logout()
    } catch {
      // Continue with logout even if API call fails
    }
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!userInfo) {
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
