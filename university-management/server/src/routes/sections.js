const express = require('express');
const router = express.Router();
const BaseController = require('../controllers/baseController');
const Joi = require('joi');
const validate = require('../middleware/validate');

const controller = new BaseController('section', {
  course: {
    include: {
      department: true
    }
  },
  semester: true,
  professor: true
});

const sectionSchema = Joi.object({
  sectionNumber: Joi.string().max(10).required(),
  courseId: Joi.number().integer().required(),
  semesterId: Joi.number().integer().required(),
  professorId: Joi.number().integer().allow(null),
  capacity: Joi.number().integer().min(1).required(),
  enrolled: Joi.number().integer().min(0),
  status: Joi.string().valid('open', 'closed', 'cancelled')
});

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validate(sectionSchema), controller.create);
router.put('/:id', validate(sectionSchema), controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
