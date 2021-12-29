const express = require("express");
const router = express.Router();
const dbConn = require("../models/db");
const response = require("../ultis/response");
const HTTP_CODE = require("../ultis/httpCode");
const RESPONSE_STRING = require("../ultis/responseString");
const productValidation = require("../validation/productValidation");

//express mới nhất tích hợp sẵn body parser rồi nên chỉ cần sử dụng 2 dòng dưới đây
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

const routerPath = {
    getAll: "/",
    delete: "/:id",
};

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

module.exports = router;
