# University Management System - Server

Node.js + Express + Prisma backend API for the University Management System.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma Client and run migrations
npx prisma generate
npx prisma migrate dev --name init

# Seed sample data
npm run seed

# Start development server
npm run dev
```

Server runs on http://localhost:5000

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run migrate` - Run Prisma migrations
- `npm run migrate:reset` - Reset database (WARNING: Deletes all data!)
- `npm run studio` - Open Prisma Studio (database GUI)
- `npm run seed` - Populate database with sample data

## Environment Variables

Create a `.env` file in the `server/` directory:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/university_management"
PORT=5000
NODE_ENV=development
```

## API Endpoints

All endpoints follow RESTful conventions:

### GET /api/{entity}
Get all records with pagination, filtering, and sorting

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 100)
- `sortBy` - Field to sort by (default: 'id')
- `order` - Sort order: 'asc' or 'desc' (default: 'asc')
- Any field name for filtering (e.g., `?status=active`)

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

### GET /api/{entity}/:id
Get single record by ID

**Response:** Record object with included relations

### POST /api/{entity}
Create new record

**Body:** JSON object with required fields

**Response:** Created record with status 201

### PUT /api/{entity}/:id
Update existing record

**Body:** JSON object with fields to update

**Response:** Updated record

### DELETE /api/{entity}/:id
Delete record

**Response:** 204 No Content

## Entities

1. **Departments** - `/api/departments`
2. **Buildings** - `/api/buildings`
3. **Semesters** - `/api/semesters`
4. **Professors** - `/api/professors`
5. **Classrooms** - `/api/classrooms`
6. **Students** - `/api/students`
7. **Courses** - `/api/courses`
8. **Sections** - `/api/sections`
9. **Assignments** - `/api/assignments`
10. **Grades** - `/api/grades`
11. **Enrollments** - `/api/enrollments`
12. **Prerequisites** - `/api/prerequisites`
13. **Schedules** - `/api/schedules`
14. **Office Hours** - `/api/office-hours`
15. **Transcripts** - `/api/transcripts/student/:studentId` (read-only)

## Validation

All endpoints use Joi validation schemas. Common validation rules:

- Required fields marked in schema
- String max lengths enforced
- Email format validation
- Number ranges (min/max)
- Date format validation
- Foreign key validation

Validation errors return 400 status with details:
```json
{
  "error": "Validation error",
  "message": "\"email\" must be a valid email",
  "details": [...]
}
```

## Error Handling

### Standard Error Responses

**404 Not Found:**
```json
{
  "error": "Not Found",
  "message": "Record not found"
}
```

**409 Conflict (Duplicate):**
```json
{
  "error": "Duplicate entry",
  "message": "A record with this code already exists",
  "field": "code"
}
```

**400 Bad Request (Foreign Key):**
```json
{
  "error": "Foreign key constraint failed",
  "message": "Referenced record does not exist"
}
```

## Database Schema

Prisma schema location: `prisma/schema.prisma`

### Viewing the Schema

```bash
# Open Prisma Studio
npx prisma studio
```

### Making Schema Changes

1. Edit `prisma/schema.prisma`
2. Create migration:
   ```bash
   npx prisma migrate dev --name your_change_description
   ```
3. Restart server

### Database Migrations

```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy

# Reset database (deletes all data!)
npx prisma migrate reset
```

## Project Structure

```
server/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Migration files
├── src/
│   ├── controllers/
│   │   ├── baseController.js       # Generic CRUD controller
│   │   └── transcriptController.js # Custom transcript logic
│   ├── middleware/
│   │   ├── errorHandler.js  # Global error handler
│   │   └── validate.js      # Joi validation middleware
│   ├── routes/
│   │   ├── departments.js   # All 14 entity routes
│   │   ├── ...
│   │   └── transcripts.js
│   ├── server.js           # Express app setup
│   └── seed.js             # Database seed script
├── .env                    # Environment variables (create this)
├── .env.example            # Environment template
└── package.json
```

## CORS Configuration

CORS is enabled for all origins in development. For production, update `server.js`:

```javascript
app.use(cors({
  origin: 'https://your-frontend-domain.com'
}));
```

## Logging

Console logging is enabled for:
- Incoming requests
- Database errors
- Validation errors
- Application errors

## Testing the API

### Using curl

```bash
# Get all departments
curl http://localhost:5000/api/departments

# Get department by ID
curl http://localhost:5000/api/departments/1

# Create department
curl -X POST http://localhost:5000/api/departments \
  -H "Content-Type: application/json" \
  -d '{"code":"BIO","name":"Biology","description":"Department of Biology"}'

# Update department
curl -X PUT http://localhost:5000/api/departments/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name"}'

# Delete department
curl -X DELETE http://localhost:5000/api/departments/1
```

### Using Postman or Thunder Client

Import endpoints:
- Base URL: `http://localhost:5000`
- All endpoints documented above

## Sample Data

Run the seed script to populate sample data:

```bash
npm run seed
```

Creates:
- 3 Departments
- 2 Buildings
- 2 Semesters
- 2 Professors
- 2 Classrooms
- 2 Students
- 3 Courses
- Prerequisites
- 2 Course Sections
- Class Schedules
- Office Hours
- Student Enrollments
- Assignments
- Grades

## Troubleshooting

### "Database does not exist"
```bash
psql -U postgres -c "CREATE DATABASE university_management;"
```

### "Migration failed"
```bash
npx prisma migrate reset
npm run seed
```

### "Port 5000 in use"
Change PORT in `.env` file

### "Prisma Client not generated"
```bash
npx prisma generate
```

## Dependencies

- **express** - Web framework
- **@prisma/client** - Database ORM
- **cors** - Enable CORS
- **dotenv** - Environment variables
- **joi** - Validation
- **express-async-errors** - Async error handling

## Dev Dependencies

- **prisma** - Prisma CLI
- **nodemon** - Auto-restart server

## License

MIT
