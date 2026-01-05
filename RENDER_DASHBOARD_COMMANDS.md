# Render Dashboard: Manual Command Configuration

## Important Note

**Once you manually set build/start commands in Render Dashboard, they override the `render.yaml` file!**

This means any changes to `render.yaml` won't take effect until you either:
1. Update the commands manually in the Dashboard, OR
2. Delete the manual overrides in the Dashboard (to use YAML again)

---

## Current Correct Commands

### Build Command
```bash
cd backend && bash scripts/prepare-render-deploy.sh && npm install --include=dev && npx prisma generate && npm run build && npx prisma db push
```

**What it does:**
1. `cd backend` - Navigate to backend directory
2. `bash scripts/prepare-render-deploy.sh` - Remove SQLite migrations
3. `npm install --include=dev` - Install ALL dependencies (including TypeScript types)
4. `npx prisma generate` - Generate Prisma client
5. `npm run build` - Compile TypeScript to JavaScript
6. `npx prisma db push` - Apply schema to PostgreSQL

### Start Command
```bash
cd backend && npm start
```

**What it does:**
1. `cd backend` - Navigate to backend directory
2. `npm start` - Run `node dist/index.js`

---

## How to Update in Render Dashboard

1. **Go to** https://dashboard.render.com
2. **Click** on your `budget-backend` service
3. **Click** "Settings" (left sidebar)
4. **Scroll** to "Build & Deploy" section
5. **Update** "Build Command" with the command above
6. **Update** "Start Command" with the command above
7. **Click** "Save Changes"
8. **Go back** and click "Manual Deploy" → "Deploy latest commit"

---

## Why This Matters

### Without `--include=dev`:
- TypeScript types (@types/*) won't be installed
- Build fails with "Cannot find module 'express'" errors
- Deployment fails

### Without `bash scripts/prepare-render-deploy.sh`:
- SQLite migrations remain in the build
- Prisma tries to run them on PostgreSQL
- Migration fails with "type datetime does not exist"

### Without `npm run build`:
- TypeScript isn't compiled to JavaScript
- Start command fails with "Cannot find module dist/index.js"
- Deployment fails

---

## Alternative: Use YAML Configuration

If you want `render.yaml` to control your deployment:

1. **Go to Render Dashboard** → Your Service → Settings
2. **Find** "Build Command" and "Start Command" fields
3. **Clear** both fields (leave them empty)
4. **Save Changes**
5. **Redeploy**

Now Render will use the commands from `render.yaml` instead.

---

## Quick Reference

| Setting | Location | Priority |
|---------|----------|----------|
| Dashboard Manual Settings | Render Dashboard → Settings | **HIGHEST** (overrides YAML) |
| render.yaml | Git repository | Used only if Dashboard is empty |
| Default | Render's auto-detection | Used if both above are empty |

**Bottom line:** If you set it manually in the Dashboard, that's what Render uses. Period.
