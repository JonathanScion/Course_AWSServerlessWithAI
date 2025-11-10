const express = require('express');
const router = express.Router();
const BaseController = require('../controllers/baseController');
const Joi = require('joi');
const validate = require('../middleware/validate');

const controller = new BaseController('prerequisite', {
  course: true,
  prerequisiteCourse: true
});

const prerequisiteSchema = Joi.object({
  courseId: Joi.number().integer().required(),
  prerequisiteId: Joi.number().integer().required()
    .invalid(Joi.ref('courseId'))
    .messages({
      'any.invalid': 'A course cannot be a prerequisite of itself'
    }),
  minimumGrade: Joi.string().max(5).allow('', null)
});

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validate(prerequisiteSchema), controller.create);
router.put('/:id', validate(prerequisiteSchema), controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
