# Quick Database Setup Instructions

## Step 1: Check Supabase Database Status
1. Go to [https://supabase.com](https://supabase.com)
2. Sign in and go to your project `your-project-id`
3. Check if you see any "Database Paused" messages
4. If paused, click "Resume" or "Unpause"

## Step 2: Create Tables Manually
1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Paste this SQL and click **Run**:

```sql
-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Create unique index on email
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- Create Document table
CREATE TABLE IF NOT EXISTS "Document" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint (with proper syntax)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Document_authorId_fkey' 
        AND table_name = 'Document'
    ) THEN
        ALTER TABLE "Document" 
        ADD CONSTRAINT "Document_authorId_fkey" 
        FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- Create trigger to auto-update updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_document_updated_at ON "Document";
CREATE TRIGGER update_document_updated_at BEFORE UPDATE ON "Document"
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify setup
SELECT 'Tables created successfully!' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('User', 'Document');
```

## Step 3: Verify in Table Editor
After running the SQL:
1. Go to **Table Editor** in Supabase
2. You should see both **User** and **Document** tables
3. The tables should be empty but ready to use

## Step 4: Test the Application
Once tables are created:
1. Your app should deploy successfully
2. Google sign-in should create users automatically
3. Document creation should work properly

Let me know when you've completed these steps!
