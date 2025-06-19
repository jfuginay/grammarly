# Manual Database Setup Guide

Since we're experiencing connection issues with the Prisma CLI, please follow these steps to manually set up your database tables in Supabase:

## Step 1: Access Supabase Dashboard

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Navigate to your project: `xelfhhaoukaqwedslngb`

## Step 2: Open SQL Editor

1. In your Supabase project dashboard, click on **"SQL Editor"** in the left sidebar
2. Click **"New Query"**

## Step 3: Run the Database Setup SQL

Copy and paste the following SQL code into the SQL Editor and click **"Run"**:

```sql
-- Migration SQL for Supabase Database
-- This creates the required tables for your Grammarly app

-- CreateTable: User
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Document
CREATE TABLE IF NOT EXISTS "Document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique email constraint
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- AddForeignKey: Link documents to users
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Document_authorId_fkey'
    ) THEN
        ALTER TABLE "Document" 
        ADD CONSTRAINT "Document_authorId_fkey" 
        FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- Verify tables were created
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('User', 'Document')
ORDER BY table_name, ordinal_position;
```

## Step 4: Verify Tables Were Created

After running the SQL, you should see output showing the tables and columns that were created:

- **User table** with columns: id, email, createdAt
- **Document table** with columns: id, title, content, createdAt, updatedAt, authorId

## Step 5: Test the Setup

You can test that everything is working by running this test query:

```sql
-- Test insert a user
INSERT INTO "User" (id, email) VALUES ('test-user-123', 'test@example.com');

-- Test insert a document
INSERT INTO "Document" (id, title, content, "authorId") 
VALUES ('test-doc-123', 'Test Document', 'This is a test document', 'test-user-123');

-- Test query to verify relationships work
SELECT 
    u.email,
    d.title,
    d.content,
    d."createdAt"
FROM "User" u
JOIN "Document" d ON u.id = d."authorId"
WHERE u.id = 'test-user-123';

-- Clean up test data
DELETE FROM "Document" WHERE id = 'test-doc-123';
DELETE FROM "User" WHERE id = 'test-user-123';
```

## Step 6: Update Environment Variables

Once the tables are created, make sure your Vercel environment variables are properly set:

### Required Environment Variables:
- `DATABASE_URL`: Your Supabase database URL
- `DIRECT_URL`: Your Supabase direct connection URL (if using connection pooling)
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `OPENAI_API_KEY`: Your OpenAI API key

## Step 7: Test Your Application

After setting up the database:

1. Deploy your application to Vercel (should work now with the previous fixes)
2. Try signing in with Google - it should automatically create a user record
3. Try creating a document - it should be stored in the Document table

## Troubleshooting

If you encounter issues:

1. **Tables not found**: Make sure you ran the SQL in the **public** schema
2. **Permission errors**: Check that your database user has the right permissions
3. **Connection issues**: Verify your connection strings in the environment variables
4. **Foreign key errors**: Make sure the User table exists before creating Document table

## Next Steps

Once the database is set up:
- ✅ Users can sign in with Google and be automatically created in the database
- ✅ Documents can be created and linked to users
- ✅ Your application will have full CRUD functionality

The database setup is complete once you see the tables listed in your Supabase dashboard under **"Table Editor"**.
