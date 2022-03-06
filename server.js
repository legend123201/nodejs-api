/*
  Các package:
  npm init --yes
  npm install
  npm install express --save
  npm install mysql --save

  nodemon //lệnh dùng nodemon là: nodemon server.js
*/

var express = require("express");
var app = express();

// cái thư viện này giúp mình sửa lỗi về cors, nghĩa là trang web ko cho mình call api từ local host, 1 chính sách gì đó để bảo vệ
let cors = require("cors");
app.use(cors());

const baseURL = "/api/";
const routerPath = {
    staff: "staffs",
    todo: "todos",
    product: "products",
    user: "users",
    importOrder: "importOrders",
    importOrderDetail: "importOrderDetails",
    bill: "bills",
    billDetail: "billDetails",
    cart: "carts",
};

//import các routers
var staff = require("./routes/staffs");
app.use(baseURL + routerPath.staff, staff);
var todo = require("./routes/todos");
app.use(baseURL + routerPath.todo, todo);
var product = require("./routes/products");
app.use(baseURL + routerPath.product, product);
var user = require("./routes/users");
app.use(baseURL + routerPath.user, user);
var importOrder = require("./routes/importOrders");
app.use(baseURL + routerPath.importOrder, importOrder);
var importOrderDetail = require("./routes/importOrderDetails");
app.use(baseURL + routerPath.importOrderDetail, importOrderDetail);
var bill = require("./routes/bills");
app.use(baseURL + routerPath.bill, bill);
var billDetail = require("./routes/billDetails");
app.use(baseURL + routerPath.billDetail, billDetail);
var cart = require("./routes/cart");
app.use(baseURL + routerPath.cart, cart);

// route not found
app.use("/", (req, res, next) => {
    res.status("404").json({ message: "API Route Not found!" });
});

app.listen(3005, function () {
    console.log("Node app is running on port 3005");
});
module.exports = app;

/*
-- Cấu trúc bảng cho users
CREATE TABLE IF NOT EXISTS users ( id int(11) NOT NULL, name varchar(200) NOT NULL, email varchar(200) NOT NULL, created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ) ENGINE=InnoDB;
ALTER TABLE users ADD PRIMARY KEY (id);
ALTER TABLE users MODIFY id int(11) NOT NULL AUTO_INCREMENT;

INSERT INTO users (id, name, email, created_at) VALUES
  (1, 'Max', 'max@gmail.com', '2020-03-18 23:20:20'),
  (2, 'John', 'john@gmail.com', '2020-03-18 23:45:20'),
  (3, 'David', 'david@gmail.com', '2020-03-18 23:30:20'),
  (4, 'James', 'james@gmail.com', '2020-03-18 23:10:20'),
  (5, 'Shaw', 'shaw@gmail.com', '2020-03-18 23:15:20');
*/
