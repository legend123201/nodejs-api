const express = require("express");
const router = express.Router();
const dbConn = require("../models/db");
const response = require("../ultis/response");
const HTTP_CODE = require("../ultis/httpCode");
const RESPONSE_STRING = require("../ultis/responseString");

//express mới nhất tích hợp sẵn body parser rồi nên chỉ cần sử dụng 2 dòng dưới đây
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

const routerPath = {
    getItemsByBillId: "/:id",
};

// LẤY DANH SÁCH THEO BILL ID
router.get(routerPath.getItemsByBillId, function (req, res) {
    // INPUT LÀ ID
    let id = req.params.id;

    // KIỂM TRA ID
    if (!id) {
        return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (id)", null);
    }

    // TRUY VẤN CSDL

    const sql =
        "SELECT bill_detail.product_id, bill_detail.quantity, bill_detail.current_unit_sale_price, product.name" +
        "\n" +
        "FROM bill_detail" +
        "\n" +
        "LEFT JOIN product ON bill_detail.product_id = product.id" +
        "\n" +
        "WHERE bill_detail.bill_id = ?";
    dbConn.query(sql, id, function (error, results, fields) {
        if (error) {
            return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
        } else {
            // bảng không có record nào thì results là mảng rỗng => hợp lý
            return response(res, HTTP_CODE.SUCCESS, RESPONSE_STRING.GET_SUCCESS, results);
        }
    });
});

module.exports = router;
