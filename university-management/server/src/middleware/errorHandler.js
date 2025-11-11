/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Only log unexpected errors (not validation or known Prisma errors)
  if (!err.isJoi && !err.code?.startsWith('P2')) {
    console.error('Error:', err);
  }

  // Prisma database connection errors
  if (err.constructor.name === 'PrismaClientInitializationError') {
    return res.status(503).json({
      error: 'Database connection error',
      message: 'Cannot connect to database. Please ensure PostgreSQL is running.'
    });
  }

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Duplicate entry',
      message: `A record with this ${err.meta?.target?.[0] || 'value'} already exists`,
      field: err.meta?.target?.[0]
    });
  }

  if (err.code === 'P2003') {
    return res.status(400).json({
      error: 'Foreign key constraint failed',
      message: 'Referenced record does not exist'
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Not found',
      message: 'Record not found'
    });
  }

  // Validation errors (Joi)
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Validation error',
      message: err.details[0].message,
      details: err.details
    });
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
};

module.exports = errorHandler;
