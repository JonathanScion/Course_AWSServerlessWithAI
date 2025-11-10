const express = require('express');
const router = express.Router();
const BaseController = require('../controllers/baseController');
const Joi = require('joi');
const validate = require('../middleware/validate');

const controller = new BaseController('assignment', {
  section: {
    include: {
      course: true
    }
  }
});

const assignmentSchema = Joi.object({
  title: Joi.string().max(200).required(),
  description: Joi.string().allow('', null),
  sectionId: Joi.number().integer().required(),
  dueDate: Joi.date().required(),
  totalPoints: Joi.number().integer().min(1).required(),
  type: Joi.string().valid('homework', 'exam', 'project', 'quiz').required()
});

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validate(assignmentSchema), controller.create);
router.put('/:id', validate(assignmentSchema), controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
