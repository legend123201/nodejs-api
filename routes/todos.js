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
    delete: "/:id",
    put: "/:id",
    postMultiple: "/post-multiple",
    deleteMultiple: "/del-multiple",
};

router.get(routerPath.getAll, function (req, res) {
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

router.get(routerPath.getItem, function (req, res) {
    let id = req.params.id;
    if (!id) {
        return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (id)", null);
    }
    dbConn.query("SELECT * FROM todos where id=?", id, function (error, results, fields) {
        if (error) {
            return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
        } else {
            //ko tồn tại id thì nó vẫn tính đây là 1 query hợp lệ (để ý những câu query có where), nên mình xét thêm trường hợp có tìm được id hay là ko
            //console.log(results[0]); //undefined
            //mình định dùng cách xài result.affectedRows nhưng ko đc, tại thêm xóa sửa nó cho result khác, còn cái get thì result trả về mảng data
            if (!results[0]) {
                return response(res, HTTP_CODE.NOT_FOUND, RESPONSE_STRING.ID_NOT_FOUND, results);
            } else {
                return response(res, HTTP_CODE.SUCCESS, RESPONSE_STRING.GET_ITEM_SUCCESS, results);
            }
        }
    });
});

router.post(routerPath.post, function (req, res) {
    let body = req.body;
    // ktra có body hay là không
    if (!body) {
        return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (body)", null);
    } else {
        //ktra object có hợp lệ hay không
        let { isValid, message } = todoValidation(body);
        if (!isValid) {
            return response(res, HTTP_CODE.ERROR_CLIENT, message, null);
        }
    }
    dbConn.query("INSERT INTO todos SET ? ", body, function (error, results, fields) {
        if (error) {
            return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
        } else {
            return response(res, HTTP_CODE.SUCCESS_CREATE, RESPONSE_STRING.POST_SUCCESS, results);
        }
    });
});

router.post(routerPath.postMultiple, function (req, res) {
    let body = req.body;
    // ktra có body hay là không
    if (!body) {
        return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (body)", null);
    } else {
        // kiểm tra body có phải mảng hay không
        if (!Array.isArray(body)) {
            return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.ERROR_DATA, null);
        }

        // ktra mảng object có hợp lệ hay không
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

    // mình đã viết doc phần thêm và xóa nhiều phần tử cùng lúc, hãy tìm và đọc để hiểu rõ code dưới đây
    let table = "todos";
    let keys = Object.keys(body[0]); // lấy các key của phần tử đầu
    let values = body.map((obj) => keys.map((key) => obj[key])); // dòng này giúp mình khớp thứ tự các keys trong object với keys.join(",") trong dòng sql
    let sql = "INSERT INTO " + table + " (" + keys.join(",") + ") VALUES ?";
    dbConn.query(sql, [values], function (error, results, fields) {
        if (error) {
            // thêm 1 dòng lỗi thì nó cũng sẽ trả về là lỗi
            return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
        } else {
            return response(res, HTTP_CODE.SUCCESS_CREATE, RESPONSE_STRING.POST_SUCCESS, results);
        }
    });
});

router.delete(routerPath.delete, function (req, res) {
    console.log("aa");
    let id = req.params.id;
    if (!id) {
        return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (id)", null);
    }
    dbConn.query("DELETE FROM todos WHERE id = ?", id, function (error, results, fields) {
        if (error) {
            return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
        } else {
            if (results.affectedRows === 0) {
                return response(res, HTTP_CODE.NOT_FOUND, RESPONSE_STRING.ID_NOT_FOUND, results);
            } else {
                return response(res, HTTP_CODE.SUCCESS, RESPONSE_STRING.DELETE_SUCCESS, results);
            }
        }
    });
});

// delete multiple dùng post ko dùng router.delete, vì nó tự hiểu rằng chữ /multiple là id và chạy cái router xóa theo 1 id
router.post(routerPath.deleteMultiple, function (req, res) {
    let body = req.body;

    // ktra có body hay là không
    if (!body) {
        return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (body)", null);
    } else {
        // kiểm tra body có phải mảng hay không
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

    // đây là trường hợp xóa nhưng phải khớp 2 điều kiện, thích hợp xóa bảng có 2 khóa chính
    let table = "todos";
    let keys = Object.keys(body[0]); // lấy các key của phần tử đầu
    let values = body.map((obj) => keys.map((key) => obj[key]));
    let sql = "DELETE FROM " + table + " WHERE (" + keys.join(",") + ") IN ( ? )";

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

router.put(routerPath.put, function (req, res) {
    let id = req.params.id;
    let body = req.body;

    //ktra có id hay ko
    if (!id) {
        return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (id)", null);
    }
    // ktra có body hay là không
    if (!body) {
        return response(res, HTTP_CODE.ERROR_CLIENT, RESPONSE_STRING.MISSING_DATA + " (body)", null);
    } else {
        //ktra object có hợp lệ hay không
        let { isValid, message } = todoValidation(body);
        if (!isValid) {
            return response(res, HTTP_CODE.ERROR_CLIENT, message, null);
        }
    }
    dbConn.query("UPDATE todos SET ? WHERE id = ?", [body, id], function (error, results, fields) {
        if (error) {
            return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
        } else {
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
