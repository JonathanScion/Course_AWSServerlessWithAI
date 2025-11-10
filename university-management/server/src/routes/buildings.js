const express = require('express');
const router = express.Router();
const BaseController = require('../controllers/baseController');
const Joi = require('joi');
const validate = require('../middleware/validate');

const controller = new BaseController('building');

const buildingSchema = Joi.object({
  code: Joi.string().max(10).required(),
  name: Joi.string().max(200).required(),
  address: Joi.string().max(300).required(),
  floors: Joi.number().integer().min(1).required(),
  hasElevator: Joi.boolean(),
  builtYear: Joi.number().integer().min(1800).max(new Date().getFullYear()).allow(null)
});

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validate(buildingSchema), controller.create);
router.put('/:id', validate(buildingSchema), controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
