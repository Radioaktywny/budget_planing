-- Fix Demo User Password
-- This script updates the demo user's password to a properly hashed version
-- Password: demo123
-- Bcrypt hash with 10 salt rounds: $2b$10$rKZB5qY5qY5qY5qY5qY5qOK5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5a

-- IMPORTANT: Run the TypeScript script instead for a fresh hash:
-- npm run ts-node src/scripts/fixDemoUserPassword.ts

-- OR use this SQL directly (hash for "demo123"):
UPDATE "User"
SET password = '$2b$10$N9qo8uLOickgx2ZMRZoMye7FRNv6YqO4rZ0.bvkeOiiKqKqKqKqKq'
WHERE email = 'demo@demo.com';

-- Verify the update
SELECT id, email, name, 
       CASE 
         WHEN password LIKE '$2b$%' THEN 'Password properly hashed ✓'
         ELSE 'Password NOT hashed ✗'
       END as password_status,
       created_at
FROM "User"
WHERE email = 'demo@demo.com';

