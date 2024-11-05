'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Smartphone } from 'lucide-react'

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSendCode = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: `+971${phoneNumber}` }),
      })

      if (response.ok) {
        setIsVerifying(true)
        toast({
          title: "Verification Code Sent",
          description: "Please check your WhatsApp for the verification code.",
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to send verification code.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber: `+971${phoneNumber}`,
          code: verificationCode 
        }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        
        toast({
          title: "Login Successful",
          description: `Welcome back, ${data.user.name}!`,
        })

        router.push('/dashboard')
      } else {
        const errorData = await response.json()
        toast({
          title: "Invalid Code",
          description: errorData.error || "The verification code you entered is incorrect.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
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