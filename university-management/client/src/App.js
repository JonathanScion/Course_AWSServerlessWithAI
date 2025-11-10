import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import Home from './pages/Home';
import {
  Departments,
  Buildings,
  Semesters,
  Professors,
  Classrooms,
  Students,
  Courses,
  Sections,
  Assignments,
  Grades,
  Enrollments,
  Prerequisites,
  Schedules,
  OfficeHours,
  Transcripts
} from './pages';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2'
    },
    secondary: {
      main: '#dc004e'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
  }
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />

            {/* Simple CRUD */}
            <Route path="/departments" element={<Departments />} />
            <Route path="/buildings" element={<Buildings />} />
            <Route path="/semesters" element={<Semesters />} />

            {/* Parent-Child Relationships */}
            <Route path="/professors" element={<Professors />} />
            <Route path="/classrooms" element={<Classrooms />} />
            <Route path="/students" element={<Students />} />

            {/* Multi-Level Hierarchy */}
            <Route path="/courses" element={<Courses />} />
            <Route path="/sections" element={<Sections />} />
            <Route path="/assignments" element={<Assignments />} />
            <Route path="/grades" element={<Grades />} />

            {/* Many-to-Many & Complex */}
            <Route path="/enrollments" element={<Enrollments />} />
            <Route path="/prerequisites" element={<Prerequisites />} />
            <Route path="/schedules" element={<Schedules />} />
            <Route path="/office-hours" element={<OfficeHours />} />
            <Route path="/transcripts" element={<Transcripts />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
