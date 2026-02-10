import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return true
    const payload = JSON.parse(atob(parts[1]))
    if (!payload.exp) return true
    return Date.now() >= payload.exp * 1000
  } catch {
    return true
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value

  if (request.nextUrl.pathname.startsWith('/login')) {
    if (token && !isTokenExpired(token)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  if (!token || isTokenExpired(token)) {
    const response = NextResponse.redirect(new URL('/login', request.url))
    if (token) {
      response.cookies.delete('token')
    }
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
