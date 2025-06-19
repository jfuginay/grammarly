# Grammarly Clone - Multi-Origin Grammar Assistant

A Next.js-based grammar and spell-checking application with comprehensive CORS support for multiple origins and domains.

## Features

- **AI-Powered Grammar Checking** - OpenAI integration for intelligent text correction
- **Real-time Spell Checking** - Instant feedback on spelling errors
- **Floating Suggestions** - Interactive hover-based corrections
- **Multi-Origin Support** - Works across different domains and subdomains
- **Responsive Design** - Works on desktop and mobile devices
- **Google Authentication** - Secure login with Auth0 and Google OAuth

## Authentication Setup

This application uses Auth0 with Google OAuth for authentication. To set it up:

1. Create an Auth0 account at [auth0.com](https://auth0.com/)
2. Set up a new application in Auth0 and configure Google as a social connection
3. Configure your Auth0 application with the following settings:
   - Allowed Callback URLs: `http://localhost:3000/api/auth/callback` (development) and your production URLs
   - Allowed Logout URLs: `http://localhost:3000` (development) and your production URLs
4. Update your `.env.local` file with the following Auth0 environment variables:
   ```
   AUTH0_SECRET=your-long-random-string-here
   AUTH0_BASE_URL=http://localhost:3000
   AUTH0_ISSUER_BASE_URL=https://your-tenant.region.auth0.com
   AUTH0_CLIENT_ID=your-client-id
   AUTH0_CLIENT_SECRET=your-client-secret
   AUTH0_SCOPE="openid profile email"
   AUTH0_AUDIENCE=https://your-tenant.region.auth0.com/api/v2/
   ```

## Supported Origins

This application can handle requests from multiple origins:

### Production Domains
- `https://app.co.dev`
- `https://grammarly-est.engindearing.soy`
- `https://grammarly-2.vercel.app`

### Development Domains
- `http://localhost:3000`
- `http://localhost:3001`
- `http://127.0.0.1:*`

### Pattern-Based Origins
- `*.co.dev` - Any subdomain of co.dev
- `*.engindearing.soy` - Any subdomain of engindearing.soy
- `*.vercel.app` - Any Vercel deployment

## Quick Start

### Development

```bash
# Clone the repository
git clone <repository-url>
cd grammarly-2

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
pnpm dev
```

### Environment Variables

```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL="your_database_url_here"

# Optional - Add custom domains
ADDITIONAL_ALLOWED_ORIGINS=https://custom-domain.com,https://another-domain.org
```

## CORS Configuration

The application includes comprehensive CORS support:

### Testing CORS

1. **Browser Console Testing**:
   ```javascript
   // Quick test
   corsQuickTest()
   
   // Advanced testing
   window.testCors.testBasicCors()
   window.testCors.getTestReport()
   ```

2. **API Testing**:
   ```bash
   # Test CORS endpoint
   curl -H "Origin: https://app.co.dev" http://localhost:3000/api/cors-test
   ```

3. **Get Test Report**:
   ```bash
   curl "http://localhost:3000/api/cors-test?report=true"
   ```

### Adding New Origins

1. **Environment Variable** (Recommended):
   ```bash
   ADDITIONAL_ALLOWED_ORIGINS=https://new-domain.com,https://staging.example.org
   ```

2. **Code Configuration**:
   Edit `src/lib/domain-validation.ts` to add new patterns or exact origins.

## API Endpoints

### `/api/correct-text`
- **Method**: POST
- **Body**: `{ "text": "Your text to check" }`
- **Response**: Array of suggestions with corrections

### `/api/cors-test`
- **Method**: GET
- **Query**: `?report=true` for full configuration report
- **Response**: CORS test results and configuration

## Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically

### Custom Deployment
1. Build the application: `pnpm build`
2. Set environment variables
3. Start the server: `pnpm start`

## Architecture

### CORS Implementation
- **Middleware** (`src/middleware.ts`) - Global CORS handling
- **API Routes** - Individual endpoint CORS configuration
- **Domain Validation** (`src/lib/domain-validation.ts`) - Pattern-based origin matching
- **CORS Utilities** (`src/lib/cors.ts`) - Centralized CORS logic

### Key Components
- **FloatingSuggestion** - Interactive correction popups
- **Dashboard** - Main text editing interface
- **AuthContext** - User authentication management

## Testing

### CORS Testing
```bash
# Test specific origin
curl -H "Origin: https://app.co.dev" http://localhost:3000/api/cors-test
```

### Manual Testing
1. Open browser console on any supported domain
2. Run `corsQuickTest()` for comprehensive CORS validation
3. Check network tab for CORS headers

## Troubleshooting

### Common CORS Issues

1. **"CORS Error" in browser**:
   - Check if your origin is in the allowed list
   - Verify HTTPS vs HTTP protocol matching
   - Test with the CORS test endpoint

2. **Preflight request failed**:
   - Ensure OPTIONS method is handled
   - Check that all required headers are allowed

3. **Credentials blocked**:
   - Verify `Access-Control-Allow-Credentials: true` is set
   - Ensure origin is explicitly allowed (not wildcard)

### Debug Tools

1. **Browser Console**:
   ```javascript
   corsQuickTest() // Quick CORS validation
   window.testCors.getTestReport() // Detailed report
   ```

2. **API Testing**:
   ```bash
   curl -v -H "Origin: your-origin" http://localhost:3000/api/cors-test
   ```

## Learn More

To learn more about the technologies used in this template, check out the following resources:

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Context API](https://reactjs.org/docs/context.html)
