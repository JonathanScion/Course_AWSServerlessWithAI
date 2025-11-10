import {
  departmentService,
  buildingService,
  semesterService,
  professorService,
  classroomService,
  studentService,
  courseService,
  sectionService,
  assignmentService,
  gradeService,
  enrollmentService,
  prerequisiteService,
  scheduleService,
  officeHourService
} from '../services/api';

/**
 * Page configurations for all entities
 * Used by CrudPage component to generate CRUD interfaces
 */

export const departmentsConfig = {
  title: 'Departments',
  service: departmentService,
  columns: [
    { field: 'code', headerName: 'Code', minWidth: 100 },
    { field: 'name', headerName: 'Name', minWidth: 200 },
    { field: 'building', headerName: 'Building', minWidth: 150 },
    { field: 'phone', headerName: 'Phone', minWidth: 150 }
  ],
  formFields: [
    { name: 'code', label: 'Code', type: 'text', required: true },
    { name: 'name', label: 'Name', type: 'text', required: true, fullWidth: true },
    { name: 'description', label: 'Description', type: 'text', multiline: true, rows: 3, fullWidth: true },
    { name: 'building', label: 'Building', type: 'text' },
    { name: 'phone', label: 'Phone', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' }
  ]
};

export const buildingsConfig = {
  title: 'Buildings',
  service: buildingService,
  columns: [
    { field: 'code', headerName: 'Code', minWidth: 100 },
    { field: 'name', headerName: 'Name', minWidth: 200 },
    { field: 'address', headerName: 'Address', minWidth: 250 },
    { field: 'floors', headerName: 'Floors', minWidth: 100 },
    {
      field: 'hasElevator',
      headerName: 'Elevator',
      minWidth: 100,
      render: (row) => row.hasElevator ? 'Yes' : 'No'
    }
  ],
  formFields: [
    { name: 'code', label: 'Code', type: 'text', required: true },
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'address', label: 'Address', type: 'text', required: true, fullWidth: true },
    { name: 'floors', label: 'Number of Floors', type: 'number', required: true, inputProps: { min: 1 } },
    { name: 'hasElevator', label: 'Has Elevator', type: 'checkbox' },
    { name: 'builtYear', label: 'Built Year', type: 'number', inputProps: { min: 1800, max: new Date().getFullYear() } }
  ]
};

export const semestersConfig = {
  title: 'Semesters',
  service: semesterService,
  columns: [
    { field: 'code', headerName: 'Code', minWidth: 120 },
    { field: 'name', headerName: 'Name', minWidth: 200 },
    {
      field: 'startDate',
      headerName: 'Start Date',
      minWidth: 130,
      render: (row) => new Date(row.startDate).toLocaleDateString()
    },
    {
      field: 'endDate',
      headerName: 'End Date',
      minWidth: 130,
      render: (row) => new Date(row.endDate).toLocaleDateString()
    },
    {
      field: 'isActive',
      headerName: 'Active',
      minWidth: 100,
      render: (row) => row.isActive ? 'Yes' : 'No'
    }
  ],
  formFields: [
    { name: 'code', label: 'Code (e.g., FALL2024)', type: 'text', required: true },
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'startDate', label: 'Start Date', type: 'date', required: true },
    { name: 'endDate', label: 'End Date', type: 'date', required: true },
    { name: 'isActive', label: 'Active', type: 'checkbox' }
  ]
};

export const professorsConfig = {
  title: 'Professors',
  service: professorService,
  columns: [
    { field: 'employeeId', headerName: 'Employee ID', minWidth: 120 },
    {
      field: 'name',
      headerName: 'Name',
      minWidth: 200,
      render: (row) => `${row.firstName} ${row.lastName}`
    },
    { field: 'email', headerName: 'Email', minWidth: 200 },
    { field: 'title', headerName: 'Title', minWidth: 150 },
    {
      field: 'department',
      headerName: 'Department',
      minWidth: 150,
      render: (row) => row.department?.name || 'N/A'
    }
  ],
  formFields: [
    { name: 'employeeId', label: 'Employee ID', type: 'text', required: true },
    { name: 'firstName', label: 'First Name', type: 'text', required: true },
    { name: 'lastName', label: 'Last Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Phone', type: 'text' },
    { name: 'title', label: 'Title', type: 'text', required: true },
    { name: 'officeRoom', label: 'Office Room', type: 'text' },
    { name: 'hireDate', label: 'Hire Date', type: 'date', required: true },
    { name: 'departmentId', label: 'Department', type: 'select', required: true, options: [] } // Options loaded dynamically
  ],
  getDisplayName: (item) => `${item.firstName || ''} ${item.lastName || ''}`.trim()
};

export const classroomsConfig = {
  title: 'Classrooms',
  service: classroomService,
  columns: [
    { field: 'roomNumber', headerName: 'Room Number', minWidth: 120 },
    {
      field: 'building',
      headerName: 'Building',
      minWidth: 150,
      render: (row) => row.building?.name || 'N/A'
    },
    { field: 'capacity', headerName: 'Capacity', minWidth: 100 },
    { field: 'floor', headerName: 'Floor', minWidth: 80 },
    {
      field: 'hasProjector',
      headerName: 'Projector',
      minWidth: 100,
      render: (row) => row.hasProjector ? 'Yes' : 'No'
    }
  ],
  formFields: [
    { name: 'roomNumber', label: 'Room Number', type: 'text', required: true },
    { name: 'buildingId', label: 'Building', type: 'select', required: true, options: [] },
    { name: 'capacity', label: 'Capacity', type: 'number', required: true, inputProps: { min: 1 } },
    { name: 'floor', label: 'Floor', type: 'number', required: true },
    { name: 'hasProjector', label: 'Has Projector', type: 'checkbox' },
    { name: 'hasWhiteboard', label: 'Has Whiteboard', type: 'checkbox' },
    { name: 'hasComputers', label: 'Has Computers', type: 'checkbox' }
  ]
};

export const studentsConfig = {
  title: 'Students',
  service: studentService,
  columns: [
    { field: 'studentId', headerName: 'Student ID', minWidth: 120 },
    {
      field: 'name',
      headerName: 'Name',
      minWidth: 200,
      render: (row) => `${row.firstName} ${row.lastName}`
    },
    { field: 'email', headerName: 'Email', minWidth: 200 },
    { field: 'major', headerName: 'Major', minWidth: 150 },
    { field: 'status', headerName: 'Status', minWidth: 120 }
  ],
  formFields: [
    { name: 'studentId', label: 'Student ID', type: 'text', required: true },
    { name: 'firstName', label: 'First Name', type: 'text', required: true },
    { name: 'lastName', label: 'Last Name', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Phone', type: 'text' },
    { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
    { name: 'enrollmentDate', label: 'Enrollment Date', type: 'date', required: true },
    { name: 'major', label: 'Major', type: 'text' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { value: 'active', label: 'Active' },
        { value: 'graduated', label: 'Graduated' },
        { value: 'withdrawn', label: 'Withdrawn' }
      ]
    }
  ],
  getDisplayName: (item) => `${item.firstName || ''} ${item.lastName || ''}`.trim()
};

export const coursesConfig = {
  title: 'Courses',
  service: courseService,
  columns: [
    { field: 'code', headerName: 'Course Code', minWidth: 120 },
    { field: 'name', headerName: 'Name', minWidth: 250 },
    { field: 'credits', headerName: 'Credits', minWidth: 100 },
    { field: 'level', headerName: 'Level', minWidth: 130 },
    {
      field: 'department',
      headerName: 'Department',
      minWidth: 150,
      render: (row) => row.department?.name || 'N/A'
    }
  ],
  formFields: [
    { name: 'code', label: 'Course Code', type: 'text', required: true },
    { name: 'name', label: 'Course Name', type: 'text', required: true, fullWidth: true },
    { name: 'description', label: 'Description', type: 'text', multiline: true, rows: 3, fullWidth: true },
    { name: 'credits', label: 'Credits', type: 'number', required: true, inputProps: { min: 1, max: 12 } },
    {
      name: 'level',
      label: 'Level',
      type: 'select',
      required: true,
      options: [
        { value: 'undergraduate', label: 'Undergraduate' },
        { value: 'graduate', label: 'Graduate' }
      ]
    },
    { name: 'departmentId', label: 'Department', type: 'select', required: true, options: [] }
  ]
};

export const sectionsConfig = {
  title: 'Sections',
  service: sectionService,
  columns: [
    { field: 'sectionNumber', headerName: 'Section', minWidth: 100 },
    {
      field: 'course',
      headerName: 'Course',
      minWidth: 200,
      render: (row) => row.course ? `${row.course.code} - ${row.course.name}` : 'N/A'
    },
    {
      field: 'semester',
      headerName: 'Semester',
      minWidth: 150,
      render: (row) => row.semester?.name || 'N/A'
    },
    {
      field: 'professor',
      headerName: 'Professor',
      minWidth: 150,
      render: (row) => row.professor ? `${row.professor.firstName} ${row.professor.lastName}` : 'TBA'
    },
    {
      field: 'enrollment',
      headerName: 'Enrollment',
      minWidth: 130,
      render: (row) => `${row.enrolled}/${row.capacity}`
    }
  ],
  formFields: [
    { name: 'sectionNumber', label: 'Section Number', type: 'text', required: true },
    { name: 'courseId', label: 'Course', type: 'select', required: true, options: [] },
    { name: 'semesterId', label: 'Semester', type: 'select', required: true, options: [] },
    { name: 'professorId', label: 'Professor', type: 'select', options: [] },
    { name: 'capacity', label: 'Capacity', type: 'number', required: true, inputProps: { min: 1 } },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'open', label: 'Open' },
        { value: 'closed', label: 'Closed' },
        { value: 'cancelled', label: 'Cancelled' }
      ]
    }
  ]
};

export const assignmentsConfig = {
  title: 'Assignments',
  service: assignmentService,
  columns: [
    { field: 'title', headerName: 'Title', minWidth: 200 },
    { field: 'type', headerName: 'Type', minWidth: 120 },
    {
      field: 'section',
      headerName: 'Section',
      minWidth: 200,
      render: (row) => row.section ? `${row.section.course?.code} - Section ${row.section.sectionNumber}` : 'N/A'
    },
    {
      field: 'dueDate',
      headerName: 'Due Date',
      minWidth: 130,
      render: (row) => new Date(row.dueDate).toLocaleDateString()
    },
    { field: 'totalPoints', headerName: 'Points', minWidth: 100 }
  ],
  formFields: [
    { name: 'title', label: 'Title', type: 'text', required: true, fullWidth: true },
    { name: 'description', label: 'Description', type: 'text', multiline: true, rows: 3, fullWidth: true },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      required: true,
      options: [
        { value: 'homework', label: 'Homework' },
        { value: 'exam', label: 'Exam' },
        { value: 'project', label: 'Project' },
        { value: 'quiz', label: 'Quiz' }
      ]
    },
    { name: 'sectionId', label: 'Section', type: 'select', required: true, options: [] },
    { name: 'dueDate', label: 'Due Date', type: 'date', required: true },
    { name: 'totalPoints', label: 'Total Points', type: 'number', required: true, inputProps: { min: 1 } }
  ],
  getDisplayName: (item) => item.title
};

export const gradesConfig = {
  title: 'Grades',
  service: gradeService,
  columns: [
    {
      field: 'student',
      headerName: 'Student',
      minWidth: 200,
      render: (row) => row.student ? `${row.student.firstName} ${row.student.lastName}` : 'N/A'
    },
    {
      field: 'assignment',
      headerName: 'Assignment',
      minWidth: 200,
      render: (row) => row.assignment?.title || 'N/A'
    },
    {
      field: 'score',
      headerName: 'Score',
      minWidth: 120,
      render: (row) => `${row.pointsEarned}/${row.assignment?.totalPoints || 0}`
    },
    {
      field: 'percentage',
      headerName: 'Percentage',
      minWidth: 120,
      render: (row) => row.assignment ? `${((row.pointsEarned / row.assignment.totalPoints) * 100).toFixed(1)}%` : 'N/A'
    },
    {
      field: 'gradedAt',
      headerName: 'Graded At',
      minWidth: 130,
      render: (row) => row.gradedAt ? new Date(row.gradedAt).toLocaleDateString() : 'Not graded'
    }
  ],
  formFields: [
    { name: 'studentId', label: 'Student', type: 'select', required: true, options: [] },
    { name: 'assignmentId', label: 'Assignment', type: 'select', required: true, options: [] },
    { name: 'pointsEarned', label: 'Points Earned', type: 'number', required: true, inputProps: { min: 0, step: 0.5 } },
    { name: 'submittedAt', label: 'Submitted At', type: 'date' },
    { name: 'gradedAt', label: 'Graded At', type: 'date' },
    { name: 'feedback', label: 'Feedback', type: 'text', multiline: true, rows: 3, fullWidth: true }
  ]
};

export const enrollmentsConfig = {
  title: 'Enrollments',
  service: enrollmentService,
  columns: [
    {
      field: 'student',
      headerName: 'Student',
      minWidth: 200,
      render: (row) => row.student ? `${row.student.firstName} ${row.student.lastName}` : 'N/A'
    },
    {
      field: 'section',
      headerName: 'Course Section',
      minWidth: 250,
      render: (row) => row.section ? `${row.section.course?.code} - Section ${row.section.sectionNumber}` : 'N/A'
    },
    {
      field: 'semester',
      headerName: 'Semester',
      minWidth: 130,
      render: (row) => row.section?.semester?.name || 'N/A'
    },
    { field: 'status', headerName: 'Status', minWidth: 120 },
    { field: 'finalGrade', headerName: 'Final Grade', minWidth: 120 }
  ],
  formFields: [
    { name: 'studentId', label: 'Student', type: 'select', required: true, options: [] },
    { name: 'sectionId', label: 'Section', type: 'select', required: true, options: [] },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'enrolled', label: 'Enrolled' },
        { value: 'dropped', label: 'Dropped' },
        { value: 'completed', label: 'Completed' }
      ]
    },
    { name: 'finalGrade', label: 'Final Grade (e.g., A, B+)', type: 'text' },
    { name: 'gradePoints', label: 'Grade Points (0-4)', type: 'number', inputProps: { min: 0, max: 4, step: 0.1 } }
  ]
};

export const prerequisitesConfig = {
  title: 'Prerequisites',
  service: prerequisiteService,
  columns: [
    {
      field: 'course',
      headerName: 'Course',
      minWidth: 200,
      render: (row) => row.course ? `${row.course.code} - ${row.course.name}` : 'N/A'
    },
    {
      field: 'prerequisite',
      headerName: 'Prerequisite',
      minWidth: 200,
      render: (row) => row.prerequisiteCourse ? `${row.prerequisiteCourse.code} - ${row.prerequisiteCourse.name}` : 'N/A'
    },
    { field: 'minimumGrade', headerName: 'Minimum Grade', minWidth: 130 }
  ],
  formFields: [
    { name: 'courseId', label: 'Course', type: 'select', required: true, options: [] },
    { name: 'prerequisiteId', label: 'Prerequisite Course', type: 'select', required: true, options: [] },
    { name: 'minimumGrade', label: 'Minimum Grade (e.g., C)', type: 'text' }
  ]
};

export const schedulesConfig = {
  title: 'Class Schedules',
  service: scheduleService,
  columns: [
    {
      field: 'section',
      headerName: 'Section',
      minWidth: 200,
      render: (row) => row.section ? `${row.section.course?.code} - Section ${row.section.sectionNumber}` : 'N/A'
    },
    {
      field: 'classroom',
      headerName: 'Classroom',
      minWidth: 150,
      render: (row) => row.classroom ? `${row.classroom.building?.code} ${row.classroom.roomNumber}` : 'N/A'
    },
    { field: 'dayOfWeek', headerName: 'Day', minWidth: 120 },
    {
      field: 'time',
      headerName: 'Time',
      minWidth: 150,
      render: (row) => `${row.startTime} - ${row.endTime}`
    }
  ],
  formFields: [
    { name: 'sectionId', label: 'Section', type: 'select', required: true, options: [] },
    { name: 'classroomId', label: 'Classroom', type: 'select', required: true, options: [] },
    {
      name: 'dayOfWeek',
      label: 'Day of Week',
      type: 'select',
      required: true,
      options: [
        { value: 'Monday', label: 'Monday' },
        { value: 'Tuesday', label: 'Tuesday' },
        { value: 'Wednesday', label: 'Wednesday' },
        { value: 'Thursday', label: 'Thursday' },
        { value: 'Friday', label: 'Friday' },
        { value: 'Saturday', label: 'Saturday' },
        { value: 'Sunday', label: 'Sunday' }
      ]
    },
    { name: 'startTime', label: 'Start Time (HH:MM)', type: 'text', required: true, inputProps: { placeholder: '09:00' } },
    { name: 'endTime', label: 'End Time (HH:MM)', type: 'text', required: true, inputProps: { placeholder: '10:30' } }
  ]
};

export const officeHoursConfig = {
  title: 'Office Hours',
  service: officeHourService,
  columns: [
    {
      field: 'professor',
      headerName: 'Professor',
      minWidth: 200,
      render: (row) => row.professor ? `${row.professor.firstName} ${row.professor.lastName}` : 'N/A'
    },
    { field: 'dayOfWeek', headerName: 'Day', minWidth: 120 },
    {
      field: 'time',
      headerName: 'Time',
      minWidth: 150,
      render: (row) => `${row.startTime} - ${row.endTime}`
    },
    { field: 'location', headerName: 'Location', minWidth: 150 },
    {
      field: 'isActive',
      headerName: 'Active',
      minWidth: 100,
      render: (row) => row.isActive ? 'Yes' : 'No'
    }
  ],
  formFields: [
    { name: 'professorId', label: 'Professor', type: 'select', required: true, options: [] },
    {
      name: 'dayOfWeek',
      label: 'Day of Week',
      type: 'select',
      required: true,
      options: [
        { value: 'Monday', label: 'Monday' },
        { value: 'Tuesday', label: 'Tuesday' },
        { value: 'Wednesday', label: 'Wednesday' },
        { value: 'Thursday', label: 'Thursday' },
        { value: 'Friday', label: 'Friday' },
        { value: 'Saturday', label: 'Saturday' },
        { value: 'Sunday', label: 'Sunday' }
      ]
    },
    { name: 'startTime', label: 'Start Time (HH:MM)', type: 'text', required: true, inputProps: { placeholder: '14:00' } },
    { name: 'endTime', label: 'End Time (HH:MM)', type: 'text', required: true, inputProps: { placeholder: '16:00' } },
    { name: 'location', label: 'Location', type: 'text', required: true },
    { name: 'isActive', label: 'Active', type: 'checkbox' }
  ]
};
