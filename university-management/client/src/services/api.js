import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
);

/**
 * Generic CRUD service factory
 */
const createCrudService = (endpoint) => ({
  getAll: (params = {}) => api.get(endpoint, { params }),
  getById: (id) => api.get(`${endpoint}/${id}`),
  create: (data) => api.post(endpoint, data),
  update: (id, data) => api.put(`${endpoint}/${id}`, data),
  delete: (id) => api.delete(`${endpoint}/${id}`)
});

// Export individual services for all entities
export const departmentService = createCrudService('/departments');
export const buildingService = createCrudService('/buildings');
export const semesterService = createCrudService('/semesters');
export const professorService = createCrudService('/professors');
export const classroomService = createCrudService('/classrooms');
export const studentService = createCrudService('/students');
export const courseService = createCrudService('/courses');
export const sectionService = createCrudService('/sections');
export const assignmentService = createCrudService('/assignments');
export const gradeService = createCrudService('/grades');
export const enrollmentService = createCrudService('/enrollments');
export const prerequisiteService = createCrudService('/prerequisites');
export const scheduleService = createCrudService('/schedules');
export const officeHourService = createCrudService('/office-hours');

// Transcript service (read-only)
export const transcriptService = {
  getByStudentId: (studentId) => api.get(`/transcripts/student/${studentId}`)
};

export default api;
