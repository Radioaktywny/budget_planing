-- Fix Production Database Migration Issues
-- Run this script if you get "migrate found failed migrations" error

-- Option 1: Remove the specific failed migration
-- Use this if you want to keep other migration history
DELETE FROM _prisma_migrations 
WHERE migration_name = '20251108183934_migration';

-- Option 2: Clear all migration history (RECOMMENDED for fresh start)
-- Use this if you're switching from migrate to db push
-- TRUNCATE TABLE _prisma_migrations;

-- After running this, your next deployment with "db push" will work
-- because db push doesn't check migration history

-- To run this script:
-- 1. Connect to your Render PostgreSQL database using psql or a GUI tool
-- 2. Copy and paste the appropriate command above
-- 3. Redeploy your backend service
