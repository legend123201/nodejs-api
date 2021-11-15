var mysql = require("mysql");

var dbConn = mysql.createConnection({
  host: "localhost",
  user: "sa",
  password: "123",
  database: "express_js_db",
});

dbConn.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});

module.exports = dbConn;
