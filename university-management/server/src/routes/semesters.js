const express = require('express');
const router = express.Router();
const BaseController = require('../controllers/baseController');
const Joi = require('joi');
const validate = require('../middleware/validate');

const controller = new BaseController('semester');

const semesterSchema = Joi.object({
  code: Joi.string().max(20).required(),
  name: Joi.string().max(100).required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required(),
  isActive: Joi.boolean()
});

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validate(semesterSchema), controller.create);
router.put('/:id', validate(semesterSchema), controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
