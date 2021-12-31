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
    getItemsByImportOrderId: "/:id",
};

// LẤY TOÀN BỘ DANH SÁCH
router.get(routerPath.getAll, function (req, res) {
    //KO CÓ INPUT, TIẾN HÀNH TRUY VẤN CSDL LUÔN
    dbConn.query("SELECT * FROM import_order_detail", function (error, results, fields) {
        //if (error) throw error;
        if (error) {
            return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
        } else {
            // bảng không có record nào thì results là mảng rỗng => hợp lý
            return response(res, HTTP_CODE.SUCCESS, RESPONSE_STRING.GET_SUCCESS, results);
        }
    });
});

// LẤY DANH SÁCH THEO IMPORT ORDER ID
router.get(routerPath.getItemsByImportOrderId, function (req, res) {
    // INPUT LÀ ID
    let id = req.params.id;

    // KIỂM TRA ID
    if (!id) {
        return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (id)", null);
    }

    // TRUY VẤN CSDL
    dbConn.query("SELECT * FROM import_order_detail WHERE import_order_id = ?", id, function (error, results, fields) {
        if (error) {
            return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
        } else {
            // bảng không có record nào thì results là mảng rỗng => hợp lý
            return response(res, HTTP_CODE.SUCCESS, RESPONSE_STRING.GET_SUCCESS, results);
        }
    });
});

module.exports = router;
