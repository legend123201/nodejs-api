const Joi = require("joi");

const schema = Joi.object({
    name: Joi.string().min(1).required(),
    phone: Joi.string().min(1).required(),
    email: Joi.string().min(1).required(),
    address: Joi.string().min(1).required(),
    username: Joi.string().min(1).required(),
    password: Joi.string().min(1).required(),
});

const userValidation = (user) => {
    // mặc dù để id ở đây thì khi thêm và sửa sql tự loại id ra (đã test thử ko có dòng này), nhưng mình cứ thêm vô cho chắc ăn
    // dòng này cũng chứng minh thì truyền 1 biến đó vô từ bên ngoài, mình hoàn toàn có thể sửa giá trị của nó, bên ngoài cùng bị thay đổi luôn
    delete user.id;
    const { error } = schema.validate(user);
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

module.exports = userValidation;
