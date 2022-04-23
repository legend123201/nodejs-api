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
    analyticUser: "/user",
    analyticBill: "/bill",
    analyticRevenueByMonth: "/revenue",
};

// THỐNG KÊ SỐ USER
router.get(routerPath.analyticUser, function (req, res) {
    //KO CÓ INPUT, TIẾN HÀNH TRUY VẤN CSDL LUÔN
    dbConn.query("SELECT COUNT(*) as totalUser FROM user", function (error, results, fields) {
        //if (error) throw error;
        if (error) {
            //console.log(error); // -> vài thuộc tính, nên xem
            //console.log(typeof error); // -> object
            //console.log(results); // -> undefined do có error
            /*
            //code cũ
            return res.send({
              error: true,
              message: error.sqlMessage,
              data: results || "",
            });
            */
            return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
        } else {
            // bảng không có record nào thì results là mảng rỗng => hợp lý
            return response(res, HTTP_CODE.SUCCESS, RESPONSE_STRING.GET_SUCCESS, results);
        }
    });
});

// THỐNG KÊ SỐ ĐƠN HÀNG ĐÃ BÁN
router.get(routerPath.analyticBill, function (req, res) {
    //KO CÓ INPUT, TIẾN HÀNH TRUY VẤN CSDL LUÔN
    dbConn.query("SELECT COUNT(*) as totalBill FROM bill WHERE staff_id IS NOT NULL", function (error, results, fields) {
        if (error) {
            return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
        } else {
            // bảng không có record nào thì results là mảng rỗng => hợp lý
            return response(res, HTTP_CODE.SUCCESS, RESPONSE_STRING.GET_SUCCESS, results);
        }
    });
});

// THỐNG KÊ DOANH THU THEO THÁNG
router.get(routerPath.analyticRevenueByMonth, function (req, res) {
    //KO CÓ INPUT, TIẾN HÀNH TRUY VẤN CSDL LUÔN
    const sql =
        "SELECT bill_id, datetime, SUM(quantity * current_unit_sale_price) as billPrice" +
        "\n" +
        "FROM bill, bill_detail" +
        "\n" +
        "WHERE bill.id = bill_detail.bill_id AND staff_id IS NOT NULL" +
        "\n" +
        "GROUP BY bill.id";
    dbConn.query(sql, function (error, results, fields) {
        if (error) {
            return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
        } else {
            let listBillAndPrice = results;
            let analyticRevenueByMonth = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            const currentYear = new Date().getFullYear();

            listBillAndPrice.forEach((item) => {
                const yearOfBill = new Date(item.datetime).getFullYear();
                const monthOfBill = new Date(item.datetime).getMonth();

                if (yearOfBill === currentYear) {
                    analyticRevenueByMonth[monthOfBill] += item.billPrice;
                }
            });

            return response(res, HTTP_CODE.SUCCESS, RESPONSE_STRING.GET_SUCCESS, analyticRevenueByMonth);
        }
    });
});

module.exports = router;
