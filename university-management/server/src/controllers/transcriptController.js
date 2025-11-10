const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Transcript controller - computed data
 * Aggregates student enrollments and grades
 */
class TranscriptController {
  /**
   * Get transcript for a specific student
   */
  getByStudentId = async (req, res) => {
    const { studentId } = req.params;

    // Get student info
    const student = await prisma.student.findUnique({
      where: { id: parseInt(studentId) }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get all enrollments with course and section details
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: parseInt(studentId),
        status: { in: ['enrolled', 'completed'] }
      },
      include: {
        section: {
          include: {
            course: {
              include: {
                department: true
              }
            },
            semester: true,
            professor: true
          }
        }
      },
      orderBy: {
        enrolledAt: 'desc'
      }
    });

    // Get all grades for this student
    const grades = await prisma.grade.findMany({
      where: { studentId: parseInt(studentId) },
      include: {
        assignment: {
          include: {
            section: {
              include: {
                course: true
              }
            }
          }
        }
      }
    });

    // Calculate GPA and aggregate course data
    let totalCredits = 0;
    let totalGradePoints = 0;
    const coursesBySection = {};

    enrollments.forEach(enrollment => {
      const sectionId = enrollment.sectionId;
      const course = enrollment.section.course;
      const credits = course.credits;

      // Calculate grade points if final grade exists
      if (enrollment.gradePoints !== null) {
        totalCredits += credits;
        totalGradePoints += enrollment.gradePoints * credits;
      }

      // Aggregate course information
      coursesBySection[sectionId] = {
        enrollmentId: enrollment.id,
        course: {
          code: course.code,
          name: course.name,
          credits: credits,
          department: course.department.name
        },
        section: {
          sectionNumber: enrollment.section.sectionNumber,
          semester: enrollment.section.semester.name,
          professor: enrollment.section.professor
            ? `${enrollment.section.professor.firstName} ${enrollment.section.professor.lastName}`
            : 'TBA'
        },
        enrolledAt: enrollment.enrolledAt,
        status: enrollment.status,
        finalGrade: enrollment.finalGrade,
        gradePoints: enrollment.gradePoints
      };
    });

    // Group grades by section
    const gradesByCourse = {};
    grades.forEach(grade => {
      const sectionId = grade.assignment.sectionId;
      if (!gradesByCourse[sectionId]) {
        gradesByCourse[sectionId] = [];
      }
      gradesByCourse[sectionId].push({
        assignmentTitle: grade.assignment.title,
        assignmentType: grade.assignment.type,
        pointsEarned: grade.pointsEarned,
        totalPoints: grade.assignment.totalPoints,
        percentage: (grade.pointsEarned / grade.assignment.totalPoints) * 100,
        submittedAt: grade.submittedAt,
        gradedAt: grade.gradedAt
      });
    });

    // Add grades to course information
    Object.keys(coursesBySection).forEach(sectionId => {
      coursesBySection[sectionId].assignments = gradesByCourse[sectionId] || [];
    });

    const gpa = totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : 0;

    res.json({
      student: {
        id: student.id,
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        major: student.major,
        status: student.status,
        enrollmentDate: student.enrollmentDate
      },
      academicSummary: {
        totalCredits,
        gpa: parseFloat(gpa),
        totalCourses: enrollments.length,
        completedCourses: enrollments.filter(e => e.status === 'completed').length
      },
      courses: Object.values(coursesBySection)
    });
  };
}

module.exports = new TranscriptController();
