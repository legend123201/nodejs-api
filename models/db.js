var mysql = require("mysql");

var dbConn = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "db_selling_food",
});

dbConn.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});

module.exports = dbConn;
