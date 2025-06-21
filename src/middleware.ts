import { NextRequest, NextResponse } from 'next/server'

// Simple function to check if a token exists
// This is a simplified approach that only checks for token presence
// In a production environment, you'd want to properly verify the token
// but without using libraries that aren't compatible with Edge Runtime
function isAuthenticated(token: string | undefined): boolean {
  return !!token;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('auth_token')?.value

  // Handle routes for logged-in users
  if (token && isAuthenticated(token)) {
    // If token is present and user is on login/signup, redirect to dashboard
    if (pathname === '/login' || pathname === '/signup') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    // Otherwise, allow access
    return NextResponse.next()
  }

  // Handle routes for logged-out users
  if (!token || !isAuthenticated(token)) {
    // If trying to access a protected route, redirect to login
    if (pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
    
    // If on login/signup with an invalid token, clear it
    if ((pathname === '/login' || pathname === '/signup') && token) {
      const response = NextResponse.next()
      response.cookies.delete('auth_token')
      return response
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
