require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/departments', require('./routes/departments'));
app.use('/api/buildings', require('./routes/buildings'));
app.use('/api/semesters', require('./routes/semesters'));
app.use('/api/professors', require('./routes/professors'));
app.use('/api/classrooms', require('./routes/classrooms'));
app.use('/api/students', require('./routes/students'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/sections', require('./routes/sections'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/grades', require('./routes/grades'));
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/prerequisites', require('./routes/prerequisites'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/office-hours', require('./routes/officeHours'));
app.use('/api/transcripts', require('./routes/transcripts'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'University Management System API',
    version: '1.0.0',
    endpoints: {
      departments: '/api/departments',
      buildings: '/api/buildings',
      semesters: '/api/semesters',
      professors: '/api/professors',
      classrooms: '/api/classrooms',
      students: '/api/students',
      courses: '/api/courses',
      sections: '/api/sections',
      assignments: '/api/assignments',
      grades: '/api/grades',
      enrollments: '/api/enrollments',
      prerequisites: '/api/prerequisites',
      schedules: '/api/schedules',
      officeHours: '/api/office-hours',
      transcripts: '/api/transcripts/student/:studentId'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
