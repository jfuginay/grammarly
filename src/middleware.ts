import { NextRequest, NextResponse } from 'next/server'
import { CORS_HEADERS, getAllowedOrigin } from '@/lib/cors'

export async function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') || undefined

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 })
    response.headers.set('Access-Control-Allow-Origin', getAllowedOrigin(origin))
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*',
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (image files)
     * - auth (auth routes)
     * - login (login route)
     * - signup (signup route)
     * - magic-link-login (magic link login route)
     */
    '/((?!_next/static|_next/image|favicon.ico|images|auth|login|signup|magic-link-login).*)',
  ],
}
