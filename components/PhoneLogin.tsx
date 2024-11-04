'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

interface PhoneLoginProps {
  onLogin: (phoneNumber: string) => void
}

interface CountryCode {
  code: string
  label: string
  format: string
  length: number
}

const countryCodes: CountryCode[] = [
  { code: '+971', label: 'UAE', format: 'XX XXX XXXX', length: 9 },
  { code: '+91', label: 'India', format: 'XXXXX XXXXX', length: 10 },
]

export default function PhoneLogin({ onLogin }: PhoneLoginProps) {
  const [countryCode, setCountryCode] = useState<CountryCode>(countryCodes[0])
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const formatPhoneNumber = (value: string, country: CountryCode) => {
    const cleaned = value.replace(/\D/g, '')
    const match = cleaned.match(new RegExp(`.{1,${Math.ceil(country.length / 3)}}`, 'g'))
    return match ? match.join(' ') : cleaned
  }

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value, countryCode)
    setPhoneNumber(formatted)
  }

  const handleCountryCodeChange = (value: string) => {
    const newCountryCode = countryCodes.find(c => c.code === value) || countryCodes[0]
    setCountryCode(newCountryCode)
    setPhoneNumber('')
  }

  const handleSendCode = async () => {
    const digits = phoneNumber.replace(/\D/g, '')
    if (digits.length !== countryCode.length) {
      toast({
        title: "Invalid Phone Number",
        description: `Please enter a valid ${countryCode.length}-digit phone number`,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const fullPhoneNumber = `${countryCode.code}${digits}`
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: fullPhoneNumber,
          action: 'send'
        })
      })

      const data = await response.json()

      if (data.success) {
        setIsVerifying(true)
        toast({
          title: "Verification Code Sent",
          description: "Please check your WhatsApp for the verification code.",
        })
      } else {
        throw new Error(data.error || 'Failed to send verification code')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to send verification code',
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 6-digit verification code",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const digits = phoneNumber.replace(/\D/g, '')
      const fullPhoneNumber = `${countryCode.code}${digits}`
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: fullPhoneNumber,
          code: verificationCode,
          action: 'verify'
        })
      })

      const data = await response.json()

      if (data.success) {
        onLogin(fullPhoneNumber)
      } else {
        throw new Error(data.error || 'Invalid verification code')
      }
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : 'Failed to verify code',
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Login with Phone Number</CardTitle>
      </CardHeader>
      <CardContent>
        {!isVerifying ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="country-code">Country</Label>
              <Select
                value={countryCode.code}
                onValueChange={handleCountryCodeChange}
              >
                <SelectTrigger id="country-code">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countryCodes.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.label} ({country.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex">
                <div className="w-20 flex-shrink-0 mr-2">
                  <Input
                    value={countryCode.code}
                    disabled
                    className="font-mono text-center"
                  />
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={countryCode.format}
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  className="font-mono flex-grow"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Enter your {countryCode.length}-digit phone number
              </p>
            </div>
            <Button 
              onClick={handleSendCode} 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Code...
                </>
              ) : (
                'Send Verification Code'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="font-mono tracking-widest"
                maxLength={6}
              />
            </div>
            <Button 
              onClick={handleVerify} 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </Button>
            <Button 
              variant="link" 
              onClick={() => setIsVerifying(false)} 
              className="w-full"
              disabled={isLoading}
            >
              Change Phone Number
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}