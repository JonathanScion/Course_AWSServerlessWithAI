# University Management System

A comprehensive full-stack application showcasing various CRUD patterns and entity relationships, built for testing demonstrations.

## Overview

This application manages a university system with 15 different entities, demonstrating:
- Simple CRUD operations
- Parent-child relationships
- Multi-level hierarchies
- Many-to-many relationships
- Complex computed data
- Various UI patterns

## Tech Stack

### Frontend
- React 18
- Material-UI (MUI)
- React Router
- Axios

### Backend
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL

## Entities (15 Total)

### Simple CRUD (3)
1. **Departments** - University departments
2. **Buildings** - Campus buildings
3. **Semesters** - Academic semesters

### Parent-Child Relationships (3)
4. **Professors** - Faculty members (belongs to Department)
5. **Classrooms** - Rooms in buildings (belongs to Building)
6. **Students** - Enrolled students

### Multi-Level Hierarchy (4)
7. **Courses** - Academic courses (belongs to Department)
8. **Course Sections** - Specific course offerings (belongs to Course)
9. **Assignments** - Course assignments (belongs to Section)
10. **Grades** - Student grades (belongs to Assignment & Student)

### Many-to-Many Relationships (2)
11. **Enrollments** - Student-Section registrations
12. **Prerequisites** - Course prerequisites (self-referential)

### Complex/Computed (3)
13. **Class Schedules** - Section meeting times (links Section, Classroom, Time)
14. **Office Hours** - Professor availability
15. **Transcripts** - Student academic records (computed view)

## Project Structure

```
university-management/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Entity CRUD pages
│   │   ├── services/      # API client
│   │   ├── hooks/         # Custom React hooks
│   │   └── App.js
│   └── package.json
├── server/                # Node.js backend
│   ├── src/
│   │   ├── routes/        # REST API routes
│   │   ├── controllers/   # Business logic
│   │   ├── middleware/    # Validation, error handling
│   │   └── server.js
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   └── package.json
└── README.md
```

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

## Setup Instructions

### 1. Database Setup

Create a PostgreSQL database:

```bash
# Using psql
psql -U postgres
CREATE DATABASE university_management;
\q
```

Or using pgAdmin or any PostgreSQL client.

### 2. Server Setup

```bash
cd server

# Install dependencies
npm install

# Set up environment variables
# Create .env file with:
DATABASE_URL="postgresql://postgres:password@localhost:5432/university_management"
PORT=5000

# Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate dev --name init

# Start the server
npm run dev
```

The server will run on http://localhost:5000

### 3. Client Setup

```bash
cd client

# Install dependencies
npm install

# Start the development server
npm start
```

The client will run on http://localhost:3000

## API Endpoints

All endpoints follow REST conventions:

| Entity | Endpoints |
|--------|-----------|
| Departments | GET/POST `/api/departments`, GET/PUT/DELETE `/api/departments/:id` |
| Buildings | GET/POST `/api/buildings`, GET/PUT/DELETE `/api/buildings/:id` |
| Semesters | GET/POST `/api/semesters`, GET/PUT/DELETE `/api/semesters/:id` |
| Professors | GET/POST `/api/professors`, GET/PUT/DELETE `/api/professors/:id` |
| Classrooms | GET/POST `/api/classrooms`, GET/PUT/DELETE `/api/classrooms/:id` |
| Students | GET/POST `/api/students`, GET/PUT/DELETE `/api/students/:id` |
| Courses | GET/POST `/api/courses`, GET/PUT/DELETE `/api/courses/:id` |
| Sections | GET/POST `/api/sections`, GET/PUT/DELETE `/api/sections/:id` |
| Assignments | GET/POST `/api/assignments`, GET/PUT/DELETE `/api/assignments/:id` |
| Grades | GET/POST `/api/grades`, GET/PUT/DELETE `/api/grades/:id` |
| Enrollments | GET/POST `/api/enrollments`, GET/PUT/DELETE `/api/enrollments/:id` |
| Prerequisites | GET/POST `/api/prerequisites`, GET/PUT/DELETE `/api/prerequisites/:id` |
| Schedules | GET/POST `/api/schedules`, GET/PUT/DELETE `/api/schedules/:id` |
| Office Hours | GET/POST `/api/office-hours`, GET/PUT/DELETE `/api/office-hours/:id` |
| Transcripts | GET `/api/transcripts/student/:studentId` (read-only, computed) |

## CRUD Pattern Examples

### Simple CRUD
**Departments**: Basic create, read, update, delete with form validation

### Parent-Child
**Professors**: Requires selecting a department via dropdown

### Multi-Level Hierarchy
**Assignments**: Create assignment → select course section → section belongs to course

### Many-to-Many
**Enrollments**: Join students with course sections, shows both perspectives

### Self-Referential
**Prerequisites**: Courses can have other courses as prerequisites

### Computed Data
**Transcripts**: Read-only view aggregating all student grades, calculating GPA

## Development

### Database Management

```bash
# View database in Prisma Studio
cd server
npx prisma studio

# Create a new migration after schema changes
npx prisma migrate dev --name migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Useful Commands

```bash
# Server
npm run dev          # Development with nodemon
npm start            # Production
npm run migrate      # Run migrations
npm run seed         # Seed sample data

# Client
npm start            # Development server
npm run build        # Production build
npm test             # Run tests
```

## Testing (To Be Added)

This application is designed to showcase various testing scenarios:

- **Unit Tests**: Component testing, service layer testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full user workflows
- **Validation Tests**: Business rule enforcement
- **Authorization Tests**: Role-based access (when auth is added)

## License

MIT

## Purpose

This is a demonstration application built to showcase comprehensive CRUD patterns and entity relationships for testing purposes.
