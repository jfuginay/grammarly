# Security Guidelines

## Environment Variables

This project uses environment variables to manage sensitive data like API keys and database credentials. 

### Important Security Rules:

1. **Never commit secrets to version control**
   - The `.env` file is in `.gitignore` for a reason
   - Always use placeholder values in documentation
   - Double-check before committing any file that might contain secrets

2. **Environment Files**
   - `.env` - Your local environment variables (NEVER commit this)
   - `.env.example` - Template with placeholder values (safe to commit)

3. **Production Deployment**
   - Set environment variables in your deployment platform (Vercel, Netlify, etc.)
   - Never hardcode secrets in source code
   - Use platform-specific secret management systems

### Setting Up Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your actual values in `.env`

3. For production, set variables in your deployment platform's dashboard

### Required Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_URL` - Direct database connection (optional for pooling)
- `OPENAI_API_KEY` - OpenAI API Key
- `NEXT_PUBLIC_SITE_URL` - Your site URL (optional)

### If You Accidentally Commit Secrets

1. **Immediately rotate/regenerate** the exposed credentials
2. Remove the secrets from git history
3. Update the credentials in all environments
4. Review and improve your security practices

## Contact

If you discover a security vulnerability, please report it responsibly.
