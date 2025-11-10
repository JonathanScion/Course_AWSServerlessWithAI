const express = require('express');
const router = express.Router();
const BaseController = require('../controllers/baseController');
const Joi = require('joi');
const validate = require('../middleware/validate');

const controller = new BaseController('officeHour', {
  professor: {
    include: {
      department: true
    }
  }
});

const officeHourSchema = Joi.object({
  professorId: Joi.number().integer().required(),
  dayOfWeek: Joi.string()
    .valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
    .required(),
  startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required()
    .messages({
      'string.pattern.base': 'Start time must be in HH:MM format (e.g., 14:00)'
    }),
  endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required()
    .messages({
      'string.pattern.base': 'End time must be in HH:MM format (e.g., 16:00)'
    }),
  location: Joi.string().max(100).required(),
  isActive: Joi.boolean()
});

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validate(officeHourSchema), controller.create);
router.put('/:id', validate(officeHourSchema), controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
