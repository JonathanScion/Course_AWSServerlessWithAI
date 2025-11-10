# University Management System - Setup Guide

Complete step-by-step guide to get the application running locally.

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** (comes with Node.js)
- **Git** (optional, for cloning)

### Verify Installations

```bash
node --version  # Should be v18 or higher
npm --version   # Should be 8 or higher
psql --version  # Should be PostgreSQL 14 or higher
```

## Step 1: Database Setup

### Option A: Using psql (Command Line)

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE university_management;

# Verify database was created
\l

# Exit psql
\q
```

### Option B: Using pgAdmin (GUI)

1. Open pgAdmin
2. Right-click on "Databases"
3. Select "Create" → "Database"
4. Name: `university_management`
5. Click "Save"

### Option C: Using Windows PowerShell

```powershell
# Connect and create database in one command
& "C:\Program Files\PostgreSQL\14\bin\psql.exe" -U postgres -c "CREATE DATABASE university_management;"
```

## Step 2: Server Setup

```bash
# Navigate to the server directory
cd university-management/server

# Install dependencies
npm install

# Create .env file
# Copy .env.example to .env
cp .env.example .env

# Edit .env file with your database credentials
# For Windows, use: copy .env.example .env
```

### Configure .env File

Open `server/.env` and update with your PostgreSQL credentials:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/university_management"
PORT=5000
NODE_ENV=development
```

Replace `YOUR_PASSWORD` with your PostgreSQL password (default is often `postgres`).

### Initialize Database Schema

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations to create database tables
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view the database
npx prisma studio
```

### Seed Sample Data

```bash
# Populate database with sample data
npm run seed
```

This creates sample data:
- 3 Departments (CS, Math, English)
- 2 Buildings
- 2 Semesters
- 2 Professors
- 2 Classrooms
- 2 Students
- 3 Courses
- Course prerequisites
- 2 Course sections
- Class schedules
- Office hours
- Student enrollments
- 2 Assignments
- 1 Grade

### Start the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The server will start on http://localhost:5000

Verify it's running by visiting http://localhost:5000/health in your browser.

## Step 3: Client Setup

Open a **new terminal window** (keep the server running).

```bash
# Navigate to the client directory
cd university-management/client

# Install dependencies
npm install

# Start the development server
npm start
```

The client will start on http://localhost:3000 and should automatically open in your browser.

## Verification

### Check Server is Running

Visit http://localhost:5000/api in your browser. You should see:

```json
{
  "message": "University Management System API",
  "version": "1.0.0",
  "endpoints": { ... }
}
```

### Check Client is Running

Visit http://localhost:3000 in your browser. You should see the University Management System home page.

### Test CRUD Operations

1. Click on "Departments" from the home page
2. You should see the 3 seeded departments
3. Click "Add Department" to test create functionality
4. Try editing and deleting (be careful not to delete departments with dependent data)

## Common Issues and Solutions

### Issue: "Database does not exist"

**Solution:**
```bash
# Ensure database is created
psql -U postgres -c "CREATE DATABASE university_management;"
```

### Issue: "Password authentication failed"

**Solution:**
- Check your `.env` file has the correct PostgreSQL password
- Verify PostgreSQL is running:
  - Windows: Services → PostgreSQL should be "Running"
  - Mac: `brew services list`
  - Linux: `sudo systemctl status postgresql`

### Issue: "Port 5000 already in use"

**Solution:**
- Change the port in `server/.env` to a different number (e.g., 5001)
- Or kill the process using port 5000:
  - Windows: `netstat -ano | findstr :5000` then `taskkill /PID <pid> /F`
  - Mac/Linux: `lsof -ti:5000 | xargs kill`

### Issue: "Module not found" errors

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Windows PowerShell:
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
```

### Issue: Prisma migration errors

**Solution:**
```bash
# Reset the database (WARNING: This deletes all data!)
npx prisma migrate reset

# Then re-seed
npm run seed
```

### Issue: CORS errors in browser console

**Solution:**
- Ensure the server is running on port 5000
- Check that the client's package.json has `"proxy": "http://localhost:5000"`
- Clear browser cache and reload

## Development Workflow

### Making Schema Changes

1. Edit `server/prisma/schema.prisma`
2. Create a migration:
   ```bash
   npx prisma migrate dev --name your_migration_name
   ```
3. Restart the server

### Viewing the Database

```bash
# Open Prisma Studio (GUI for database)
cd server
npx prisma studio
```

This opens a web interface at http://localhost:5555 where you can view and edit data.

### Resetting Everything

If you want to start fresh:

```bash
# Server
cd server
npx prisma migrate reset  # Drops all tables and re-runs migrations
npm run seed              # Re-populate with sample data

# Client (usually not needed, but to clear cache)
cd client
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

- Explore all 15 entity pages
- Try different CRUD operations
- View a student transcript (use student ID 1 or 2)
- Add more sample data through the UI
- Review the codebase structure in the main README.md

## Architecture Quick Reference

```
Server (http://localhost:5000)
├── /api/departments
├── /api/buildings
├── /api/semesters
├── /api/professors
├── /api/classrooms
├── /api/students
├── /api/courses
├── /api/sections
├── /api/assignments
├── /api/grades
├── /api/enrollments
├── /api/prerequisites
├── /api/schedules
├── /api/office-hours
└── /api/transcripts/student/:id

Client (http://localhost:3000)
├── Home page with all entity links
├── 14 CRUD pages with create/edit/delete
└── 1 Transcripts page (read-only)
```

## Support

If you encounter issues not covered here:

1. Check the console output for error messages
2. Review the main README.md for architecture details
3. Check PostgreSQL logs for database errors
4. Verify all prerequisites are correctly installed

## Ready to Test!

Once both server and client are running:
- Server: http://localhost:5000
- Client: http://localhost:3000

Start by exploring the home page and trying different entity pages to see the various CRUD patterns in action!
