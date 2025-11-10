/**
 * Validation middleware factory
 * Uses Joi schemas to validate request data
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      error.isJoi = true;
      return next(error);
    }

    next();
  };
};

module.exports = validate;
