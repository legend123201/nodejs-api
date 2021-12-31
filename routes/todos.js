const express = require("express");
const router = express.Router();
const dbConn = require("../models/db");
const response = require("../ultis/response");
const HTTP_CODE = require("../ultis/httpCode");
const RESPONSE_STRING = require("../ultis/responseString");
const todoValidation = require("../validation/todoValidation");

//express mới nhất tích hợp sẵn body parser rồi nên chỉ cần sử dụng 2 dòng dưới đây
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

const routerPath = {
    getAll: "/",
    getItem: "/:id",
    post: "/",
    postMultiple: "/post-multiple",
    delete: "/:id",
    deleteMultiple: "/del-multiple",
    put: "/:id",
};

// LẤY TOÀN BỘ DANH SÁCH
router.get(routerPath.getAll, function (req, res) {
    //KO CÓ INPUT, TIẾN HÀNH TRUY VẤN CSDL LUÔN
    dbConn.query("SELECT * FROM todos", function (error, results, fields) {
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

// LẤY 1 RECORD CỦA BẢNG THEO ID
router.get(routerPath.getItem, function (req, res) {
    // INPUT LÀ ID
    let id = req.params.id;

    // KIỂM TRA ID
    if (!id) {
        return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (id)", null);
    }

    // TRUY VẤN CSDL
    dbConn.query("SELECT * FROM todos where id=?", id, function (error, results, fields) {
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

// THÊM 1 RECORD VÀO BẢNG
router.post(routerPath.post, function (req, res) {
    // INPUT LÀ THÔNG TIN CỦA 1 RECORD MỚI
    let body = req.body;

    // KIỂM TRA BODY
    if (!body) {
        return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (body)", null);
    } else {
        // KIỂM TRA TÍNH HỢP LỆ CỦA INPUT
        let { isValid, message } = todoValidation(body);
        if (!isValid) {
            return response(res, HTTP_CODE.ERROR_CLIENT, message, null);
        }
    }

    // TRUY VẤN CSDL
    dbConn.query("INSERT INTO todos SET ? ", body, function (error, results, fields) {
        if (error) {
            return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
        } else {
            return response(res, HTTP_CODE.SUCCESS_CREATE, RESPONSE_STRING.POST_SUCCESS, results);
        }
    });
});

// THÊM NHIỀU RECORD CÙNG 1 LÚC
router.post(routerPath.postMultiple, function (req, res) {
    // INPUT LÀ MẢNG CHỨA OBJECT LÀ THÔNG TIN RECORD MUỐN THÊM
    let body = req.body;

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
            let { isValid, message } = todoValidation(value);
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
    // mình đã viết doc phần thêm và xóa nhiều phần tử cùng lúc, hãy tìm và đọc để hiểu rõ code dưới đây
    let keys = Object.keys(body[0]); // lấy các key của phần tử đầu
    let values = body.map((obj) => keys.map((key) => obj[key])); // dòng này giúp mình khớp thứ tự các keys trong object với keys.join(",") trong dòng sql
    let sql = "INSERT INTO todos (" + keys.join(",") + ") VALUES ?";
    dbConn.query(sql, [values], function (error, results, fields) {
        if (error) {
            // thêm 1 dòng lỗi thì nó cũng sẽ trả về là lỗi
            return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
        } else {
            return response(res, HTTP_CODE.SUCCESS_CREATE, RESPONSE_STRING.POST_SUCCESS, results);
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
    dbConn.query("DELETE FROM todos WHERE id = ?", id, function (error, results, fields) {
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

// XÓA NHIỀU RECORD CÙNG 1 LÚC
// delete multiple dùng post ko dùng router.delete, vì nó tự hiểu rằng chữ /multiple là id và chạy cái router xóa theo 1 id
router.post(routerPath.deleteMultiple, function (req, res) {
    // INPUT LÀ MẢNG CHỨA 1 ID HOẶC CHỨA OBJECT LÀ THÔNG TIN 2 HOẶC NHIỀU CONDITON (ĐỂ XÓA BẢNG NHIỀU HƠN 1 KHÓA CHÍNH)
    let body = req.body;

    // KIỂM TRA BODY
    if (!body) {
        return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (body)", null);
    } else {
        // KIỂM TRA CÓ PHẢI MẢNG HAY KO
        if (!Array.isArray(body)) {
            return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.ERROR_DATA, null);
        }

        // cần phải ktra xem phần tử mảng có đúng định dạng ko nữa xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    }

    // trường hợp xóa bảng có 1 khóa chính
    // dbConn.query(`DELETE FROM todos WHERE (id) IN (${body.toString()})`, function (error, results, fields) {
    //     if (error) {
    //         return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
    //     } else {
    //         // ko tìm để xóa được thì nó cũng ko xuất lỗi, nên ktra thêm số lượng xóa đã chuẩn hay chưa
    //         if (results.affectedRows === body.length) {
    //             return response(res, HTTP_CODE.SUCCESS, RESPONSE_STRING.DELETE_SUCCESS, results);
    //         } else {
    //             return response(res, HTTP_CODE.NOT_FOUND, RESPONSE_STRING.ID_NOT_FOUND, results);
    //         }
    //     }
    // });

    // TRUY VẤN CSDL
    // đây là trường hợp xóa nhưng phải khớp 2 điều kiện, thích hợp xóa bảng có 2 khóa chính
    let keys = Object.keys(body[0]); // lấy các key của phần tử đầu
    let values = body.map((obj) => keys.map((key) => obj[key]));
    let sql = "DELETE FROM todos WHERE (" + keys.join(",") + ") IN ( ? )";

    dbConn.query(sql, [values], function (error, results, fields) {
        if (error) {
            return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
        } else {
            // ko tìm để xóa được thì nó cũng ko xuất lỗi, nên ktra thêm số lượng xóa đã chuẩn hay chưa
            if (results.affectedRows === body.length) {
                return response(res, HTTP_CODE.SUCCESS, RESPONSE_STRING.DELETE_SUCCESS, results);
            } else {
                return response(res, HTTP_CODE.NOT_FOUND, RESPONSE_STRING.ID_NOT_FOUND, results);
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
        let { isValid, message } = todoValidation(body);
        if (!isValid) {
            return response(res, HTTP_CODE.ERROR_CLIENT, message, null);
        }
    }

    // TRUY VẤN CSDL
    dbConn.query("UPDATE todos SET ? WHERE id = ?", [body, id], function (error, results, fields) {
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

/*
connection.query({
  sql: 'SELECT * FROM `books` WHERE `author` = ?',
  timeout: 40000, // 40s
  values: ['David']
}, function (error, results, fields) {
  // error will be an Error if one occurred during the query
  // results will contain the results of the query
  // fields will contain information about the returned results fields (if any)
});

connection.query('UPDATE todos SET foo = ?, bar = ?, baz = ? WHERE id = ?', ['a', 'b', 'c', todoId], function (error, results, fields) {
  if (error) throw error;
  // ...
});
*/
