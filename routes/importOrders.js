const express = require("express");
const router = express.Router();
const dbConn = require("../models/db");
const response = require("../ultis/response");
const HTTP_CODE = require("../ultis/httpCode");
const RESPONSE_STRING = require("../ultis/responseString");
const importOrderDetailValidation = require("../validation/importOrderDetailValidation");

//express mới nhất tích hợp sẵn body parser rồi nên chỉ cần sử dụng 2 dòng dưới đây
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

const routerPath = {
    getAll: "/",
    post: "/:staffId",
};

// LẤY TOÀN BỘ DANH SÁCH
router.get(routerPath.getAll, function (req, res) {
    //KO CÓ INPUT, TIẾN HÀNH TRUY VẤN CSDL LUÔN
    const sql =
        "SELECT import_order.id, import_order.datetime, import_order.staff_id, staff.name" +
        "\n" +
        "FROM import_order" +
        "\n" +
        "LEFT JOIN staff ON import_order.staff_id = staff.id";
    dbConn.query(sql, function (error, results, fields) {
        //if (error) throw error;
        if (error) {
            return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
        } else {
            // bảng không có record nào thì results là mảng rỗng => hợp lý
            return response(res, HTTP_CODE.SUCCESS, RESPONSE_STRING.GET_SUCCESS, results);
        }
    });
});

// THÊM ĐƠN NHẬP HÀNG SAU ĐÓ THÊM CHI TIẾT
router.post(routerPath.post, function (req, res) {
    // INPUT LÀ STAFFID VÀ MẢNG CHỨA OBJECT LÀ THÔNG TIN RECORD MUỐN THÊM
    let staffId = req.params.staffId;
    let body = req.body;

    // KIỂM TRA STAFFID
    if (!staffId) {
        return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (staffId)", null);
    }

    // KIỂM TRA BODY
    if (!body) {
        return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (body)", null);
    } else {
        // KIỂM TRA CÓ PHẢI MẢNG HAY KO
        if (!Array.isArray(body)) {
            return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.ERROR_DATA, null);
        } else {
            // KIỂM TRA CÓ PHẦN TỬ NÀO KO
            if (body.length === 0) {
                return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (body)", null);
            }
        }

        // KIỂM TRA MẢNG OBJECT CÓ HỢP LỆ KO
        let isError = false;
        let messageError = "";

        body.forEach((value, index) => {
            let { isValid, message } = importOrderDetailValidation(value);
            if (!isValid) {
                isError = true;
                messageError += " - " + message + ` (object index: ${index})`;
            }
        });

        if (isError) {
            return response(res, HTTP_CODE.ERROR_CLIENT, messageError, null);
        }
    }

    // TRUY VẤN CSDL
    // thêm vào đơn nhập trước
    const importOrder = { staff_id: staffId };
    dbConn.query("INSERT INTO import_order SET ? ", importOrder, function (error, results, fields) {
        if (error) {
            return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
        } else {
            // thêm danh sách chi tiết

            // thêm import_order_id mà mình vừa thêm vào từng phần tử trong body
            body = body.map((value, index) => {
                return { ...value, import_order_id: results.insertId };
            });

            // mình đã viết doc phần thêm và xóa nhiều phần tử cùng lúc, hãy tìm và đọc để hiểu rõ code dưới đây
            let keys = Object.keys(body[0]); // lấy các key của phần tử đầu
            let values = body.map((obj) => keys.map((key) => obj[key])); // dòng này giúp mình khớp thứ tự các keys trong object với keys.join(",") trong dòng sql
            let sql = "INSERT INTO import_order_detail (" + keys.join(",") + ") VALUES ?";
            dbConn.query(sql, [values], function (error, results, fields) {
                if (error) {
                    // thêm 1 dòng lỗi thì nó cũng sẽ trả về là lỗi
                    return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
                } else {
                    return response(res, HTTP_CODE.SUCCESS_CREATE, RESPONSE_STRING.POST_SUCCESS, results);
                }
            });
        }
    });
});

module.exports = router;
