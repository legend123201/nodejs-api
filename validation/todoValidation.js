const Joi = require("joi");

const schema = Joi.object({
  username: Joi.string().min(1).required(),
  status: Joi.string().min(1).required(),
});

const todoValidation = (todo) => {
  const { value, error } = schema.validate(todo);
  if (error) {
    return error;
  } else {
    return value;
  }
};

todoValidation({});
