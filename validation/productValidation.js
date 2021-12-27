const Joi = require("joi");

const schema = Joi.object({
    id: Joi.number(),
    name: Joi.string().min(1).required(),
    quantity_in_stock: Joi.number().min(1).required(),
    unit_perchase_price: Joi.number().min(1).required(),
    unit_sale_price: Joi.number().min(1).required(),
    measure_unit: Joi.string().min(1).required(),
    image: Joi.string().min(1).required(),
});

const productValidation = (product) => {
    // mặc dù để id ở đây thì khi thêm và sửa sql tự loại id ra (đã test thử ko có dòng này), nhưng mình cứ thêm vô cho chắc ăn
    // dòng này cũng chứng minh thì truyền 1 biến đó vô từ bên ngoài, mình hoàn toàn có thể sửa giá trị của nó, bên ngoài cùng bị thay đổi luôn
    delete product.id;
    const { error } = schema.validate(product);
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

module.exports = productValidation;
