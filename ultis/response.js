const HTTP_CODE = require("../ultis/httpCode");

const response = (res, statusCode, message, data) => {
  return res.status(statusCode).send({
    isError:
      statusCode === HTTP_CODE.SUCCESS ||
      statusCode === HTTP_CODE.SUCCESS_CREATE
        ? false
        : true,
    message: message,
    data: data || "",
  });
};

module.exports = response;
