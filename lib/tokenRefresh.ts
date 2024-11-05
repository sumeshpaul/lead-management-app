import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function refreshToken(): Promise<string> {
  const currentToken = localStorage.getItem('token')
  if (!currentToken) {
    throw new Error('No token found')
  }

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to refresh token')
    }

    const { token } = await response.json()
    localStorage.setItem('token', token)
    return token
  } catch (error) {
    console.error('Error refreshing token:', error)
    throw error
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as { exp: number } | null
    if (!decoded) {
      return true
    }
    return Date.now() >= decoded.exp * 1000
  } catch (error) {
    return true
  }
}