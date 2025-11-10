const express = require('express');
const router = express.Router();
const BaseController = require('../controllers/baseController');
const Joi = require('joi');
const validate = require('../middleware/validate');

const controller = new BaseController('schedule', {
  section: {
    include: {
      course: true,
      semester: true
    }
  },
  classroom: {
    include: {
      building: true
    }
  }
});

const scheduleSchema = Joi.object({
  sectionId: Joi.number().integer().required(),
  classroomId: Joi.number().integer().required(),
  dayOfWeek: Joi.string()
    .valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
    .required(),
  startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required()
    .messages({
      'string.pattern.base': 'Start time must be in HH:MM format (e.g., 09:00)'
    }),
  endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required()
    .messages({
      'string.pattern.base': 'End time must be in HH:MM format (e.g., 10:30)'
    })
});

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validate(scheduleSchema), controller.create);
router.put('/:id', validate(scheduleSchema), controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
