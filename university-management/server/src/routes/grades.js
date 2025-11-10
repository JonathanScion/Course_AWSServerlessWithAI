const express = require('express');
const router = express.Router();
const BaseController = require('../controllers/baseController');
const Joi = require('joi');
const validate = require('../middleware/validate');

const controller = new BaseController('grade', {
  assignment: {
    include: {
      section: {
        include: {
          course: true
        }
      }
    }
  },
  student: true
});

const gradeSchema = Joi.object({
  assignmentId: Joi.number().integer().required(),
  studentId: Joi.number().integer().required(),
  pointsEarned: Joi.number().min(0).required(),
  submittedAt: Joi.date().allow(null),
  gradedAt: Joi.date().allow(null),
  feedback: Joi.string().allow('', null)
});

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validate(gradeSchema), controller.create);
router.put('/:id', validate(gradeSchema), controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
