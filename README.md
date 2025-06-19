# Grammarly Clone - Multi-Origin Grammar Assistant

A Next.js-based grammar and spell-checking application with comprehensive CORS support for multiple origins and domains.

## Features

- **AI-Powered Grammar Checking** - OpenAI integration for intelligent text correction
- **Real-time Spell Checking** - Instant feedback on spelling errors
- **Floating Suggestions** - Interactive hover-based corrections
- **Multi-Origin Support** - Works across different domains and subdomains
- **Responsive Design** - Works on desktop and mobile devices

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

## Troubleshooting

### Common CORS Issues

1. **"CORS Error" in browser**:
   - Check if your origin is in the allowed list
   - Verify HTTPS vs HTTP protocol matching

2. **Preflight request failed**:
   - Ensure OPTIONS method is handled
   - Check that all required headers are allowed

3. **Credentials blocked**:
   - Verify `Access-Control-Allow-Credentials: true` is set
   - Ensure origin is explicitly allowed (not wildcard)

## Learn More

To learn more about the technologies used in this template, check out the following resources:

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Context API](https://reactjs.org/docs/context.html)
