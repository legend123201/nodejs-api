const express = require("express");
const router = express.Router();
const dbConn = require("../models/db");
const response = require("../ultis/response");
const HTTP_CODE = require("../ultis/httpCode");
const RESPONSE_STRING = require("../ultis/responseString");
const loginValidation = require("../validation/loginValidation");

//express mới nhất tích hợp sẵn body parser rồi nên chỉ cần sử dụng 2 dòng dưới đây
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

const routerPath = {
    login: "/login",
    getItem: "/:id",
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
    dbConn.query("SELECT * FROM staff where username = ? AND password = ?", [body.username, body.password], function (error, results, fields) {
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

// LẤY 1 RECORD CỦA BẢNG THEO ID
router.get(routerPath.getItem, function (req, res) {
    // INPUT LÀ ID
    let id = req.params.id;

    // KIỂM TRA ID
    if (!id) {
        return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (id)", null);
    }

    // TRUY VẤN CSDL
    dbConn.query("SELECT * FROM staff where id=?", id, function (error, results, fields) {
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

module.exports = router;
