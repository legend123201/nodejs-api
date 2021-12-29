const Joi = require("joi");

const schema = Joi.object({
    username: Joi.string().min(1).required(),
    password: Joi.string().min(1).required(),
});

const loginValidation = (loginBody) => {
    const { error } = schema.validate(loginBody);
    if (error) {
        return {
            isValid: false,
            message: error.details[0].message,
        };
    } else {
        return {
            isValid: true,
            message: "",
        };
    }
};

module.exports = loginValidation;
