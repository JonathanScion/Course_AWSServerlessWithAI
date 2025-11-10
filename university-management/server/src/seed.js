const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Seed script to populate database with sample data
 */
async function main() {
  console.log('Starting database seed...');

  // Clear existing data (in reverse order of dependencies)
  console.log('Clearing existing data...');
  await prisma.grade.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.prerequisite.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.officeHour.deleteMany();
  await prisma.section.deleteMany();
  await prisma.course.deleteMany();
  await prisma.student.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.professor.deleteMany();
  await prisma.semester.deleteMany();
  await prisma.building.deleteMany();
  await prisma.department.deleteMany();

  // 1. Create Departments
  console.log('Creating departments...');
  const csdept = await prisma.department.create({
    data: {
      code: 'CS',
      name: 'Computer Science',
      description: 'Department of Computer Science and Engineering',
      building: 'Engineering Building',
      phone: '555-0101',
      email: 'cs@university.edu'
    }
  });

  const mathDept = await prisma.department.create({
    data: {
      code: 'MATH',
      name: 'Mathematics',
      description: 'Department of Mathematics',
      building: 'Science Building',
      phone: '555-0102',
      email: 'math@university.edu'
    }
  });

  const engDept = await prisma.department.create({
    data: {
      code: 'ENG',
      name: 'English',
      description: 'Department of English Literature',
      building: 'Arts Building',
      phone: '555-0103',
      email: 'english@university.edu'
    }
  });

  // 2. Create Buildings
  console.log('Creating buildings...');
  const engBuilding = await prisma.building.create({
    data: {
      code: 'ENG',
      name: 'Engineering Building',
      address: '100 University Ave',
      floors: 5,
      hasElevator: true,
      builtYear: 2010
    }
  });

  const sciBuilding = await prisma.building.create({
    data: {
      code: 'SCI',
      name: 'Science Building',
      address: '200 University Ave',
      floors: 4,
      hasElevator: true,
      builtYear: 2005
    }
  });

  // 3. Create Semesters
  console.log('Creating semesters...');
  const fall2024 = await prisma.semester.create({
    data: {
      code: 'FALL2024',
      name: 'Fall 2024',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2024-12-15'),
      isActive: true
    }
  });

  const spring2025 = await prisma.semester.create({
    data: {
      code: 'SPRING2025',
      name: 'Spring 2025',
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-05-15'),
      isActive: false
    }
  });

  // 4. Create Professors
  console.log('Creating professors...');
  const prof1 = await prisma.professor.create({
    data: {
      employeeId: 'EMP001',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@university.edu',
      phone: '555-1001',
      title: 'Professor',
      officeRoom: 'ENG-301',
      hireDate: new Date('2015-08-01'),
      departmentId: csDept.id
    }
  });

  const prof2 = await prisma.professor.create({
    data: {
      employeeId: 'EMP002',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@university.edu',
      phone: '555-1002',
      title: 'Associate Professor',
      officeRoom: 'SCI-201',
      hireDate: new Date('2018-01-15'),
      departmentId: mathDept.id
    }
  });

  // 5. Create Classrooms
  console.log('Creating classrooms...');
  const classroom1 = await prisma.classroom.create({
    data: {
      roomNumber: '101',
      buildingId: engBuilding.id,
      capacity: 40,
      hasProjector: true,
      hasWhiteboard: true,
      hasComputers: true,
      floor: 1
    }
  });

  const classroom2 = await prisma.classroom.create({
    data: {
      roomNumber: '201',
      buildingId: sciBuilding.id,
      capacity: 30,
      hasProjector: true,
      hasWhiteboard: true,
      hasComputers: false,
      floor: 2
    }
  });

  // 6. Create Students
  console.log('Creating students...');
  const student1 = await prisma.student.create({
    data: {
      studentId: 'STU001',
      firstName: 'Alice',
      lastName: 'Williams',
      email: 'alice.williams@student.edu',
      phone: '555-2001',
      dateOfBirth: new Date('2002-03-15'),
      enrollmentDate: new Date('2020-09-01'),
      status: 'active',
      major: 'Computer Science'
    }
  });

  const student2 = await prisma.student.create({
    data: {
      studentId: 'STU002',
      firstName: 'Bob',
      lastName: 'Brown',
      email: 'bob.brown@student.edu',
      phone: '555-2002',
      dateOfBirth: new Date('2001-07-22'),
      enrollmentDate: new Date('2020-09-01'),
      status: 'active',
      major: 'Mathematics'
    }
  });

  // 7. Create Courses
  console.log('Creating courses...');
  const cs101 = await prisma.course.create({
    data: {
      code: 'CS101',
      name: 'Introduction to Programming',
      description: 'Fundamental programming concepts using Python',
      credits: 3,
      departmentId: csDept.id,
      level: 'undergraduate'
    }
  });

  const cs201 = await prisma.course.create({
    data: {
      code: 'CS201',
      name: 'Data Structures',
      description: 'Arrays, linked lists, trees, and graphs',
      credits: 4,
      departmentId: csDept.id,
      level: 'undergraduate'
    }
  });

  const math101 = await prisma.course.create({
    data: {
      code: 'MATH101',
      name: 'Calculus I',
      description: 'Limits, derivatives, and integrals',
      credits: 4,
      departmentId: mathDept.id,
      level: 'undergraduate'
    }
  });

  // 8. Create Prerequisites
  console.log('Creating prerequisites...');
  await prisma.prerequisite.create({
    data: {
      courseId: cs201.id,
      prerequisiteId: cs101.id,
      minimumGrade: 'C'
    }
  });

  // 9. Create Sections
  console.log('Creating sections...');
  const section1 = await prisma.section.create({
    data: {
      sectionNumber: '001',
      courseId: cs101.id,
      semesterId: fall2024.id,
      professorId: prof1.id,
      capacity: 40,
      enrolled: 0,
      status: 'open'
    }
  });

  const section2 = await prisma.section.create({
    data: {
      sectionNumber: '001',
      courseId: math101.id,
      semesterId: fall2024.id,
      professorId: prof2.id,
      capacity: 30,
      enrolled: 0,
      status: 'open'
    }
  });

  // 10. Create Schedules
  console.log('Creating schedules...');
  await prisma.schedule.create({
    data: {
      sectionId: section1.id,
      classroomId: classroom1.id,
      dayOfWeek: 'Monday',
      startTime: '09:00',
      endTime: '10:30'
    }
  });

  await prisma.schedule.create({
    data: {
      sectionId: section1.id,
      classroomId: classroom1.id,
      dayOfWeek: 'Wednesday',
      startTime: '09:00',
      endTime: '10:30'
    }
  });

  // 11. Create Office Hours
  console.log('Creating office hours...');
  await prisma.officeHour.create({
    data: {
      professorId: prof1.id,
      dayOfWeek: 'Tuesday',
      startTime: '14:00',
      endTime: '16:00',
      location: 'ENG-301',
      isActive: true
    }
  });

  // 12. Create Enrollments
  console.log('Creating enrollments...');
  const enrollment1 = await prisma.enrollment.create({
    data: {
      studentId: student1.id,
      sectionId: section1.id,
      status: 'enrolled'
    }
  });

  const enrollment2 = await prisma.enrollment.create({
    data: {
      studentId: student2.id,
      sectionId: section2.id,
      status: 'enrolled'
    }
  });

  // Update section enrolled counts
  await prisma.section.update({
    where: { id: section1.id },
    data: { enrolled: 1 }
  });

  await prisma.section.update({
    where: { id: section2.id },
    data: { enrolled: 1 }
  });

  // 13. Create Assignments
  console.log('Creating assignments...');
  const assignment1 = await prisma.assignment.create({
    data: {
      title: 'Python Basics Homework',
      description: 'Complete exercises 1-10 from the textbook',
      sectionId: section1.id,
      dueDate: new Date('2024-09-30'),
      totalPoints: 100,
      type: 'homework'
    }
  });

  const assignment2 = await prisma.assignment.create({
    data: {
      title: 'Midterm Exam',
      description: 'Comprehensive exam covering chapters 1-5',
      sectionId: section1.id,
      dueDate: new Date('2024-10-15'),
      totalPoints: 200,
      type: 'exam'
    }
  });

  // 14. Create Grades
  console.log('Creating grades...');
  await prisma.grade.create({
    data: {
      assignmentId: assignment1.id,
      studentId: student1.id,
      pointsEarned: 85,
      submittedAt: new Date('2024-09-29'),
      gradedAt: new Date('2024-10-01'),
      feedback: 'Good work! Pay attention to code formatting.'
    }
  });

  console.log('Seed completed successfully!');
  console.log('\nCreated:');
  console.log('- 3 Departments');
  console.log('- 2 Buildings');
  console.log('- 2 Semesters');
  console.log('- 2 Professors');
  console.log('- 2 Classrooms');
  console.log('- 2 Students');
  console.log('- 3 Courses');
  console.log('- 1 Prerequisite');
  console.log('- 2 Sections');
  console.log('- 2 Schedules');
  console.log('- 1 Office Hour');
  console.log('- 2 Enrollments');
  console.log('- 2 Assignments');
  console.log('- 1 Grade');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
