const { PrismaClient } = require('@prisma/client');
const asyncHandler = require('../middleware/asyncHandler');
const prisma = new PrismaClient();

/**
 * Generic CRUD controller factory
 * Creates standard CRUD operations for any Prisma model
 */
class BaseController {
  constructor(modelName, includeRelations = {}) {
    this.model = prisma[modelName];
    this.modelName = modelName;
    this.includeRelations = includeRelations;
  }

  /**
   * Get all records
   */
  getAll = asyncHandler(async (req, res) => {
    const { page = 1, limit = 100, sortBy = 'id', order = 'asc', ...filters } = req.query;

    // Build where clause from query params
    const where = {};
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        // Handle string searches with contains
        if (typeof filters[key] === 'string') {
          where[key] = { contains: filters[key], mode: 'insensitive' };
        } else {
          where[key] = filters[key];
        }
      }
    });

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [data, total] = await Promise.all([
      this.model.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: order },
        include: this.includeRelations
      }),
      this.model.count({ where })
    ]);

    res.json({
      data,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  });

  /**
   * Get single record by ID
   */
  getById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const record = await this.model.findUnique({
      where: { id: parseInt(id) },
      include: this.includeRelations
    });

    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.json(record);
  });

  /**
   * Create new record
   */
  create = asyncHandler(async (req, res) => {
    const data = req.body;

    const record = await this.model.create({
      data,
      include: this.includeRelations
    });

    res.status(201).json(record);
  });

  /**
   * Update existing record
   */
  update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;

    const record = await this.model.update({
      where: { id: parseInt(id) },
      data,
      include: this.includeRelations
    });

    res.json(record);
  });

  /**
   * Delete record
   */
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await this.model.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  });
}

module.exports = BaseController;
