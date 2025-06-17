/**
 * CORS Configuration Test Utility
 * 
 * This utility helps test and validate CORS configuration for multiple origins
 */

import { isOriginAllowed, getAllowedOrigin, ALLOWED_ORIGINS } from '@/lib/cors';
import { matchesDomainPattern, isOriginAllowedByPattern } from '@/lib/domain-validation';

interface CorsTestResult {
  origin: string;
  allowed: boolean;
  resolvedOrigin: string;
  matchedPattern?: string;
}

/**
 * Test origins against the CORS configuration
 */
export function testCorsConfiguration(): CorsTestResult[] {
  const testOrigins = [
    // Exact matches
    'http://localhost:3000',
    'https://app.co.dev',
    'https://grammarly-est.engindearing.soy',
    
    // Pattern matches
    'https://staging.co.dev',
    'https://test.engindearing.soy',
    'https://my-app.vercel.app',
    
    // Should be rejected
    'https://malicious-site.com',
    'http://localhost:8080',
    'https://fake.co.dev.malicious.com',
    
    // Edge cases
    'localhost:3000', // Missing protocol
    'https://co.dev', // Root domain
    'https://app.co.dev.malicious.com', // Subdomain spoofing
  ];

  return testOrigins.map(origin => {
    const allowed = isOriginAllowed(origin);
    const resolvedOrigin = getAllowedOrigin(origin);
    
    // Find which pattern matched (if any)
    let matchedPattern: string | undefined;
    if (allowed && !ALLOWED_ORIGINS.includes(origin)) {
      matchedPattern = ALLOWED_ORIGINS.find(pattern => 
        pattern.includes('*') && isOriginAllowedByPattern(origin, [pattern])
      );
    }

    return {
      origin,
      allowed,
      resolvedOrigin,
      matchedPattern,
    };
  });
}

/**
 * Test domain pattern matching
 */
export function testDomainPatterns(): { pattern: string; domain: string; matches: boolean }[] {
  const tests = [
    { pattern: '*.co.dev', domain: 'app.co.dev', expected: true },
    { pattern: '*.co.dev', domain: 'staging.co.dev', expected: true },
    { pattern: '*.co.dev', domain: 'malicious.com', expected: false },
    { pattern: '*.engindearing.soy', domain: 'grammarly-est.engindearing.soy', expected: true },
    { pattern: 'localhost:*', domain: 'localhost:3000', expected: true },
    { pattern: 'localhost:*', domain: 'localhost:8080', expected: true },
    { pattern: 'localhost:*', domain: 'malicious.com', expected: false },
  ];

  return tests.map(({ pattern, domain, expected }) => ({
    pattern,
    domain,
    matches: matchesDomainPattern(domain, pattern),
    expected,
    correct: matchesDomainPattern(domain, pattern) === expected,
  }));
}

/**
 * Generate test report
 */
export function generateCorsTestReport(): string {
  const corsTests = testCorsConfiguration();
  const patternTests = testDomainPatterns();

  let report = '# CORS Configuration Test Report\n\n';
  
  report += '## Origin Tests\n\n';
  report += '| Origin | Allowed | Resolved Origin | Matched Pattern |\n';
  report += '|--------|---------|-----------------|------------------|\n';
  
  corsTests.forEach(test => {
    report += `| ${test.origin} | ${test.allowed ? '✅' : '❌'} | ${test.resolvedOrigin} | ${test.matchedPattern || 'N/A'} |\n`;
  });

  report += '\n## Pattern Matching Tests\n\n';
  report += '| Pattern | Domain | Matches | Expected | Result |\n';
  report += '|---------|--------|---------|----------|--------|\n';
  
  patternTests.forEach(test => {
    report += `| ${test.pattern} | ${test.domain} | ${test.matches ? '✅' : '❌'} | ${test.expected ? '✅' : '❌'} | ${test.correct ? '✅' : '❌'} |\n`;
  });

  report += '\n## Configuration Summary\n\n';
  report += `- Total allowed origins: ${ALLOWED_ORIGINS.length}\n`;
  report += `- Pattern-based origins: ${ALLOWED_ORIGINS.filter(o => o.includes('*')).length}\n`;
  report += `- Exact match origins: ${ALLOWED_ORIGINS.filter(o => !o.includes('*')).length}\n`;
  
  report += '\n## Allowed Origins List\n\n';
  ALLOWED_ORIGINS.forEach(origin => {
    report += `- ${origin}${origin.includes('*') ? ' (pattern)' : ''}\n`;
  });

  return report;
}

// Export for use in development/testing
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  console.log(generateCorsTestReport());
}
