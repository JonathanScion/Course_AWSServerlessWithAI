const express = require('express');
const router = express.Router();
const BaseController = require('../controllers/baseController');
const Joi = require('joi');
const validate = require('../middleware/validate');

const controller = new BaseController('student');

const studentSchema = Joi.object({
  studentId: Joi.string().max(20).required(),
  firstName: Joi.string().max(100).required(),
  lastName: Joi.string().max(100).required(),
  email: Joi.string().email().max(100).required(),
  phone: Joi.string().max(20).allow('', null),
  dateOfBirth: Joi.date().required(),
  enrollmentDate: Joi.date().required(),
  status: Joi.string().valid('active', 'graduated', 'withdrawn'),
  major: Joi.string().max(100).allow('', null)
});

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validate(studentSchema), controller.create);
router.put('/:id', validate(studentSchema), controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
