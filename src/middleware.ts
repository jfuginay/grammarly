import { NextRequest, NextResponse } from 'next/server'
import { CORS_HEADERS, isOriginAllowed, getAllowedOrigin } from '@/lib/cors'

export function middleware(request: NextRequest) {
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

  // Handle actual requests
  const response = NextResponse.next()
  
  // Set CORS headers for all requests
  response.headers.set('Access-Control-Allow-Origin', getAllowedOrigin(origin))
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
