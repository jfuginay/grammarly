# Deployment Configuration for Multiple Origins

This application is configured to handle requests from multiple origins including custom domains and development environments.

## Supported Origins

### Production Domains
- `https://app.co.dev` - Primary production domain
- `https://grammarly-est.engindearing.soy` - Secondary production domain
- `https://grammarly-2.vercel.app` - Vercel deployment domain

### Development Domains
- `http://localhost:3000` - Local development
- `http://localhost:3001` - Alternative local port
- `http://127.0.0.1:*` - IP-based local access
- `http://0.0.0.0:*` - Network-accessible local development

### Pattern-Based Origins
The application also supports wildcard patterns for flexible domain matching:
- `*.co.dev` - Any subdomain of co.dev
- `*.engindearing.soy` - Any subdomain of engindearing.soy
- `*.vercel.app` - Any Vercel deployment

## Environment Variables

### ADDITIONAL_ALLOWED_ORIGINS
Add custom domains without code changes:
```bash
ADDITIONAL_ALLOWED_ORIGINS=https://custom-domain.com,https://another-domain.org
```

### NODE_ENV
Controls which origin patterns are active:
- `development` - Includes localhost patterns
- `production` - Includes production-only patterns

## CORS Configuration

The application implements comprehensive CORS support:

### Headers Set
- `Access-Control-Allow-Origin` - Dynamic based on request origin
- `Access-Control-Allow-Methods` - GET, POST, PUT, DELETE, OPTIONS
- `Access-Control-Allow-Headers` - Content-Type, Authorization, X-Requested-With, Accept, Origin
- `Access-Control-Allow-Credentials` - true
- `Access-Control-Max-Age` - 86400 (24 hours)

### Implementation Points
1. **Middleware** (`src/middleware.ts`) - Handles all requests
2. **API Routes** - Individual route-level CORS handling
3. **Next.js Config** - Static header configuration

## Security Features

### Origin Validation
- Exact domain matching
- Wildcard pattern matching
- Environment-based restrictions
- Custom domain support via environment variables

### Request Filtering
- Preflight request handling
- Method validation
- Header validation
- Credential support

## Deployment Instructions

### Vercel
1. Set environment variables in Vercel dashboard
2. Deploy with automatic domain detection
3. Custom domains automatically supported via patterns

### Custom Deployment
1. Set `ADDITIONAL_ALLOWED_ORIGINS` environment variable
2. Configure DNS/proxy to forward requests
3. Ensure HTTPS for production domains

### Local Development
1. Run `npm run dev` or `pnpm dev`
2. Access via any supported localhost pattern
3. Test CORS with different origins using browser dev tools

## Testing CORS

### Browser Console
```javascript
// Test API access from different origins
fetch('https://your-domain.com/api/hello', {
  method: 'GET',
  credentials: 'include'
})
.then(response => response.json())
.then(data => console.log(data));
```

### cURL
```bash
# Test preflight request
curl -X OPTIONS \
  -H "Origin: https://app.co.dev" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  https://your-domain.com/api/correct-text

# Test actual request
curl -X POST \
  -H "Origin: https://app.co.dev" \
  -H "Content-Type: application/json" \
  -d '{"text":"test"}' \
  https://your-domain.com/api/correct-text
```

## Troubleshooting

### Common Issues
1. **CORS Error** - Check if origin is in allowed list
2. **Preflight Failed** - Verify OPTIONS method handling
3. **Credentials Blocked** - Ensure HTTPS for production

### Debug Steps
1. Check browser network tab for CORS headers
2. Verify environment variables are set
3. Test with curl to isolate client vs server issues
4. Check middleware execution order
