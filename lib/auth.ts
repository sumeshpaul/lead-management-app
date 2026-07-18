import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export type UserRole = 'staff' | 'partner'

interface JwtPayload {
  userId: string
  phoneNumber: string
  role?: UserRole
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch (error) {
    return null
  }
}

// Partners have read-only access; write endpoints must call this before mutating.
export function verifyWriteAccess(request: Request): { payload: JwtPayload | null; error: Response | null } {
  const token = request.headers.get('Authorization')?.split(' ')[1]
  if (!token) {
    return { payload: null, error: jsonError('No token provided', 401) }
  }

  const payload = verifyToken(token)
  if (!payload) {
    return { payload: null, error: jsonError('Invalid token', 401) }
  }

  if (payload.role === 'partner') {
    return { payload, error: jsonError('Partner accounts have view-only access', 403) }
  }

  return { payload, error: null }
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
