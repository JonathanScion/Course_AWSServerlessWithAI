import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Paper
} from '@mui/material';
import {
  Business as BusinessIcon,
  School as SchoolIcon,
  CalendarMonth as CalendarIcon,
  Person as PersonIcon,
  MeetingRoom as MeetingRoomIcon,
  People as PeopleIcon,
  Book as BookIcon,
  Class as ClassIcon,
  Assignment as AssignmentIcon,
  Grade as GradeIcon,
  PersonAdd as EnrollmentIcon,
  Link as LinkIcon,
  Schedule as ScheduleIcon,
  AccessTime as TimeIcon,
  Description as TranscriptIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const entityGroups = [
    {
      title: 'Simple CRUD Operations',
      description: 'Basic create, read, update, delete operations',
      entities: [
        { name: 'Departments', icon: <BusinessIcon />, path: '/departments', color: '#1976d2' },
        { name: 'Buildings', icon: <SchoolIcon />, path: '/buildings', color: '#388e3c' },
        { name: 'Semesters', icon: <CalendarIcon />, path: '/semesters', color: '#f57c00' }
      ]
    },
    {
      title: 'Parent-Child Relationships',
      description: 'Entities with foreign key relationships',
      entities: [
        { name: 'Professors', icon: <PersonIcon />, path: '/professors', color: '#7b1fa2' },
        { name: 'Classrooms', icon: <MeetingRoomIcon />, path: '/classrooms', color: '#c2185b' },
        { name: 'Students', icon: <PeopleIcon />, path: '/students', color: '#0288d1' }
      ]
    },
    {
      title: 'Multi-Level Hierarchy',
      description: 'Nested relationships and dependencies',
      entities: [
        { name: 'Courses', icon: <BookIcon />, path: '/courses', color: '#00796b' },
        { name: 'Sections', icon: <ClassIcon />, path: '/sections', color: '#5d4037' },
        { name: 'Assignments', icon: <AssignmentIcon />, path: '/assignments', color: '#f9a825' },
        { name: 'Grades', icon: <GradeIcon />, path: '/grades', color: '#e64a19' }
      ]
    },
    {
      title: 'Complex & Many-to-Many',
      description: 'Junction tables and computed data',
      entities: [
        { name: 'Enrollments', icon: <EnrollmentIcon />, path: '/enrollments', color: '#303f9f' },
        { name: 'Prerequisites', icon: <LinkIcon />, path: '/prerequisites', color: '#455a64' },
        { name: 'Schedules', icon: <ScheduleIcon />, path: '/schedules', color: '#00695c' },
        { name: 'Office Hours', icon: <TimeIcon />, path: '/office-hours', color: '#6a1b9a' },
        { name: 'Transcripts', icon: <TranscriptIcon />, path: '/transcripts', color: '#d32f2f' }
      ]
    }
  ];

  return (
    <Box>
      <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)' }}>
        <Typography variant="h3" color="white" gutterBottom>
          University Management System
        </Typography>
        <Typography variant="h6" color="white" sx={{ opacity: 0.9 }}>
          Comprehensive CRUD operations demonstrating various entity relationships and patterns
        </Typography>
      </Paper>

      {entityGroups.map((group, idx) => (
        <Box key={idx} mb={4}>
          <Typography variant="h5" gutterBottom>
            {group.title}
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom mb={2}>
            {group.description}
          </Typography>

          <Grid container spacing={2}>
            {group.entities.map((entity) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={entity.path}>
                <Card>
                  <CardActionArea onClick={() => navigate(entity.path)}>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Box
                          sx={{
                            backgroundColor: entity.color,
                            color: 'white',
                            p: 1,
                            borderRadius: 1,
                            display: 'flex'
                          }}
                        >
                          {entity.icon}
                        </Box>
                        <Typography variant="h6">{entity.name}</Typography>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}

      <Paper sx={{ p: 3, mt: 4, bgcolor: 'grey.100' }}>
        <Typography variant="h6" gutterBottom>
          About This Application
        </Typography>
        <Typography variant="body2" paragraph>
          This is a demonstration application built to showcase comprehensive CRUD patterns and entity
          relationships for testing purposes. It includes 15 different entities with various relationship
          types:
        </Typography>
        <ul>
          <li>
            <Typography variant="body2">
              <strong>Simple CRUD:</strong> Basic operations with no relationships
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              <strong>Parent-Child:</strong> Foreign key relationships (one-to-many)
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              <strong>Multi-Level:</strong> Nested hierarchies (courses → sections → assignments → grades)
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              <strong>Many-to-Many:</strong> Junction tables (student enrollments)
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              <strong>Self-Referential:</strong> Courses with prerequisites
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              <strong>Computed Data:</strong> Transcripts with aggregated grades and GPA calculation
            </Typography>
          </li>
        </ul>
        <Typography variant="body2" color="textSecondary" mt={2}>
          Technology Stack: React + Material-UI + React Router (Frontend) | Node.js + Express + Prisma ORM
          (Backend) | PostgreSQL (Database)
        </Typography>
      </Paper>
    </Box>
  );
};

export default Home;
