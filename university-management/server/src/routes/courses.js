const express = require('express');
const router = express.Router();
const BaseController = require('../controllers/baseController');
const Joi = require('joi');
const validate = require('../middleware/validate');

const controller = new BaseController('course', {
  department: true,
  prerequisites: {
    include: {
      prerequisiteCourse: true
    }
  }
});

const courseSchema = Joi.object({
  code: Joi.string().max(20).required(),
  name: Joi.string().max(200).required(),
  description: Joi.string().allow('', null),
  credits: Joi.number().integer().min(1).max(12).required(),
  departmentId: Joi.number().integer().required(),
  level: Joi.string().valid('undergraduate', 'graduate').required()
});

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validate(courseSchema), controller.create);
router.put('/:id', validate(courseSchema), controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
