const express = require('express');
const router = express.Router();
const BaseController = require('../controllers/baseController');
const Joi = require('joi');
const validate = require('../middleware/validate');

const controller = new BaseController('professor', {
  department: true
});

const professorSchema = Joi.object({
  employeeId: Joi.string().max(20).required(),
  firstName: Joi.string().max(100).required(),
  lastName: Joi.string().max(100).required(),
  email: Joi.string().email().max(100).required(),
  phone: Joi.string().max(20).allow('', null),
  officeRoom: Joi.string().max(50).allow('', null),
  title: Joi.string().max(100).required(),
  hireDate: Joi.date().required(),
  departmentId: Joi.number().integer().required()
});

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validate(professorSchema), controller.create);
router.put('/:id', validate(professorSchema), controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
