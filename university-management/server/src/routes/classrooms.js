const express = require('express');
const router = express.Router();
const BaseController = require('../controllers/baseController');
const Joi = require('joi');
const validate = require('../middleware/validate');

const controller = new BaseController('classroom', {
  building: true
});

const classroomSchema = Joi.object({
  roomNumber: Joi.string().max(20).required(),
  buildingId: Joi.number().integer().required(),
  capacity: Joi.number().integer().min(1).required(),
  hasProjector: Joi.boolean(),
  hasWhiteboard: Joi.boolean(),
  hasComputers: Joi.boolean(),
  floor: Joi.number().integer().required()
});

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validate(classroomSchema), controller.create);
router.put('/:id', validate(classroomSchema), controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
