'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useToast } from './ui/use-toast'
import { Smartphone } from 'lucide-react'

interface PhoneLoginProps {
  onLogin: (phoneNumber: string) => void
  userMapping: Record<string, { name: string; phone: string }>
}

export default function PhoneLogin({ onLogin, userMapping }: PhoneLoginProps) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '')
    if (digits.length <= 9) {
      setPhoneNumber(digits)
    }
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
    
    if (phoneNumber.length !== 9) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 9-digit phone number",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    if (!userMapping[phoneNumber]) {
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
      toast({
        title: "Login Successful",
        description: `Welcome back, ${userMapping[phoneNumber].name}!`,
      })
      // Clear the stored code
      sessionStorage.removeItem('verificationCode')
      // Call onLogin with the full phone number instead of redirecting
      onLogin(`+971${phoneNumber}`)
    } else {
      toast({
        title: "Invalid Code",
        description: "The verification code you entered is incorrect.",
        variant: "destructive",
      })
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Login with Phone Number</CardTitle>
          <p className="text-muted-foreground">
            {isVerifying 
              ? "Enter the verification code sent to your phone"
              : "Enter your phone number to receive a verification code"
            }
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!isVerifying ? (
              <>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium leading-none flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Phone Number
                  </label>
                  <div className="flex">
                    <div className="flex items-center rounded-l-md border border-r-0 bg-muted px-3">
                      <span className="text-sm text-muted-foreground">+971</span>
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="543323218"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      className="rounded-l-none"
                      disabled={loading}
                    />
                  </div>
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