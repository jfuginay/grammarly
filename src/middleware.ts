import { NextRequest, NextResponse } from 'next/server';
import { CORS_HEADERS, getAllowedOrigin } from '@/lib/cors';

export async function middleware(request: NextRequest) {
  let requestOrigin: string | undefined = undefined;
  const originHeader = request.headers.get('origin');

  if (originHeader) {
    try {
      const url = new URL(originHeader);
      requestOrigin = url.origin; // This gives protocol://hostname:port
    } catch (error) {
      // Handle invalid origin header if necessary, or leave requestOrigin as undefined
      console.warn(`Invalid origin header: ${originHeader}`, error);
    }
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    // getAllowedOrigin expects a string or undefined, so requestOrigin fits
    response.headers.set('Access-Control-Allow-Origin', getAllowedOrigin(requestOrigin));
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }

  // For non-preflight requests, you might also want to set CORS headers
  // if the response is directly constructed here, or if NextResponse.next()
  // doesn't handle it downstream appropriately for your needs.
  // However, the original code only set it for OPTIONS.
  // If CORS headers are needed for all responses from the middleware paths,
  // they should be added here too. For now, let's stick to the original logic.

  // Create the final response
  const response = NextResponse.next();

  // It's common practice to apply CORS headers to actual responses too, not just preflight.
  // Let's add them here to ensure consistency, as the middleware is intercepting these paths.
  // The original getAllowedOrigin will be used.
  response.headers.set('Access-Control-Allow-Origin', getAllowedOrigin(requestOrigin));
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    // Avoid overriding existing headers from NextResponse.next() if they are more specific,
    // though for CORS, these are generally authoritative from the middleware.
    response.headers.set(key, value);
  });

  return response;
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
     */
    '/((?!_next/static|_next/image|favicon.ico|images|auth|login|signup).*)',
  ],
};
