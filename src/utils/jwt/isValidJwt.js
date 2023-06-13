require("dotenv").config();

const jwt = require("jsonwebtoken");

async function isValidJwt(token) {
  if (!token) return false;
  jwt.verify(token, process.env.JWT_TOKEN, function (err, decoded) {
    if (err) {
      console.err(err);
      return false;
    }
    return true;
  });
}

module.exports = isValidJwt;
