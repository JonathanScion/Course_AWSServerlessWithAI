import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { Search as SearchIcon, School as SchoolIcon } from '@mui/icons-material';
import { transcriptService } from '../services/api';

const Transcripts = () => {
  const [studentId, setStudentId] = useState('');
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!studentId) {
      setError('Please enter a student ID');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await transcriptService.getByStudentId(studentId);
      setTranscript(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load transcript');
      setTranscript(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Student Transcripts
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Search for Student
        </Typography>
        <Box display="flex" gap={2}>
          <TextField
            label="Student ID (numeric database ID)"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            type="number"
            sx={{ flexGrow: 1 }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            startIcon={<SearchIcon />}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Search'}
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box display="flex" justifyContent="center" p={5}>
          <CircularProgress />
        </Box>
      )}

      {transcript && (
        <>
          {/* Student Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <SchoolIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h5">
                    {transcript.student.firstName} {transcript.student.lastName}
                  </Typography>
                  <Typography color="textSecondary">
                    ID: {transcript.student.studentId} | Email: {transcript.student.email}
                  </Typography>
                </Box>
                <Box ml="auto">
                  <Chip
                    label={transcript.student.status.toUpperCase()}
                    color={transcript.student.status === 'active' ? 'success' : 'default'}
                  />
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="textSecondary" variant="body2">Major</Typography>
                  <Typography variant="h6">{transcript.student.major || 'Undeclared'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="textSecondary" variant="body2">GPA</Typography>
                  <Typography variant="h6" color="primary">
                    {transcript.academicSummary.gpa.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="textSecondary" variant="body2">Total Credits</Typography>
                  <Typography variant="h6">{transcript.academicSummary.totalCredits}</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography color="textSecondary" variant="body2">Courses Completed</Typography>
                  <Typography variant="h6">
                    {transcript.academicSummary.completedCourses} / {transcript.academicSummary.totalCourses}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Course History */}
          <Paper>
            <Box p={2} borderBottom={1} borderColor="divider">
              <Typography variant="h6">Course History</Typography>
            </Box>

            {transcript.courses.length === 0 ? (
              <Box p={3} textAlign="center">
                <Typography color="textSecondary">No courses found</Typography>
              </Box>
            ) : (
              transcript.courses.map((course) => (
                <Box key={course.enrollmentId} p={2} borderBottom={1} borderColor="divider">
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6">
                        {course.course.code}: {course.course.name}
                      </Typography>
                      <Typography color="textSecondary" variant="body2">
                        {course.course.department} | {course.course.credits} credits
                      </Typography>
                      <Typography color="textSecondary" variant="body2">
                        Section {course.section.sectionNumber} | {course.section.semester}
                      </Typography>
                      <Typography color="textSecondary" variant="body2">
                        Professor: {course.section.professor}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Typography color="textSecondary" variant="body2">Status</Typography>
                      <Chip
                        label={course.status.toUpperCase()}
                        size="small"
                        color={course.status === 'completed' ? 'success' : 'default'}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Typography color="textSecondary" variant="body2">Final Grade</Typography>
                      <Typography variant="h6">
                        {course.finalGrade || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Typography color="textSecondary" variant="body2">Grade Points</Typography>
                      <Typography variant="h6">
                        {course.gradePoints !== null ? course.gradePoints.toFixed(2) : 'N/A'}
                      </Typography>
                    </Grid>
                  </Grid>

                  {/* Assignment grades for this course */}
                  {course.assignments && course.assignments.length > 0 && (
                    <Box mt={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        Assignment Grades
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Assignment</TableCell>
                              <TableCell>Type</TableCell>
                              <TableCell align="right">Score</TableCell>
                              <TableCell align="right">Percentage</TableCell>
                              <TableCell>Submitted</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {course.assignments.map((assignment, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{assignment.assignmentTitle}</TableCell>
                                <TableCell>
                                  <Chip label={assignment.assignmentType} size="small" />
                                </TableCell>
                                <TableCell align="right">
                                  {assignment.pointsEarned} / {assignment.totalPoints}
                                </TableCell>
                                <TableCell align="right">
                                  {assignment.percentage.toFixed(1)}%
                                </TableCell>
                                <TableCell>
                                  {assignment.submittedAt
                                    ? new Date(assignment.submittedAt).toLocaleDateString()
                                    : 'Not submitted'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </Box>
              ))
            )}
          </Paper>
        </>
      )}
    </Box>
  );
};

export default Transcripts;
