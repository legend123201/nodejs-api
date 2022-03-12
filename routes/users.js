const express = require("express");
const router = express.Router();
const dbConn = require("../models/db");
const response = require("../ultis/response");
const HTTP_CODE = require("../ultis/httpCode");
const RESPONSE_STRING = require("../ultis/responseString");
const loginValidation = require("../validation/loginValidation");
const userValidation = require("../validation/userValidation");

//express mới nhất tích hợp sẵn body parser rồi nên chỉ cần sử dụng 2 dòng dưới đây
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

const routerPath = {
    login: "/login",
    register: "/register",
    getAll: "/",
    getItem: "/:id",
    delete: "/:id",
    put: "/:id",
};

// LOGIN
router.post(routerPath.login, function (req, res) {
    // INPUT LÀ OBJECT CHỨA USERNAME, PASSWORD
    let body = req.body;

    // KIỂM TRA BODY
    if (!body) {
        return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (body)", null);
    } else {
        // KIỂM TRA TÍNH HỢP LỆ CỦA INPUT
        let { isValid, message } = loginValidation(body);
        if (!isValid) {
            return response(res, HTTP_CODE.ERROR_CLIENT, message, null);
        }
    }

    // TRUY VẤN CSDL
    dbConn.query("SELECT * FROM user where username = ? AND password = ?", [body.username, body.password], function (error, results, fields) {
        if (error) {
            return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
        } else {
            // SPECIAL: ko tồn tại login thì nó vẫn tính đây là 1 query hợp lệ (để ý những câu query có where), nên mình xét thêm trường hợp có tìm được id hay là ko
            // KIỂM TRA CÓ TÌM ĐƯỢC RECORD NÀO KHÔNG (QUERY CÓ WHERE)
            // console.log(results[0]); //undefined
            // mình định dùng cách xài result.affectedRows nhưng ko đc, tại thêm xóa sửa nó cho result khác, còn cái get thì result trả về mảng data
            if (!results[0]) {
                return response(res, HTTP_CODE.NOT_FOUND, RESPONSE_STRING.LOGIN_FAILED, results);
            } else {
                return response(res, HTTP_CODE.SUCCESS, RESPONSE_STRING.LOGIN_SUCCESS, results);
            }
        }
    });
});

// REGISTER
router.post(routerPath.register, function (req, res) {
    // INPUT LÀ THÔNG TIN CỦA 1 RECORD MỚI
    let body = req.body;

    // KIỂM TRA BODY
    if (!body) {
        return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (body)", null);
    } else {
        // KIỂM TRA TÍNH HỢP LỆ CỦA INPUT
        let { isValid, message } = userValidation(body);
        if (!isValid) {
            return response(res, HTTP_CODE.ERROR_CLIENT, message, null);
        }
    }

    // TRUY VẤN CSDL
    dbConn.query("INSERT INTO user SET ? ", body, function (error, results, fields) {
        if (error) {
            return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
        } else {
            return response(res, HTTP_CODE.SUCCESS_CREATE, RESPONSE_STRING.POST_SUCCESS, results);
        }
    });
});

// LẤY TOÀN BỘ DANH SÁCH
router.get(routerPath.getAll, function (req, res) {
    //KO CÓ INPUT, TIẾN HÀNH TRUY VẤN CSDL LUÔN
    dbConn.query("SELECT * FROM user", function (error, results, fields) {
        //if (error) throw error;
        if (error) {
            return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
        } else {
            // bảng không có record nào thì results là mảng rỗng => hợp lý
            return response(res, HTTP_CODE.SUCCESS, RESPONSE_STRING.GET_SUCCESS, results);
        }
    });
});

// LẤY 1 RECORD CỦA BẢNG THEO ID
router.get(routerPath.getItem, function (req, res) {
    // INPUT LÀ ID
    let id = req.params.id;

    // KIỂM TRA ID
    if (!id) {
        return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (id)", null);
    }

    // TRUY VẤN CSDL
    dbConn.query("SELECT * FROM user where id=?", id, function (error, results, fields) {
        if (error) {
            return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
        } else {
            // SPECIAL: ko tồn tại id thì nó vẫn tính đây là 1 query hợp lệ (để ý những câu query có where), nên mình xét thêm trường hợp có tìm được id hay là ko
            // KIỂM TRA CÓ TÌM ĐƯỢC RECORD NÀO KHÔNG (QUERY CÓ WHERE)
            // console.log(results[0]); //undefined
            // mình định dùng cách xài result.affectedRows nhưng ko đc, tại thêm xóa sửa nó cho result khác, còn cái get thì result trả về mảng data
            if (!results[0]) {
                return response(res, HTTP_CODE.NOT_FOUND, RESPONSE_STRING.ID_NOT_FOUND, results);
            } else {
                return response(res, HTTP_CODE.SUCCESS, RESPONSE_STRING.GET_ITEM_SUCCESS, results);
            }
        }
    });
});

// XÓA 1 RECORD
router.delete(routerPath.delete, function (req, res) {
    // INPUT LÀ 1 ID
    let id = req.params.id;

    // KIỂM TRA ID
    if (!id) {
        return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (id)", null);
    }

    // TRUY VẤN CSDL
    dbConn.query("DELETE FROM user WHERE id = ?", id, function (error, results, fields) {
        if (error) {
            return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
        } else {
            // KIỂM TRA XÓA ĐƯỢC RECORD NÀO KHÔNG (QUERY CÓ WHERE)
            if (results.affectedRows === 0) {
                return response(res, HTTP_CODE.NOT_FOUND, RESPONSE_STRING.ID_NOT_FOUND, results);
            } else {
                return response(res, HTTP_CODE.SUCCESS, RESPONSE_STRING.DELETE_SUCCESS, results);
            }
        }
    });
});

// SỬA 1 RECORD
router.put(routerPath.put, function (req, res) {
    // INPUT LÀ ID VÀ THÔNG TIN MỚI CỦA RECORD MUỐN SỬA
    let id = req.params.id;
    let body = req.body;

    // KIỂM TRA ID
    if (!id) {
        return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (id)", null);
    }

    // KIỂM TRA BODY
    if (!body) {
        return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (body)", null);
    } else {
        //ktra object có hợp lệ hay không
        let { isValid, message } = userValidation(body);
        if (!isValid) {
            return response(res, HTTP_CODE.ERROR_CLIENT, message, null);
        }
    }

    // TRUY VẤN CSDL
    dbConn.query("UPDATE user SET ? WHERE id = ?", [body, id], function (error, results, fields) {
        if (error) {
            return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
        } else {
            // KIỂM TRA CÓ TÌM ĐƯỢC ID ĐỂ SỬA KO (QUERY CÓ WHERE)
            if (results.affectedRows === 0) {
                return response(res, HTTP_CODE.NOT_FOUND, RESPONSE_STRING.ID_NOT_FOUND, results);
            } else {
                return response(res, HTTP_CODE.SUCCESS, RESPONSE_STRING.PUT_SUCCESS, results);
            }
        }
    });
});

module.exports = router;
