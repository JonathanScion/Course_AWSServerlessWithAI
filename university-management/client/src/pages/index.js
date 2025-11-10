// Simple wrapper pages that use CrudPage component
import React from 'react';
import CrudPage from './CrudPage';
import {
  buildingsConfig,
  semestersConfig,
  professorsConfig,
  classroomsConfig,
  studentsConfig,
  coursesConfig,
  sectionsConfig,
  assignmentsConfig,
  gradesConfig,
  enrollmentsConfig,
  prerequisitesConfig,
  schedulesConfig,
  officeHoursConfig
} from './pageConfigs';

// Export Departments (already created separately)
export { default as Departments } from './Departments';

// Simple CRUD pages
export const Buildings = () => <CrudPage {...buildingsConfig} />;
export const Semesters = () => <CrudPage {...semestersConfig} />;

// Parent-child relationship pages
export const Professors = () => <CrudPage {...professorsConfig} />;
export const Classrooms = () => <CrudPage {...classroomsConfig} />;
export const Students = () => <CrudPage {...studentsConfig} />;

// Multi-level hierarchy pages
export const Courses = () => <CrudPage {...coursesConfig} />;
export const Sections = () => <CrudPage {...sectionsConfig} />;
export const Assignments = () => <CrudPage {...assignmentsConfig} />;
export const Grades = () => <CrudPage {...gradesConfig} />;

// Many-to-many and complex pages
export const Enrollments = () => <CrudPage {...enrollmentsConfig} />;
export const Prerequisites = () => <CrudPage {...prerequisitesConfig} />;
export const Schedules = () => <CrudPage {...schedulesConfig} />;
export const OfficeHours = () => <CrudPage {...officeHoursConfig} />;

// Transcripts page (special read-only page)
export { default as Transcripts } from './Transcripts';
