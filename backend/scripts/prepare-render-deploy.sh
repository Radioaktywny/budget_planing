#!/bin/bash
# Prepare for Render deployment
# This script removes SQLite migrations before deploying to PostgreSQL

echo "🧹 Cleaning up SQLite migrations for PostgreSQL deployment..."

# Remove migrations folder if it exists
if [ -d "prisma/migrations" ]; then
    rm -rf prisma/migrations
    echo "✅ Removed prisma/migrations folder"
else
    echo "ℹ️  No migrations folder found"
fi

echo "✅ Ready for PostgreSQL deployment with db push"
