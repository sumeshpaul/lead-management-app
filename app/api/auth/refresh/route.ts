import { NextResponse } from 'next/server'
import { verifyRequestAuth, signToken } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const decoded = verifyRequestAuth(request)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const newToken = signToken({
      userId: decoded.userId,
      phoneNumber: decoded.phoneNumber,
    })

    const response = NextResponse.json({ success: true })

    response.cookies.set('token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Error in POST /api/auth/refresh:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
