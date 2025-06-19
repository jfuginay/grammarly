// Configuration for allowed origins and CORS settings
export const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'https://app.co.dev',
  'https://grammarly-est.engindearing.soy',
  'https://grammarly-2.vercel.app',
  // Add custom origins from environment variables
  ...(typeof process !== 'undefined' && process.env?.ADDITIONAL_ALLOWED_ORIGINS ? 
    process.env.ADDITIONAL_ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) : 
    []
  ),
];

export const CORS_HEADERS = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400', // 24 hours
};

export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;
  
  // Check exact matches
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  
  // Check wildcard patterns for common domains
  if (origin.includes('.co.dev') && origin.startsWith('https://')) return true;
  if (origin.includes('.engindearing.soy') && origin.startsWith('https://')) return true;
  if (origin.includes('.vercel.app') && origin.startsWith('https://')) return true;
  
  // Allow localhost with any port in development
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return true;
    }
  }
  
  return false;
}

export function getAllowedOrigin(requestOrigin: string | undefined): string {
  if (requestOrigin && isOriginAllowed(requestOrigin)) {
    return requestOrigin;
  }
  
  // Return the first origin as default
  return ALLOWED_ORIGINS[0];
}

export function setCorsHeaders(res: Response | any, origin?: string): void {
  const allowedOrigin = getAllowedOrigin(origin);
  
  if (res.setHeader) {
    // Next.js API Response
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
  } else if (res.headers) {
    // Next.js Middleware Response
    res.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    Object.entries(CORS_HEADERS).forEach(([key, value]) => {
      res.headers.set(key, value);
    });
  }
}
