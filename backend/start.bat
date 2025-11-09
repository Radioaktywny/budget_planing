@echo off
echo Starting Home Budget Manager Backend...
echo.

REM Check if node_modules exists
if not exist node_modules (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Check if Prisma Client is generated
if not exist node_modules\.prisma\client (
    echo Generating Prisma Client...
    call npm run prisma:generate
    echo.
)

REM Check if database exists
if not exist dev.db (
    echo Database not found. Running migrations...
    call npm run prisma:migrate
    echo.
    echo Seeding database with sample data...
    call npm run prisma:seed
    echo.
)

echo Starting development server...
echo Backend will be available at http://localhost:3001
echo.
npm run dev
