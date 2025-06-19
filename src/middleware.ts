import { NextRequest, NextResponse } from 'next/server'
import * as jose from 'jose'

const JWT_SECRET = process.env.JWT_SECRET

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('auth_token')?.value

  // A secret must be set to verify JWTs
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not set. Authentication will not work.')
    // In this case, we can't verify any token, so we treat the user as logged out.
    if (pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login?error=config_error', req.url))
    }
    return NextResponse.next()
  }

  // Handle routes for logged-in users
  if (token) {
    try {
      const secret = new TextEncoder().encode(JWT_SECRET)
      await jose.jwtVerify(token, secret)

      // If token is valid and user is on login/signup, redirect to dashboard
      if (pathname === '/login' || pathname === '/signup') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
      // Otherwise, allow access
      return NextResponse.next()
    } catch (error) {
      // Token is invalid (expired, malformed, etc.)
      // Redirect to login and clear the bad cookie
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('error', 'session_expired')
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('auth_token')
      return response
    }
  }

  // Handle routes for logged-out users
  if (!token) {
    // If trying to access a protected route, redirect to login
    if (pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/signup',
  ],
}
