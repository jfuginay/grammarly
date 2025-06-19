/**
 * Domain validation utilities for handling multiple origins
 */

/**
 * Check if a domain matches a pattern (supports wildcards)
 * @param domain - The domain to check
 * @param pattern - The pattern to match against (e.g., "*.co.dev")
 * @returns boolean
 */
export function matchesDomainPattern(domain: string, pattern: string): boolean {
  // Convert pattern to regex
  const regexPattern = pattern
    .replace(/\./g, '\\.')  // Escape dots
    .replace(/\*/g, '.*');  // Convert wildcards to regex
  
  const regex = new RegExp(`^${regexPattern}$`, 'i');
  return regex.test(domain);
}

/**
 * Extract domain from a full URL
 * @param url - The full URL
 * @returns string - The domain part
 */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url; // Return as-is if not a valid URL
  }
}

/**
 * Check if an origin is allowed based on patterns and exact matches
 * @param origin - The origin to check
 * @param allowedOrigins - Array of allowed origins (can include patterns)
 * @returns boolean
 */
export function isOriginAllowedByPattern(origin: string, allowedOrigins: string[]): boolean {
  const domain = extractDomain(origin);
  
  return allowedOrigins.some(allowed => {
    // Exact match
    if (allowed === origin) return true;
    
    // Pattern match for domain only
    const allowedDomain = extractDomain(allowed);
    if (allowedDomain.includes('*')) {
      return matchesDomainPattern(domain, allowedDomain);
    }
    
    return false;
  });
}

/**
 * Environment-based origin patterns
 */
export const ORIGIN_PATTERNS = {
  development: [
    'http://localhost:*',
    'http://127.0.0.1:*',
    'http://0.0.0.0:*',
  ],
  production: [
    'https://*.co.dev',
    'https://*.engindearing.soy',
    'https://*.vercel.app',
  ],
};

/**
 * Get allowed origins based on environment
 */
export function getAllowedOriginsForEnvironment(): string[] {
  const env = process.env.NODE_ENV || 'development';
  const baseOrigins = [
    'http://localhost:3000',
    'https://app.co.dev',
    'https://grammarly-est.engindearing.soy',
    'https://grammarly-2.vercel.app',
  ];
  
  // Add environment-specific patterns
  const envPatterns = ORIGIN_PATTERNS[env as keyof typeof ORIGIN_PATTERNS] || [];
  
  // Add custom origins from environment
  const customOrigins = process.env.ADDITIONAL_ALLOWED_ORIGINS 
    ? process.env.ADDITIONAL_ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : [];
  
  return [...baseOrigins, ...envPatterns, ...customOrigins];
}

// Export as default for better compatibility
export default {
  matchesDomainPattern,
  extractDomain,
  isOriginAllowedByPattern,
  getAllowedOriginsForEnvironment,
  ORIGIN_PATTERNS,
};
