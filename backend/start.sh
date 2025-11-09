#!/bin/bash
echo "Starting Home Budget Manager Backend..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

# Check if Prisma Client is generated
if [ ! -d "node_modules/.prisma/client" ]; then
    echo "Generating Prisma Client..."
    npm run prisma:generate
    echo ""
fi

# Check if database exists
if [ ! -f "dev.db" ]; then
    echo "Database not found. Running migrations..."
    npm run prisma:migrate
    echo ""
    echo "Seeding database with sample data..."
    npm run prisma:seed
    echo ""
fi

echo "Starting development server..."
echo "Backend will be available at http://localhost:3001"
echo ""
npm run dev
