# Quick Fix: PostgreSQL Deployment Error

## The Error You're Seeing

```
ERROR: type "datetime" does not exist
Migration name: 20251108183934_migration
```

## Why This Happens

Your local development uses **SQLite** which has a `DATETIME` type, but your production deployment uses **PostgreSQL** which uses `TIMESTAMP`. The migration files were generated for SQLite and don't work with PostgreSQL.

## ✅ Solution (Choose One)

### Option 1: Use `db push` (EASIEST - RECOMMENDED)

This bypasses migrations and creates tables directly from your schema.

**For Render (already configured in render.yaml):**
```yaml
buildCommand: cd backend && npm install && npx prisma generate && npx prisma db push --skip-generate --accept-data-loss
```

**For Railway:**
- Build Command: `npm install && npx prisma generate && npx prisma db push`

**For Heroku:**
Update your `Procfile`:
```
web: npm start
release: npx prisma db push --accept-data-loss
```

### Option 2: Generate PostgreSQL Migrations (More Control)

If you want proper migration history:

1. **Delete old migrations:**
   ```bash
   rm -rf backend/prisma/migrations
   ```

2. **Set up local PostgreSQL** (or use a temporary one):
   ```bash
   # Update backend/.env temporarily
   DATABASE_URL="postgresql://user:pass@localhost:5432/budget"
   ```

3. **Generate new migrations:**
   ```bash
   cd backend
   npx prisma migrate dev --name init
   ```

4. **Commit and deploy:**
   ```bash
   git add prisma/migrations
   git commit -m "PostgreSQL migrations"
   git push
   ```

5. **Now use `migrate deploy` in your build command**

## 🎯 What I've Updated

1. ✅ **render.yaml** - Already uses `db push` (correct!)
2. ✅ **docs/DEPLOYMENT.md** - Added PostgreSQL migration section
3. ✅ **backend/POSTGRESQL_MIGRATION_FIX.md** - Detailed fix guide
4. ✅ **backend/.env** - Kept SQLite for local dev (with notes)

## 🚀 Next Steps

1. **If using Render:** Just redeploy - it should work now
2. **If using Railway/Heroku:** Update build command to use `db push`
3. **Test the deployment**

## 📝 Important Notes

- **Local dev:** Keep using SQLite (fast, no setup needed)
- **Production:** PostgreSQL with `db push` (simple, works)
- **Future:** If you need migration history, switch to PostgreSQL locally too

## Need Help?

Check these files:
- `backend/POSTGRESQL_MIGRATION_FIX.md` - Detailed explanation
- `docs/DEPLOYMENT.md` - Full deployment guide
- `render.yaml` - Render configuration (already fixed)
