/**
 * Global Test Configuration
 *
 * This file contains all configuration values used across E2E tests.
 * Values can be overridden via environment variables.
 *
 * Usage:
 *   const { config } = require('./test.config');
 *
 * Environment Variables:
 *   API_URL   - Backend server URL (default: http://localhost:5000)
 *   BASE_URL  - Frontend client URL (default: http://localhost:3000)
 */

const config = {
  /**
   * Backend API server URL
   * Override with API_URL environment variable
   * @type {string}
   */
  apiURL: process.env.API_URL || 'http://localhost:5000',

  /**
   * Frontend client application URL
   * Override with BASE_URL environment variable
   * @type {string}
   */
  baseURL: process.env.BASE_URL || 'http://localhost:3000',

  /**
   * Maximum number of records to fetch in API queries
   * Used for cleanup and bulk operations
   * @type {number}
   */
  apiQueryLimit: 1000,

  /**
   * Timeout in milliseconds to wait for UI updates after operations
   * Used after delete operations and similar UI state changes
   * @type {number}
   */
  uiWaitTimeout: 500,

  /**
   * Health check endpoint path
   * @type {string}
   */
  healthEndpoint: '/health',

  /**
   * API base path prefix
   * @type {string}
   */
  apiBasePath: '/api',
};

module.exports = { config };
