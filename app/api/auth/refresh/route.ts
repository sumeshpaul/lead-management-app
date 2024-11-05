import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { verifyToken } from '@/lib/auth'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Generate a new token
    const newToken = jwt.sign(
      { userId: decoded.userId, phoneNumber: decoded.phoneNumber },
      JWT_SECRET,
      { expiresIn: '1d' }
    )

    return NextResponse.json({ token: newToken })
  } catch (error) {
    console.error('Error in POST /api/auth/refresh:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}