const express = require("express");
const router = express.Router();
const dbConn = require("../models/db");
const response = require("../ultis/response");
const HTTP_CODE = require("../ultis/httpCode");
const RESPONSE_STRING = require("../ultis/responseString");
const cartValidation = require("../validation/cartValidation");

//express mới nhất tích hợp sẵn body parser rồi nên chỉ cần sử dụng 2 dòng dưới đây
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

const routerPath = {
    getAll: "/user_id/:id",
    post: "/",
    delete: "/userId/:userId/productId/:productId",
    put: "/userId/:userId/productId/:productId",
};

// LẤY TOÀN BỘ DANH SÁCH THEO USER ID
router.get(routerPath.getAll, function (req, res) {
    // INPUT LÀ USER ID
    let id = req.params.id;

    // KIỂM TRA ID
    if (!id) {
        return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (id)", null);
    }

    // TRUY VẤN CSDL
    dbConn.query("SELECT * FROM cart, product WHERE cart.product_id = product.id AND cart.user_id = ?", id, function (error, results, fields) {
        //if (error) throw error;
        if (error) {
            return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
        } else {
            // bảng không có record nào thì results là mảng rỗng => hợp lý
            return response(res, HTTP_CODE.SUCCESS, RESPONSE_STRING.GET_SUCCESS, results);
        }
    });
});

// THÊM 1 RECORD VÀO BẢNG
router.post(routerPath.post, function (req, res) {
    // INPUT LÀ THÔNG TIN CỦA 1 RECORD MỚI
    let body = req.body;

    // KIỂM TRA BODY
    if (!body) {
        return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (body)", null);
    } else {
        // KIỂM TRA TÍNH HỢP LỆ CỦA INPUT
        let { isValid, message } = cartValidation(body);
        if (!isValid) {
            return response(res, HTTP_CODE.ERROR_CLIENT, message, null);
        }
    }

    // TRUY VẤN CSDL
    dbConn.query("INSERT INTO cart SET ? ", body, function (error, results, fields) {
        if (error) {
            return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
        } else {
            return response(res, HTTP_CODE.SUCCESS_CREATE, RESPONSE_STRING.POST_SUCCESS, results);
        }
    });
});

// XÓA 1 RECORD
router.delete(routerPath.delete, function (req, res) {
    // INPUT LÀ USER_ID VÀ PRODUCT_ID
    let userId = req.params.userId;
    let productId = req.params.productId;

    // KIỂM TRA ID
    if (!userId) {
        return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (userId)", null);
    }

    if (!productId) {
        return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (productId)", null);
    }

    // TRUY VẤN CSDL
    dbConn.query("DELETE FROM cart WHERE user_id = ? AND product_id = ?", [userId, productId], function (error, results, fields) {
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
    // INPUT LÀ USER_ID, PRODUCT_ID VÀ QUANTITY CỦA RECORD MUỐN SỬA
    let userId = req.params.userId;
    let productId = req.params.productId;
    let body = req.body;

    // KIỂM TRA ID
    if (!userId) {
        return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (userId)", null);
    }

    if (!productId) {
        return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (productId)", null);
    }

    // KIỂM TRA BODY
    if (!body) {
        return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (body)", null);
    }

    // KIỂM TRA TÍNH HỢP LỆ CỦA BODY
    let { isValid, message } = cartValidation(body);
    if (!isValid) {
        return response(res, HTTP_CODE.ERROR_CLIENT, message, null);
    }

    // TRUY VẤN CSDL
    dbConn.query(
        "UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?",
        [body.quantity, userId, productId],
        function (error, results, fields) {
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
        }
    );
});

module.exports = router;
