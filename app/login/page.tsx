'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Smartphone } from 'lucide-react'
import { useRouter } from 'next/navigation'

const USER_MAPPING: Record<string, { name: string; phone: string }> = {
  '506294302': { name: 'Dr. (CA) Amit Garg', phone: '+971506294302' },
  '543323219': { name: 'Mr. Prabhakaran', phone: '+971543323219' },
  '543323218': { name: 'Mr. Sumesh Paul', phone: '+971543323218' },
}

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const loggedInUser = localStorage.getItem('loggedInUser')
    if (loggedInUser) {
      router.push('/')
    }
    setLoading(false)
  }, [router])

  // Show loading state
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  const sendWhatsAppMessage = async (phone: string, message: string) => {
    try {
      const response = await fetch('/api/send-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phone,
          message: message,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send WhatsApp message')
      }
    } catch (error) {
      console.error('Error sending WhatsApp message:', error)
      throw error
    }
  }

  const handleSendCode = async () => {
    setLoading(true)
    
    const phoneRegex = /^[0-9]{9}$/
    if (!phoneRegex.test(phoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 9-digit phone number",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    if (!USER_MAPPING[phoneNumber]) {
      toast({
        title: "User Not Found",
        description: "This phone number is not registered in the system.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      // Generate a random 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString()
      
      // Send the code via WhatsApp
      await sendWhatsAppMessage(
        `+971${phoneNumber}`,
        `Your verification code for Lead Management System is: ${code}`
      )

      // Store the code securely (in a real app, this should be done server-side)
      sessionStorage.setItem('verificationCode', code)
      
      setIsVerifying(true)
      toast({
        title: "Verification Code Sent",
        description: "Please check your WhatsApp for the verification code.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send verification code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    setLoading(true)

    // Get the stored code (in a real app, this verification should be done server-side)
    const storedCode = sessionStorage.getItem('verificationCode')

    if (verificationCode === storedCode) {
      // Clear the stored code
      sessionStorage.removeItem('verificationCode')
      
      // Store the user information
      const userInfo = {
        phoneNumber: `+971${phoneNumber}`,
        name: USER_MAPPING[phoneNumber].name
      }
      localStorage.setItem('loggedInUser', JSON.stringify(userInfo))
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${userInfo.name}!`,
      })

      // Use replace instead of push to prevent back navigation
      router.replace('/')
    } else {
      toast({
        title: "Invalid Code",
        description: "The verification code you entered is incorrect.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Lead Management System</CardTitle>
          <CardDescription>
            {isVerifying 
              ? "Enter the verification code sent to your phone"
              : "Sign in to your account"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!isVerifying ? (
              <>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Smartphone className="h-4 w-4" />
                    <span className="text-sm font-medium">Phone Number</span>
                  </div>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                      +971
                    </span>
                    <Input
                      type="tel"
                      placeholder="543323218"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={loading}
                      className="rounded-l-none"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enter your 9-digit phone number
                  </p>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleSendCode}
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Verification Code"}
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                    disabled={loading}
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter the 6-digit code sent to +971{phoneNumber}
                  </p>
                </div>
                <div className="space-y-2">
                  <Button 
                    className="w-full" 
                    onClick={handleVerifyCode}
                    disabled={loading}
                  >
                    {loading ? "Verifying..." : "Verify Code"}
                  </Button>
                  <Button 
                    variant="link" 
                    className="w-full"
                    onClick={() => {
                      setIsVerifying(false)
                      setVerificationCode('')
                    }}
                    disabled={loading}
                  >
                    Use a different phone number
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}