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
    getAllSalePage: "/salepage/userId/:id",
    addBill: "/userId/:id",
    approveBill: "/staffId/:staffId/billId/:billId",
};

// LẤY TOÀN BỘ DANH SÁCH TRONG DASHBOARD
router.get(routerPath.getAll, function (req, res) {
    //KO CÓ INPUT, TIẾN HÀNH TRUY VẤN CSDL LUÔN
    const sql =
        "SELECT bill.id, bill.datetime, bill.user_id, user.name as user_name, bill.staff_id, staff.name as staff_name, IF(bill.staff_id IS NULL,0,1) AS isApproved" +
        "\n" +
        "FROM bill" +
        "\n" +
        "LEFT JOIN user ON bill.user_id = user.id" +
        "\n" +
        " LEFT JOIN staff ON bill.staff_id = staff.id";
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

// LẤY TOÀN BỘ DANH SÁCH TRONG SALEPAGE
router.get(routerPath.getAllSalePage, function (req, res) {
    // INPUT LÀ USER ID
    let id = req.params.id;

    // KIỂM TRA ID
    if (!id) {
        return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (id)", null);
    }

    const sql =
        "SELECT bill_id, datetime, staff_id, SUM(current_unit_sale_price * quantity) as total, IF(staff_id IS NULL,0,1) AS isApproved" +
        "\n" +
        "FROM bill, bill_detail" +
        "\n" +
        "WHERE bill.id = bill_detail.bill_id and bill.user_id = ?" +
        "\n" +
        "GROUP BY bill_id" +
        "\n" +
        "ORDER BY datetime DESC";
    dbConn.query(sql, id, function (error, results, fields) {
        //if (error) throw error;
        if (error) {
            return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
        } else {
            // bảng không có record nào thì results là mảng rỗng => hợp lý
            return response(res, HTTP_CODE.SUCCESS, RESPONSE_STRING.GET_SUCCESS, results);
        }
    });
});

// THÊM BILL
router.get(routerPath.addBill, function (req, res) {
    // INPUT LÀ USER ID
    let id = req.params.id;

    // KIỂM TRA ID
    if (!id) {
        return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (id)", null);
    }

    // KIỂM TRA SỐ LƯỢNG TỒN
    // lấy tất cả product
    dbConn.query("SELECT * FROM product", function (error, results, fields) {
        if (error) {
            return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
        } else {
            const productList = results;

            // lấy tất cả sản phẩm trong cart
            dbConn.query("SELECT * FROM cart WHERE user_id = ?", id, function (error, results, fields) {
                if (error) {
                    return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
                } else {
                    const cartList = results;

                    // ktra slt
                    for (let i = 0; i < cartList.length; i++) {
                        for (let j = 0; j < productList.length; j++) {
                            if (cartList[i].product_id === productList[j].id) {
                                if (cartList[i].quantity > productList[j].quantity_in_stock) {
                                    return response(res, HTTP_CODE.ERROR_CLIENT, "Not enough quantity! (" + productList[j].name + ")", results);
                                }
                            }
                        }
                    }

                    // THÊM BILL
                    const newBill = {
                        user_id: id,
                    };

                    dbConn.query("INSERT INTO bill SET ? ", newBill, function (error, results, fields) {
                        if (error) {
                            return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
                        } else {
                            const newBillId = results.insertId;
                            let newBillDetailList = [];

                            // THÊM BILL DETAIL
                            for (let i = 0; i < cartList.length; i++) {
                                for (let j = 0; j < productList.length; j++) {
                                    if (cartList[i].product_id === productList[j].id) {
                                        newBillDetailList.push({
                                            bill_id: newBillId,
                                            product_id: cartList[i].product_id,
                                            quantity: cartList[i].quantity,
                                            current_unit_sale_price: productList[j].unit_sale_price,
                                        });
                                    }
                                }
                            }

                            console.log(newBillDetailList);

                            let keys = Object.keys(newBillDetailList[0]); // lấy các key của phần tử đầu
                            let values = newBillDetailList.map((obj) => keys.map((key) => obj[key])); // dòng này giúp mình khớp thứ tự các keys trong object với keys.join(",") trong dòng sql
                            let sql = "INSERT INTO bill_detail (" + keys.join(",") + ") VALUES ?";
                            dbConn.query(sql, [values], function (error, results, fields) {
                                if (error) {
                                    // thêm 1 dòng lỗi thì nó cũng sẽ trả về là lỗi
                                    return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
                                } else {
                                    // XÓA TẤT CẢ CART CỦA USER
                                    dbConn.query("DELETE FROM cart WHERE user_id = ?", id, function (error, results, fields) {
                                        if (error) {
                                            return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
                                        } else {
                                            // KIỂM TRA XÓA ĐƯỢC RECORD NÀO KHÔNG (QUERY CÓ WHERE)
                                            if (results.affectedRows === 0) {
                                                return response(res, HTTP_CODE.NOT_FOUND, RESPONSE_STRING.ID_NOT_FOUND, results);
                                            } else {
                                                //THÊM BILL THÀNH CÔNG!!!
                                                return response(res, HTTP_CODE.SUCCESS_CREATE, RESPONSE_STRING.POST_SUCCESS, results);
                                            }
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});

// SỬA 1 RECORD
router.put(routerPath.approveBill, function (req, res) {
    // INPUT LÀ STAFF ID VÀ BILL ID
    let staffId = req.params.staffId;
    let billId = req.params.billId;

    // KIỂM TRA ID
    if (!staffId) {
        return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (staffId)", null);
    }

    if (!billId) {
        return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (billId)", null);
    }

    // TRUY VẤN CSDL
    dbConn.query("UPDATE bill SET staff_id = ? WHERE id = ?", [staffId, billId], function (error, results, fields) {
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
