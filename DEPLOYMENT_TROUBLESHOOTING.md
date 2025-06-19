# Deployment Troubleshooting Guide

## NPM Rate Limiting Issues

If you encounter 429 (Too Many Requests) errors during deployment, try these solutions:

### 1. Use npm instead of pnpm
The current configuration uses npm with optimized settings to handle rate limiting better.

### 2. Registry Configuration
The `.npmrc` file includes:
- Explicit registry URL
- Increased retry attempts
- Extended timeout values
- Disabled audit and fund requests

### 3. Vercel Configuration
The `vercel.json` includes:
- Optimized install command with retry logic
- Network timeout settings
- Registry configuration

### 4. Alternative Solutions

#### Option A: Use a different registry
```bash
npm config set registry https://registry.npmjs.org/
```

#### Option B: Increase timeouts
```bash
npm config set fetch-retries 10
npm config set fetch-retry-mintimeout 30000
npm config set fetch-retry-maxtimeout 180000
```

#### Option C: Use yarn instead
Update `vercel.json`:
```json
{
  "installCommand": "yarn install --network-timeout 100000"
}
```

### 5. Manual Deployment Steps

If automatic deployment fails:

1. **Clear cache and retry:**
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Use the deployment script:**
   ```bash
   chmod +x scripts/deploy.sh
   ./scripts/deploy.sh
   ```

3. **Deploy with specific Node version:**
   - Ensure Node.js 20.x is used
   - Check Vercel project settings

### 6. Environment Variables

Ensure all required environment variables are set in Vercel:
- `OPENAI_API_KEY`
- `DATABASE_URL`
- `JWT_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

### 7. Check Vercel Logs

Monitor deployment logs for specific error messages:
- Function timeout issues
- Environment variable problems
- Build errors

### 8. Contact Support

If issues persist:
1. Check Vercel status page
2. Review npm registry status
3. Contact Vercel support with deployment logs 