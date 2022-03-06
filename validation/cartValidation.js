const Joi = require("joi");

const schema = Joi.object({
    user_id: Joi.number().min(0).required(),
    product_id: Joi.number().min(0).required(),
    quantity: Joi.number().min(1).required(),
    datetime: Joi.any(),
});

const cartValidation = (cart) => {
    const { error } = schema.validate(cart);
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

module.exports = cartValidation;
