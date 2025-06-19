# Deployment Setup Guide

## Environment Variables Required for Vercel Deployment

To deploy this application to Vercel, you need to configure the following environment variables in your Vercel project dashboard:

### Required Environment Variables

1. **DATABASE_URL** - PostgreSQL database connection string
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xelfhhaoukaqwedslngb.supabase.co:5432/postgres
   ```

2. **NEXT_PUBLIC_SUPABASE_URL** - Supabase project URL
   ```
   https://xelfhhaoukaqwedslngb.supabase.co
   ```

3. **NEXT_PUBLIC_SUPABASE_ANON_KEY** - Supabase anonymous key
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlbGZoaGFvdWthcXdlZHNsbmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAyODg3NTMsImV4cCI6MjA2NTg2NDc1M30.rBkgIIY8KUACEcYYUayyIw0GivI2wE4CDwzEl03R34A
   ```

4. **OPENAI_API_KEY** - OpenAI API key for text correction features
   ```
   sk-proj-[YOUR-OPENAI-API-KEY]
   ```

### Optional Environment Variables (for development)

- **DIRECT_URL** - Direct database connection URL (for connection pooling)
- **NEXT_PUBLIC_SITE_URL** - Site URL for development (defaults to production URL)

## How to Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each environment variable with its corresponding value
4. Set the environment to "Production", "Preview", and "Development" as needed
5. Save and redeploy your application

## Database Setup

The application uses Prisma as the ORM. The database schema will be automatically generated during the build process.

### For Production Deployment:
- Make sure your database is properly set up in Supabase
- The build process will generate the Prisma client automatically
- No database migrations are run automatically in production

### For Development:
- Run `npm run db:push` to push schema changes to your database
- The `DIRECT_URL` is used for connection pooling in development

## Build Process

The production build process:
1. Installs dependencies with `pnpm install`
2. Generates Prisma client with `prisma generate`
3. Builds the Next.js application with `next build`

## Troubleshooting

### Common Issues:

1. **"Environment variable not found: DIRECT_URL"**
   - This error has been resolved by removing the `DIRECT_URL` requirement from the production schema
   - The `DIRECT_URL` is only needed for local development with connection pooling

2. **Database connection issues**
   - Verify your `DATABASE_URL` is correct
   - Ensure your Supabase database is accessible
   - Check that the database user has proper permissions

3. **Build failures**
   - Ensure all required environment variables are set in Vercel
   - Check that your OpenAI API key is valid and has sufficient credits
