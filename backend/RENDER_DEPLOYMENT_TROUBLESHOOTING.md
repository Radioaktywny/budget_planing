# Render Deployment Troubleshooting

## Problem: Failed Migrations Error

### Error Message
```
Error: P3009
migrate found failed migrations in the target database, new migrations will not be applied
The `20251108183934_migration` migration started at 2025-11-20 21:58:33.100177 UTC failed
```

### What Happened
1. A previous deployment tried to run SQLite migrations on PostgreSQL
2. The migration failed (because SQLite uses `DATETIME`, PostgreSQL uses `TIMESTAMP`)
3. Prisma recorded this failure in the `_prisma_migrations` table
4. Now Prisma refuses to run any new migrations until the failed one is resolved

### Solution Steps

#### Step 1: Clean Up Failed Migration

**Option A: Using Render Shell (Easiest)**

1. Go to Render Dashboard
2. Navigate to your `budget-backend` service
3. Click "Shell" tab
4. Run these commands:
   ```bash
   cd backend
   npx prisma migrate resolve --rolled-back 20251108183934_migration
   ```

**Option B: Direct Database Access**

1. Go to Render Dashboard → Your PostgreSQL Database
2. Click "Connect" → Copy the External Database URL
3. In your local terminal:
   ```bash
   # Install psql if you don't have it (Windows: use WSL or download PostgreSQL)
   psql "your-database-url-here"
   
   # Once connected, run:
   TRUNCATE TABLE _prisma_migrations;
   
   # Exit
   \q
   ```

**Option C: Reset Database (Nuclear Option - loses all data)**

1. Go to Render Dashboard → Your Database
2. Delete the database
3. Create a new one with the same name
4. The DATABASE_URL will update automatically
5. Redeploy your backend service

#### Step 2: Verify render.yaml Configuration

Make sure your `render.yaml` uses `db push` instead of `migrate deploy`:

```yaml
buildCommand: cd backend && npm install && npx prisma generate && npx prisma db push --skip-generate --accept-data-loss
```

✅ This is already correct in your current render.yaml

#### Step 3: Redeploy

1. Commit any changes (if you made any)
2. Push to GitHub
3. Render will auto-deploy
4. Or manually trigger a deploy in Render Dashboard

### Why Use `db push` Instead of `migrate`?

| Feature | `migrate deploy` | `db push` |
|---------|------------------|-----------|
| Migration history | ✅ Tracked | ❌ Not tracked |
| Works with mixed DB types | ❌ No (SQLite ≠ PostgreSQL) | ✅ Yes |
| Production recommended | ✅ Usually | ⚠️ For simple cases |
| Handles schema drift | ❌ Strict | ✅ Flexible |
| Best for | Large teams, complex schemas | Solo dev, prototyping |

For your use case (local SQLite + production PostgreSQL), `db push` is the right choice.

### Alternative: Use PostgreSQL Everywhere

If you want proper migration history:

1. **Install PostgreSQL locally**
2. **Update local `.env`:**
   ```env
   DATABASE_URL="postgresql://localhost:5432/budget_dev"
   ```
3. **Delete old migrations:**
   ```bash
   rm -rf backend/prisma/migrations
   ```
4. **Generate new migrations:**
   ```bash
   cd backend
   npx prisma migrate dev --name init
   ```
5. **Update render.yaml to use migrate:**
   ```yaml
   buildCommand: cd backend && npm install && npx prisma generate && npx prisma migrate deploy
   ```
6. **Commit and deploy**

## Other Common Render Issues

### Issue: Build Timeout

**Symptom:** Build takes too long and times out

**Solution:**
- Render free tier has a 15-minute build timeout
- Optimize your build command
- Consider upgrading to a paid plan

### Issue: Environment Variables Not Set

**Symptom:** App crashes with "JWT_SECRET is not defined" or similar

**Solution:**
1. Go to Render Dashboard → Your Service → Environment
2. Add missing variables
3. Click "Save Changes"
4. Redeploy

### Issue: Database Connection Failed

**Symptom:** `Error: Can't reach database server`

**Solution:**
1. Check that DATABASE_URL is set correctly
2. Verify database is in the same region as your service
3. Check database is not suspended (free tier sleeps after inactivity)

### Issue: CORS Errors

**Symptom:** Frontend can't connect to backend

**Solution:**
1. Update `ALLOWED_ORIGINS` in backend environment variables
2. Include your Vercel frontend URL
3. Example: `https://your-app.vercel.app,https://your-app-git-main.vercel.app`

## Checking Logs

**View logs in Render:**
1. Go to your service
2. Click "Logs" tab
3. Look for errors during build or runtime

**Common log patterns:**
- `Prisma schema loaded` ✅ Good
- `Database connection established` ✅ Good
- `Error: P3009` ❌ Failed migration issue
- `Error: P1001` ❌ Can't reach database
- `Error: P1012` ❌ Invalid DATABASE_URL

## Need More Help?

1. Check `DEPLOYMENT_QUICK_FIX.md` in project root
2. Check `backend/POSTGRESQL_MIGRATION_FIX.md`
3. Check `docs/DEPLOYMENT.md` for full deployment guide
4. Check Render's documentation: https://render.com/docs
5. Check Prisma's migration docs: https://www.prisma.io/docs/guides/migrate
