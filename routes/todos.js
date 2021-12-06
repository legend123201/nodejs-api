const express = require("express");
const router = express.Router();
const dbConn = require("../models/db");
const response = require("../ultis/response");
const HTTP_CODE = require("../ultis/httpCode");
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
      return response(
        res,
        HTTP_CODE.SUCCESS,
        "Get todo list success!",
        results
      );
    }
  });
});

router.get(routerPath.getItem, function (req, res) {
  let todo_id = req.params.id;
  if (!todo_id) {
    return response(res, HTTP_CODE.ERROR_CLIENT, "Please provide todo_id!", "");
  }
  dbConn.query(
    "SELECT * FROM todos where id=?",
    todo_id,
    function (error, results, fields) {
      if (error) {
        return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
      } else {
        //ko tồn tại id thì nó vẫn tính đây là 1 query hợp lệ, nên mình xét thêm trường hợp có tìm được id hay là ko
        //console.log(results[0]); //undefined
        //mình định dùng cách xài result.affectedRows nhưng ko đc, tại thêm xóa sửa nó cho result khác, còn cái get thì result trả về mảng data
        if (!results[0]) {
          return response(
            res,
            HTTP_CODE.NOT_FOUND,
            "Id không tồn tại!",
            results
          );
        } else {
          return response(res, HTTP_CODE.SUCCESS, "Get todo success!", results);
        }
      }
    }
  );
});

router.post(routerPath.post, function (req, res) {
  let todo = req.body;
  // ktra có body hay là không
  if (!todo) {
    return response(res, HTTP_CODE.ERROR_CLIENT, "Please provide todo!", "");
  } else {
    //ktra object có hợp lệ hay không
    let { isValid, message } = todoValidation(todo);
    if (!isValid) {
      return response(res, HTTP_CODE.ERROR_CLIENT, message, "");
    }
  }
  dbConn.query(
    "INSERT INTO todos SET ? ",
    todo,
    function (error, results, fields) {
      if (error) {
        return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
      } else {
        return response(
          res,
          HTTP_CODE.SUCCESS_CREATE,
          "New todo has been created successfully.",
          results
        );
      }
    }
  );
});

router.delete(routerPath.delete, function (req, res) {
  let todo_id = req.params.id;
  if (!todo_id) {
    return response(res, HTTP_CODE.ERROR_CLIENT, "Please provide todo_id", "");
  }
  dbConn.query(
    "DELETE FROM todos WHERE id = ?",
    [todo_id],
    function (error, results, fields) {
      if (error) {
        return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
      } else {
        if (results.affectedRows === 0) {
          return response(
            res,
            HTTP_CODE.NOT_FOUND,
            "Id không tồn tại!",
            results
          );
        } else {
          return response(
            res,
            HTTP_CODE.SUCCESS,
            "Todo has been deleted successfully!",
            results
          );
        }
      }
    }
  );
});

router.put(routerPath.put, function (req, res) {
  let todo_id = req.params.id;
  let todo = req.body;

  //ktra có id hay ko
  if (!todo_id) {
    return response(res, HTTP_CODE.ERROR_CLIENT, "Please provide todo_id!", "");
  }
  // ktra có body hay là không
  if (!todo) {
    return response(res, HTTP_CODE.ERROR_CLIENT, "Please provide todo!", "");
  } else {
    //ktra object có hợp lệ hay không
    let { isValid, message } = todoValidation(todo);
    if (!isValid) {
      return response(res, HTTP_CODE.ERROR_CLIENT, message, "");
    }
  }
  dbConn.query(
    "UPDATE todos SET ? WHERE id = ?",
    [todo, todo_id],
    function (error, results, fields) {
      if (error) {
        return response(res, HTTP_CODE.ERROR_SERVER, error.sqlMessage, results);
      } else {
        if (results.affectedRows === 0) {
          return response(
            res,
            HTTP_CODE.NOT_FOUND,
            "Id không tồn tại!",
            results
          );
        } else {
          return response(
            res,
            HTTP_CODE.SUCCESS,
            "Todo has been updated successfully!",
            results
          );
        }
      }
    }
  );
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
