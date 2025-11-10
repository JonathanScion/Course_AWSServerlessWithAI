const express = require('express');
const router = express.Router();
const BaseController = require('../controllers/baseController');
const Joi = require('joi');
const validate = require('../middleware/validate');

const controller = new BaseController('enrollment', {
  student: true,
  section: {
    include: {
      course: {
        include: {
          department: true
        }
      },
      semester: true,
      professor: true
    }
  }
});

const enrollmentSchema = Joi.object({
  studentId: Joi.number().integer().required(),
  sectionId: Joi.number().integer().required(),
  enrolledAt: Joi.date(),
  status: Joi.string().valid('enrolled', 'dropped', 'completed'),
  finalGrade: Joi.string().max(5).allow('', null),
  gradePoints: Joi.number().min(0).max(4).allow(null)
});

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validate(enrollmentSchema), controller.create);
router.put('/:id', validate(enrollmentSchema), controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
