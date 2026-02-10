import jwt from 'jsonwebtoken'

function getSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set')
  }
  return secret
}

interface JwtPayload {
  userId: string
  phoneNumber: string
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, getSecret()) as JwtPayload
  } catch (error) {
    return null
  }
}

export function signToken(payload: { userId: string; phoneNumber: string }): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '1d' })
}

export function getTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie')
  if (cookieHeader) {
    const tokenCookie = cookieHeader
      .split(';')
      .find(c => c.trim().startsWith('token='))
    if (tokenCookie) {
      return tokenCookie.split('=')[1].trim()
    }
  }
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1]
  }
  return null
}

export function verifyRequestAuth(request: Request): JwtPayload | null {
  const token = getTokenFromRequest(request)
  if (!token) return null
  return verifyToken(token)
}
