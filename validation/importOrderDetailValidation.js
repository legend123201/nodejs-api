const Joi = require("joi");

const schema = Joi.object({
    product_id: Joi.number().required(),
    quantity: Joi.number().min(1).required(),
    current_unit_perchase_price: Joi.number().min(1).required(),
});

const importOrderDetailValidation = (importOrderDetail) => {
    const { error } = schema.validate(importOrderDetail);
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

module.exports = importOrderDetailValidation;
