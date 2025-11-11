const express = require('express');
const router = express.Router();
const BaseController = require('../controllers/baseController');
const Joi = require('joi');
const validate = require('../middleware/validate');

const controller = new BaseController('department');

// Validation schema
const departmentSchema = Joi.object({
  code: Joi.string().max(10).required(),
  name: Joi.string().max(200).required(),
  description: Joi.string().allow('', null),
  building: Joi.string().max(100).allow('', null),
  phone: Joi.string().max(20).allow('', null),
  email: Joi.string().email().max(100).allow('', null),
  // Allow but ignore these fields (sent by client but not used)
  id: Joi.number().optional().strip(),
  createdAt: Joi.date().optional().strip(),
  updatedAt: Joi.date().optional().strip()
}).unknown(false);  // Reject any other unknown fields

// Routes
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validate(departmentSchema), controller.create);
router.put('/:id', validate(departmentSchema), controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
