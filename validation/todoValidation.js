const Joi = require("joi");

const schema = Joi.object({
    id: Joi.number(),
    value: Joi.string().min(1).required(),
    status: Joi.string().min(1).required(),
});

const todoValidation = (todo) => {
    // mặc dù để id ở đây thì khi thêm và sửa sql tự loại id ra (đã test thử ko có dòng này), nhưng mình cứ thêm vô cho chắc ăn
    // dòng này cũng chứng minh thì truyền 1 biến đó vô từ bên ngoài, mình hoàn toàn có thể sửa giá trị của nó, bên ngoài cùng bị thay đổi luôn
    delete todo.id;
    const { error } = schema.validate(todo);
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

module.exports = todoValidation;
