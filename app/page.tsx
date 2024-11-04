'use client'

import { useState } from 'react'
import PhoneLogin from '@/components/PhoneLogin'
import LeadManagementDashboard from '@/components/LeadManagementDashboard'
import { Lead } from '@/types/lead'

export default function Home() {
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null)

  const handleLogin = (phoneNumber: string) => {
    setLoggedInUser(phoneNumber)
  }

  if (!loggedInUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <PhoneLogin onLogin={handleLogin} />
      </div>
    )
  }

  return <LeadManagementDashboard userPhoneNumber={loggedInUser} />
}